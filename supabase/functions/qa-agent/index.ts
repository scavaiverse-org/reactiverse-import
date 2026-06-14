import { corsHeaders } from '../_shared/cors.ts';
import { getAuthUser, getServiceRoleClient } from '../_shared/supabase-client.ts';
import { TENANT_ADMIN_ROLES } from '../_shared/rbac.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

// QA Agent dispatcher — replaces Base44 agents:
//   operational_tester, visitor_tester, accessibility_tester, tenant_isolation_tester
// Requires ANTHROPIC_API_KEY set in Supabase Edge Function secrets.

const AGENT_CONFIGS: Record<string, { name: string; system: string }> = {
  operational_tester: {
    name: 'Operational Tester',
    system: `You are Agent A: Operational Tester. You behave like a museum administrator.
Run only deterministic checks. Do not mark tests passed without executing the check.
Every executed test must be recorded as a TesterFeedback result.
Validate: admin-to-public synchronisation, CRUD persistence, tenant isolation, analytics event creation, and launch readiness behaviour.
Output only PASS, FAIL, or WARNING with evidence, issue, severity, and recommended fix.
If you cannot execute a test, write a WARNING or NOT_RUN record explaining the blocker; never invent success.
Respond with a JSON array of TesterFeedback objects.`,
  },
  visitor_tester: {
    name: 'Visitor Tester',
    system: `You are Agent B: Visitor Tester. You behave like a first-time museum visitor.
Run only deterministic checks. Do not mark tests passed without executing the check.
Every executed test must be recorded as a TesterFeedback result.
Validate: route crawl, CTA behaviour, onboarding flow, walkthrough flow, mobile viewport expectations, and accessibility controls.
Output only PASS, FAIL, or WARNING with evidence, issue, severity, and recommended fix.
Respond with a JSON array of TesterFeedback objects.`,
  },
  accessibility_tester: {
    name: 'Accessibility Tester',
    system: `You are Agent C: Accessibility Tester. Run only deterministic accessibility checks.
Do not mark a check passed unless it is executed.
Every executed test must be recorded as a TesterFeedback result.
Validate: reduced motion, calm mode, larger text, contrast, overlays close behaviour, and keyboard reachability.
If a browser-only check cannot be executed, create a MANUAL_QA_REQUIRED record with evidence, severity, and recommended fix.
Respond with a JSON array of TesterFeedback objects.`,
  },
  tenant_isolation_tester: {
    name: 'Tenant Isolation Tester',
    system: `You are Agent D: Tenant Isolation Tester. Run only deterministic tenant isolation checks.
Do not mark a check passed unless it is executed.
Validate: Tenant A does not affect Tenant B, public content remains tenant-specific, analytics remains tenant-specific.
If a browser-only check cannot be executed, create a MANUAL_QA_REQUIRED record with evidence, severity, and recommended fix.
Respond with a JSON array of TesterFeedback objects.`,
  },
};

interface TesterFeedbackRecord {
  agent_name: string;
  test_category: string;
  page?: string;
  route?: string;
  expected_result?: string;
  actual_result?: string;
  status: string;
  severity: string;
  summary: string;
  details?: string;
  recommended_fix?: string;
  timestamp: string;
  tenant_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Each run calls the Anthropic API (billable); cap per-IP to limit cost from
  // a compromised admin token.
  if (!(await checkRateLimit(req, 'qa-agent', 5, 60))) {
    return rateLimitResponse();
  }

  try {
    const user = await getAuthUser(req);
    if (!user || !TENANT_ADMIN_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'QA agents not configured. Set ANTHROPIC_API_KEY in Edge Function secrets.' }, { status: 503, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { agent = 'operational_tester', context = '', tenant_id = '', save_results = false } = body;

    const agentConfig = AGENT_CONFIGS[agent];
    if (!agentConfig) {
      return Response.json({ error: `Unknown agent: ${agent}. Valid: ${Object.keys(AGENT_CONFIGS).join(', ')}` }, { status: 400, headers: corsHeaders });
    }

    const userPrompt = context
      ? `Run your checks against this context:\n${context}`
      : 'Run your standard deterministic checks. For any check you cannot verify programmatically, produce a MANUAL_QA_REQUIRED entry.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: agentConfig.system,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText);
      return Response.json({ error: `Anthropic API error: ${err}` }, { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text || '[]';

    // Parse JSON from the response (agent returns a JSON array)
    let feedbackItems: TesterFeedbackRecord[] = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      feedbackItems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      feedbackItems = [{
        agent_name: agentConfig.name,
        test_category: 'parse_error',
        status: 'WARNING',
        severity: 'medium',
        summary: 'Agent response could not be parsed as JSON.',
        details: rawText.slice(0, 500),
        timestamp: new Date().toISOString(),
      }];
    }

    // Stamp required fields
    const timestamp = new Date().toISOString();
    feedbackItems = feedbackItems.map((item) => ({
      ...item,
      agent_name: item.agent_name || agentConfig.name,
      timestamp: item.timestamp || timestamp,
      tenant_id: item.tenant_id || tenant_id || undefined,
    }));

    // Optionally persist to tester_feedback table
    if (save_results && feedbackItems.length > 0) {
      const service = getServiceRoleClient();
      const { error: insertError } = await service.from('tester_feedback').insert(feedbackItems);
      if (insertError) {
        console.error('[qa-agent] failed to persist results:', insertError.message);
      }
    }

    return Response.json({ agent, count: feedbackItems.length, results: feedbackItems }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
