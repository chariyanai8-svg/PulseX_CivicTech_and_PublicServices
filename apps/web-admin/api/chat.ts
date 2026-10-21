export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { message, role, language, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message string is required' });
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  const isBM = language === 'BM';
  const systemPrompt = isBM
    ? `Anda ialah Pembantu Aduan AI Komuniti Petaling Jaya (MBPJ). Bantu penduduk dengan mesra, pantas, dan tepat tentang isu sivik (longkang tersumbat, jalan berlubang, lampu rosak, sampah). Sila jawab sepenuhnya dalam Bahasa Melayu yang ringkas dan padat.`
    : `You are the CivicPulse Community AI Concierge for Petaling Jaya (MBPJ). Help residents with municipal complaints (drainage, potholes, streetlights, waste). Reply in friendly, helpful, and concise English.`;

  // 1. Try Groq AI (qwen/qwen3.8-27b)
  if (groqKey) {
    try {
      const messages: any[] = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(history)) {
        for (const h of history.slice(-4)) {
          messages.push({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text
          });
        }
      }
      messages.push({ role: 'user', content: message });

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages,
          temperature: 0.6,
          max_tokens: 450
        })
      });

      if (groqRes.ok) {
        const groqData: any = await groqRes.json();
        const reply = groqData.choices?.[0]?.message?.content;
        if (reply) {
          return res.status(200).json({
            success: true,
            data: {
              reply: reply.trim(),
              provider: 'groq',
              model: 'qwen/qwen3.8-27b',
              suggestedActions: [
                { label: isBM ? '📝 Buka Borang Aduan' : '📝 Open Report Form', action: 'OPEN_REPORT_MODAL' },
                { label: isBM ? '🗺️ Peta Komuniti' : '🗺️ Community Map', action: 'NAVIGATE_TAB', payload: 'Live Map' }
              ]
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Vercel Serverless Groq Error]:', err);
    }
  }

  // 2. Try Google Gemini API
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nUser: ${message}` }
                ]
              }
            ]
          })
        }
      );

      if (geminiRes.ok) {
        const geminiData: any = await geminiRes.json();
        const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.status(200).json({
            success: true,
            data: {
              reply: reply.trim(),
              provider: 'gemini',
              model: 'gemini-1.5-flash',
              suggestedActions: [
                { label: isBM ? '📝 Buka Borang Aduan' : '📝 Open Report Form', action: 'OPEN_REPORT_MODAL' },
                { label: isBM ? '🗺️ Peta Komuniti' : '🗺️ Community Map', action: 'NAVIGATE_TAB', payload: 'Live Map' }
              ]
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Vercel Serverless Gemini Error]:', err);
    }
  }

  // 3. Fallback
  return res.status(200).json({
    success: true,
    data: {
      reply: isBM
        ? `👋 **Hai! Saya Pembantu Aduan AI Komuniti Petaling Jaya.**\n\nSaya telah merekodkan mesej anda: "${message}". Anda boleh membuat aduan rasmi atau menyemak peta komuniti secara langsung.`
        : `👋 **Hello! I am your CivicPulse AI Resident Concierge.**\n\nI noted your message: "${message}". You can submit an official report or inspect the live community map.`,
      provider: 'local_nlp',
      model: 'CivicPulse Engine',
      suggestedActions: [
        { label: isBM ? '📝 Buka Borang Aduan' : '📝 Open Report Form', action: 'OPEN_REPORT_MODAL' },
        { label: isBM ? '🗺️ Peta Komuniti' : '🗺️ Community Map', action: 'NAVIGATE_TAB', payload: 'Live Map' }
      ]
    }
  });
}
