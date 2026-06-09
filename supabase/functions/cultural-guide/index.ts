import { corsHeaders } from '../_shared/cors.ts';

// AI Cultural Guide for SCAVerse museum tenants.
// Replaces Base44 agent `cultural_guide` and the InvokeLLM call in AIGuide.jsx.
// Requires ANTHROPIC_API_KEY set in Supabase Edge Function secrets.

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
    const {
      prompt = '',
      guide_name = 'ARIA',
      personality = 'warm, culturally intelligent, concise',
      fallback_answer = "I don't have that information, but I can connect you with our team.",
      approved_knowledge = '',
      addon_knowledge = '',
      tenant_name = 'the museum',
      conversation_history = [] as Message[],
    } = body;

    if (!prompt) {
      return Response.json({ text: '', error: 'No prompt provided' }, { status: 400, headers: corsHeaders });
    }

    const systemPrompt = `${SYSTEM_PROMPT}

Guide name: ${guide_name}
Museum: ${tenant_name}
Personality: ${personality}
Fallback for unknown facts: "${fallback_answer}"
${approved_knowledge ? `Approved museum knowledge:\n${approved_knowledge}` : ''}
${addon_knowledge ? `Available add-ons / upgrades:\n${addon_knowledge}` : ''}`;

    // Build messages array: include conversation history then the new user prompt
    const messages: Message[] = [
      ...((conversation_history as Message[]).slice(-10)),
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
      return Response.json({ text: fallback_answer, error: 'API_ERROR' }, { status: 200, headers: corsHeaders });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || fallback_answer;
    return Response.json({ text, ctas: [], topic: 'general' }, { headers: corsHeaders });
  } catch (error) {
    console.error('[cultural-guide] Error:', error);
    return Response.json({
      text: "I'm having trouble connecting right now. Please try again or visit our Help section.",
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200, headers: corsHeaders });
  }
});
