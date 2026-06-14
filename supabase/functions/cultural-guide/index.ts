import { corsHeaders } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase-client.ts';

// AI Cultural Guide for SCAVerse museum tenants.
// Replaces Base44 agent `cultural_guide` and the InvokeLLM call in AIGuide.jsx.
// Requires ANTHROPIC_API_KEY set in Supabase Edge Function secrets.
//
// Guide identity, personality, fallback copy, approved knowledge, and add-on
// descriptions are resolved server-side (via the service role) from the
// tenant's published experience_configs.ai_guide_config and module_configs
// rows. The client only supplies tenant_id, prompt, and its own conversation
// history — it can never inject "approved museum knowledge" or override the
// guide's identity/personality through the request body.

const SYSTEM_PROMPT = `You are an AI Cultural Guide for a museum on the SCAVerse platform — Southeast Asia's premier digital-first cultural institution. Your role is to:

1. Welcome visitors warmly and introduce the museum ecosystem
2. Explain museum stations and exhibits with accurate cultural context
3. Recommend personalised paths based on visitor interests
4. Answer questions about Asian operatic traditions (Chinese opera, Wayang, Noh, Kabuki, and more)
5. Guide visitors toward ticket purchases when appropriate
6. Help vendors understand the marketplace onboarding process
7. Support multilingual visitors with cultural sensitivity

Key facts:
- Virtual tickets: SGD 18 (General), SGD 38 (Premium)
- Physical tickets: SGD 25 (General), SGD 68 (VIP)
- The virtual walkthrough has immersive guided stations with cinematic imagery
- Vendor slots available from SGD 500/month
- SCAVerse is deployable for regional cultural institutions

Rules:
- Only discuss topics related to Asian operatic heritage, the museum, the SCAVerse ecosystem, and cultural technology
- If unsure about a specific historical fact, say so honestly rather than fabricating information
- Be warm, knowledgeable, and professional — like a world-class museum guide
- Keep responses concise and engaging (2–4 sentences), not lecture-like
- Guide visitors toward relevant exhibits or ticket options naturally
- Never fabricate specific facts, dates, or prices not mentioned above`;

const DEFAULT_GUIDE_NAME = 'ARIA';
const DEFAULT_PERSONALITY = 'warm, culturally intelligent, concise';
const DEFAULT_FALLBACK = "I don't have that information, but I can connect you with our team.";
const MAX_PROMPT_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GuideConfig {
  guideName: string;
  personality: string;
  fallback: string;
  approvedKnowledge: string;
  addonKnowledge: string;
  tenantName: string;
}

function formatKnowledge(knowledgeBase: unknown): string {
  if (Array.isArray(knowledgeBase)) {
    return knowledgeBase.filter((item) => typeof item === 'string' && item.trim()).join('\n- ');
  }
  return typeof knowledgeBase === 'string' ? knowledgeBase : '';
}

function formatAddOns(configJson: Record<string, unknown>): string {
  const configured = configJson.add_ons ?? configJson.addons ?? configJson.experience_upgrades ?? configJson.upgrades;
  const list = Array.isArray(configured) ? configured : [];
  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && item.enabled !== false)
    .map((item) => {
      const title = item.title || item.label || item.name || 'Add-on';
      const price = item.price ? `: SGD ${item.price}` : '';
      const desc = item.desc || item.description || item.body || 'Experience upgrade available for eligible visits.';
      return `- ${title}${price} — ${desc}`;
    })
    .join('\n');
}

// Resolves the tenant's guide identity, personality, fallback copy, approved
// knowledge, and add-on catalog from the database. Never derived from the
// request body — only `tenantId` is taken from the client.
async function loadGuideConfig(tenantId: string): Promise<GuideConfig> {
  const base: GuideConfig = {
    guideName: DEFAULT_GUIDE_NAME,
    personality: DEFAULT_PERSONALITY,
    fallback: DEFAULT_FALLBACK,
    approvedKnowledge: '',
    addonKnowledge: '',
    tenantName: 'the museum',
  };
  if (!tenantId) return base;

  const service = getServiceRoleClient();
  const [{ data: tenantRow }, { data: experienceConfig }, { data: moduleConfig }] = await Promise.all([
    service.from('museum_tenants').select('name').eq('id', tenantId).maybeSingle(),
    service.from('experience_configs').select('ai_guide_config')
      .eq('tenant_id', tenantId).eq('module_key', 'ai_guide').eq('status', 'published')
      .order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('module_configs').select('config_json')
      .eq('tenant_id', tenantId).eq('module_key', 'ticketing').maybeSingle(),
  ]);

  const guideConfig = (experienceConfig?.ai_guide_config || {}) as Record<string, unknown>;
  const personality = (guideConfig.personality || guideConfig.tone) as string | undefined;

  return {
    guideName: typeof guideConfig.guide_name === 'string' && guideConfig.guide_name ? guideConfig.guide_name : base.guideName,
    personality: personality || base.personality,
    fallback: typeof guideConfig.fallback_answer === 'string' && guideConfig.fallback_answer ? guideConfig.fallback_answer : base.fallback,
    approvedKnowledge: formatKnowledge(guideConfig.knowledge_base),
    addonKnowledge: formatAddOns((moduleConfig?.config_json || {}) as Record<string, unknown>),
    tenantName: tenantRow?.name || base.tenantName,
  };
}

// Keeps only well-formed visitor/assistant turns, capped in count and length,
// so a caller can't stuff the prompt with oversized or malformed history.
function sanitizeHistory(history: unknown): Message[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg): msg is Message => !!msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((msg) => ({ role: msg.role, content: msg.content.slice(0, MAX_PROMPT_LENGTH) }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({
        text: 'The AI guide is not configured yet. Please set ANTHROPIC_API_KEY in Supabase Edge Function secrets.',
        error: 'NOT_CONFIGURED',
      }, { status: 503, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : '';
    const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : '';

    if (!prompt) {
      return Response.json({ text: '', error: 'No prompt provided' }, { status: 400, headers: corsHeaders });
    }

    const { guideName, personality, fallback, approvedKnowledge, addonKnowledge, tenantName } = await loadGuideConfig(tenantId);

    const systemPrompt = `${SYSTEM_PROMPT}

Guide name: ${guideName}
Museum: ${tenantName}
Personality: ${personality}
Fallback for unknown facts: "${fallback}"
${approvedKnowledge ? `Approved museum knowledge:\n${approvedKnowledge}` : ''}
${addonKnowledge ? `Available add-ons / upgrades:\n${addonKnowledge}` : 'Add-ons may be tenant-specific; guide visitors to the Add-ons page.'}`;

    // Build messages array: include conversation history then the new user prompt
    const messages: Message[] = [
      ...sanitizeHistory(body.conversation_history),
      { role: 'user', content: prompt },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText);
      console.error('[cultural-guide] Anthropic API error:', err);
      return Response.json({ text: fallback, error: 'API_ERROR' }, { status: 200, headers: corsHeaders });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || fallback;
    return Response.json({ text, ctas: [], topic: 'general' }, { headers: corsHeaders });
  } catch (error) {
    console.error('[cultural-guide] Error:', error);
    return Response.json({
      text: "I'm having trouble connecting right now. Please try again or visit our Help section.",
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200, headers: corsHeaders });
  }
});
