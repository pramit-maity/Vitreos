/**
 * VITREOS — API Configuration
 * ════════════════════════════
 * Central place for all API keys and endpoints.
 *
 * ⚠️  SECURITY: Never commit real API keys to GitHub.
 *     For production, inject these via environment variables or a backend proxy.
 *
 * To get a Pollinations key: https://pollinations.ai/
 * To get a Google Maps key:  https://console.cloud.google.com/
 */

/* ══════════════════════════════════════════════════════════
   VITREOS AI ENGINE — Centralized Neural Analysis System
   Powered by Pollinations AI (OpenAI-compatible endpoint)
══════════════════════════════════════════════════════════ */

/* ── API Configuration ── */
const POLLINATIONS_API_KEY = 'pk_5ZzH6R5w6vQSJIvM';
const POLLINATIONS_MODEL   = 'openai';
const POLLINATIONS_URL     = 'https://text.pollinations.ai/openai';

/* ── API Readiness Check ── */
function vitreos_aiReady() {
  return !!(POLLINATIONS_API_KEY && POLLINATIONS_API_KEY.length > 5);
}

/* ── No-Key Graceful Message ── */
function vitreos_noKeyMsg(section) {
  return `<div style="display:flex;align-items:flex-start;gap:14px;padding:18px;border-radius:10px;border:1px solid var(--orange);background:rgba(255,140,0,.06)">
    <span style="font-size:24px;flex-shrink:0">⚠️</span>
    <div>
      <div style="font-family:var(--fd);font-size:10px;letter-spacing:2px;color:var(--orange);text-transform:uppercase;margin-bottom:6px">${section} — AI Not Configured</div>
      <div style="font-size:12.5px;color:var(--txt2);line-height:1.7">Please configure your AI API Key in the <strong style="color:var(--cyan);cursor:pointer" onclick="goPage('home')">Advisor Section</strong> to enable this analysis.</div>
    </div>
  </div>`;
}

/* ── Loading State HTML ── */
function vitreos_loadingHTML(label, sub) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px 0;text-align:center">
    <div style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(0,245,255,.3);border-top-color:var(--cyan);animation:spin 1s linear infinite"></div>
    <div style="font-family:var(--fd);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--cyan)">${label}</div>
    <div style="font-size:12px;color:var(--txt2)">${sub}</div>
    <div style="width:220px;height:3px;background:rgba(0,245,255,.08);border-radius:2px;overflow:hidden">
      <div class="vl-prog" style="height:100%;background:var(--cyan);border-radius:2px;box-shadow:0 0 6px var(--cyan);animation:vlprog 2.4s ease-in-out infinite"></div>
    </div>
  </div>`;
}

/* ── Unified AI Caller ── */
async function callGroq(systemPrompt, userMessage, maxTokens = 900) {
  const res = await fetch(POLLINATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${POLLINATIONS_API_KEY}`
    },
    body: JSON.stringify({
      model: POLLINATIONS_MODEL,
      max_tokens: maxTokens,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage }
      ]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `AI API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
