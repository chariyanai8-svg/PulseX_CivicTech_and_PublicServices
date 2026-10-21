import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateChatbotResponse } from './nlp';
import { CommunityIssue } from '../../../packages/shared-types';

export type AIProvider = 'auto' | 'gemini' | 'groq';

interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  text: string;
}

export interface AIChatOptions {
  message: string;
  role: 'ADMIN' | 'CITIZEN';
  language: 'BM' | 'EN';
  provider?: AIProvider;
  currentIssues?: CommunityIssue[];
  history?: ChatHistoryItem[];
}

export interface AIChatResult {
  reply: string;
  provider: 'gemini' | 'groq' | 'local_nlp';
  model: string;
  suggestedActions: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
}

const GROQ_MODEL = 'qwen/qwen3.8-27b';
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'];

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    return new Groq({ apiKey });
  } catch (err) {
    console.warn('[Groq Client Init Warning]:', err);
    return null;
  }
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('[Gemini Client Init Warning]:', err);
    return null;
  }
}

function buildSystemPrompt(role: 'ADMIN' | 'CITIZEN', language: 'BM' | 'EN', currentIssues: CommunityIssue[] = []): string {
  const issuesSummary = currentIssues.slice(0, 10).map(i => {
    const sev = (i as any).severity || 'NORMAL';
    return `- [${i.id}] (${i.category}) "${i.title}" at ${i.location.address || 'Petaling Jaya'} | Status: ${i.status} | Severity: ${sev} | Endorsements/Affected: ${i.affectedCount || 1}`;
  }).join('\n');

  const langDirective = language === 'BM'
    ? `PERATURAN BAHASA MUTLAK:
- Anda MESTI menjawab sepenuhnya dalam Bahasa Melayu yang fasih, mesra, tepat, dan mudah difahami rakyat Malaysia.
- Gunakan kosa kata sivik tempatan seperti 'longkang tersumbat', 'jalan berlubang', 'lampu jalan terpadam', 'pihak majlis MBPJ', 'tindakan pembaikan'.
- JANGAN sesekali menjawab dalam Bahasa Inggeris kecuali nama akronim rasmi (cth: TNB, MBPJ, JKR).`
    : `STRICT LANGUAGE DIRECTIVE:
- You MUST reply completely in clear, friendly, and professional English.
- Use natural Malaysian municipal references when describing Petaling Jaya (MBPJ, TNB, Air Selangor).`;

  if (role === 'ADMIN') {
    return `You are "Council AI Co-Pilot", an advanced AI assistant for the Petaling Jaya City Council (MBPJ) and Malaysian local municipal administration.

${langDirective}

You assist council officers, department directors, and field engineers with:
1. High-danger civic hazard triage, flood risks, and road safety.
2. Inter-agency jurisdiction routing (MBPJ Municipal vs JKR Federal Roads vs TNB Electrical vs Air Selangor Water).
3. Analyzing repeat occurrences, citizen frustration indexes, and dispatch prioritization.

Current Live Database Issues in Petaling Jaya:
${issuesSummary || 'No active unresolved issues.'}

Guidelines:
- Tone: Executive, concise, authoritative, civic-minded, and actionable.
- Format with clean bullet points and bold section headers. DO NOT generate raw ASCII markdown table pipes (| col | col |); instead use bullet cards with bold labels (e.g. '**Case ID:** CIV-XXXX', '**Location:** Section 17') for maximum readability.
- When referencing cases, use their exact IDs (e.g. CIV-2026-XXXX).`;
  }

  return `You are "CivicPulse Resident AI Aduan", an empathetic, friendly, and knowledgeable civic concierge for residents living in Petaling Jaya, Malaysia (covering Section 17, Section 14, SS2, Taman Paramount, Damansara, etc.).

${langDirective}

You assist residents with:
1. Submitting civic complaints (potholes, clogged drains, flash floods, broken streetlights, illegal rubbish dumping, fallen trees).
2. Guiding them on what details are needed (clear photos, exact street landmark, safety hazard level).
3. Checking real-time status of community complaints in Petaling Jaya.
4. Providing emergency contact numbers and municipal hotlines:
   - MBPJ 24/7 Hotline: 03-7956 3544 | WhatsApp: 019-338 1234
   - TNB (Streetlight & Power Outages): 15454
   - Air Selangor (Water Burst / Pipe Leaks): 15300

Current Live Community Issues in Petaling Jaya:
${issuesSummary || 'All major reported issues are currently resolved.'}

Guidelines:
- Tone: Warm, helpful, civic-oriented, empathetic.
- Use clean Markdown with bullet points and emojis. DO NOT generate raw ASCII markdown table pipes (| col | col |); instead use structured bullet lists so every word is clean and easy to read on mobile.
- Offer proactive next steps (e.g. advise reporting via the app or viewing the community map).`;
}

function extractSuggestedActions(text: string, role: 'ADMIN' | 'CITIZEN', language: 'BM' | 'EN'): Array<{ label: string; action: string; payload?: any }> {
  const lower = text.toLowerCase();
  const actions: Array<{ label: string; action: string; payload?: any }> = [];

  if (role === 'CITIZEN') {
    if (lower.includes('borang') || lower.includes('lapor') || lower.includes('aduan') || lower.includes('report') || lower.includes('submit')) {
      actions.push({
        label: language === 'BM' ? '📝 Buka Borang Aduan' : '📝 Open Report Form',
        action: 'OPEN_REPORT_MODAL'
      });
    }
    if (lower.includes('peta') || lower.includes('map') || lower.includes('lokasi') || lower.includes('location')) {
      actions.push({
        label: language === 'BM' ? '🗺️ Lihat Peta Komuniti' : '🗺️ View Community Map',
        action: 'NAVIGATE_TAB',
        payload: 'map'
      });
    }
    if (lower.includes('civ-2026-004281')) {
      actions.push({
        label: language === 'BM' ? '🌊 Sokong Aduan Longkang' : '🌊 Endorse Drain Issue',
        action: 'ENDORSE_ISSUE',
        payload: 'CIV-2026-004281'
      });
    }
    if (actions.length === 0) {
      actions.push(
        { label: language === 'BM' ? '📝 Cara Buat Aduan' : '📝 How to Report', action: 'SEND_PROMPT', payload: language === 'BM' ? 'Bagaimana cara buat aduan?' : 'How do I submit a report?' },
        { label: language === 'BM' ? '🗺️ Peta Komuniti' : '🗺️ Community Map', action: 'NAVIGATE_TAB', payload: 'map' }
      );
    }
  } else {
    // ADMIN ACTIONS
    if (lower.includes('kritikal') || lower.includes('critical') || lower.includes('bahaya') || lower.includes('hazard')) {
      actions.push({
        label: language === 'BM' ? '🚨 Tapis Kes Kritikal' : '🚨 Filter Critical Cases',
        action: 'FILTER_STATUS',
        payload: 'CRITICAL'
      });
    }
    actions.push(
      { label: language === 'BM' ? '🗺️ Peta Pantau Majlis' : '🗺️ Live Operations Map', action: 'NAVIGATE_TAB', payload: 'Live Map' },
      { label: language === 'BM' ? '📋 Senarai Penuh Aduan' : '📋 All Council Issues', action: 'NAVIGATE_TAB', payload: 'Issues' }
    );
  }

  return actions.slice(0, 3);
}

/**
 * Call Groq AI API
 */
async function callGroq(prompt: string, systemPrompt: string, history: ChatHistoryItem[] = [], language: 'BM' | 'EN'): Promise<string> {
  const groq = getGroqClient();
  if (!groq) throw new Error('Groq client not initialized (missing GROQ_API_KEY)');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  for (const h of history.slice(-4)) {
    messages.push({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text
    });
  }

  const finalPrompt = language === 'BM'
    ? `${prompt}\n\n(Peringatan Penting: Sila jawab sepenuhnya dalam Bahasa Melayu)`
    : prompt;

  messages.push({ role: 'user', content: finalPrompt });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.6,
    max_tokens: 650
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) throw new Error('Groq returned empty response');
  return reply.trim();
}

/**
 * Call Google Gemini AI API with automatic multi-model failover (3.5-flash -> 3-flash-preview -> 3.8-flash)
 */
async function callGemini(
  prompt: string,
  systemPrompt: string,
  history: ChatHistoryItem[] = [],
  language: 'BM' | 'EN'
): Promise<{ text: string; model: string }> {
  const genAI = getGeminiClient();
  if (!genAI) throw new Error('Gemini client not initialized (missing GEMINI_API_KEY)');

  let fullPrompt = '';
  if (history.length > 0) {
    fullPrompt += 'Recent conversation history:\n';
    for (const h of history.slice(-4)) {
      fullPrompt += `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}\n`;
    }
    fullPrompt += `\nUser's latest message:\n${prompt}`;
  } else {
    fullPrompt = prompt;
  }

  if (language === 'BM') {
    fullPrompt += '\n\n(Peringatan Penting: Sila jawab sepenuhnya dalam Bahasa Melayu yang fasih dan mesra)';
  }

  let lastError: any = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return { text: text.trim(), model: modelName };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini ${modelName} Warn]: ${err.message}`);
    }
  }

  throw lastError || new Error('All Gemini models exhausted');
}

/**
 * Intelligent Fallback: Search Saved Things Context & Real Issues from the App Database
 */
function searchSavedAppContext(
  message: string,
  currentIssues: CommunityIssue[],
  language: 'BM' | 'EN',
  role: 'ADMIN' | 'CITIZEN'
): AIChatResult {
  const isBM = language === 'BM';
  const lowerMsg = message.toLowerCase();

  // 1. Search across real issues in database
  const matchingIssues = currentIssues.filter(issue => {
    const idMatch = issue.id.toLowerCase().includes(lowerMsg) || lowerMsg.includes(issue.id.toLowerCase());
    const titleMatch = issue.title.toLowerCase().split(' ').some(w => w.length > 3 && lowerMsg.includes(w));
    const catMatch = lowerMsg.includes(issue.category.toLowerCase());
    const addrMatch = issue.location.address.toLowerCase().split(/[\s,]+/).some(w => w.length > 2 && lowerMsg.includes(w));
    const descMatch = issue.description?.toLowerCase().split(' ').some(w => w.length > 4 && lowerMsg.includes(w));
    
    // Malaysian civic synonyms
    const isDrainQuery = (lowerMsg.includes('longkang') || lowerMsg.includes('drain') || lowerMsg.includes('banjir') || lowerMsg.includes('parit')) && issue.category === 'DRAINAGE';
    const isRoadQuery = (lowerMsg.includes('jalan') || lowerMsg.includes('road') || lowerMsg.includes('pothole') || lowerMsg.includes('lubang')) && issue.category === 'ROADS';
    const isLightQuery = (lowerMsg.includes('lampu') || lowerMsg.includes('light') || lowerMsg.includes('gelap')) && issue.category === 'LIGHTING';
    const isWasteQuery = (lowerMsg.includes('sampah') || lowerMsg.includes('rubbish') || lowerMsg.includes('waste')) && issue.category === 'WASTE';

    return idMatch || titleMatch || catMatch || addrMatch || descMatch || isDrainQuery || isRoadQuery || isLightQuery || isWasteQuery;
  });

  if (matchingIssues.length > 0) {
    const topMatch = matchingIssues[0];
    const statusMap: Record<string, { bm: string; en: string }> = {
      'REPORTED': { bm: 'Baru Dilapor', en: 'Newly Reported' },
      'IN_PROGRESS': { bm: 'Dalam Tindakan (PBT Sedang Membaiki)', en: 'In Progress (Council Repairing)' },
      'MARKED_RESOLVED': { bm: 'Ditandai Selesai (Menunggu Pengesahan Penduduk)', en: 'Marked Resolved (Awaiting Citizen Verification)' },
      'COMMUNITY_VERIFIED': { bm: 'Disahkan Selesai oleh Komuniti (100%)', en: 'Community Verified Fixed (100%)' },
      'DISPUTED': { bm: 'Dipertikaikan / Memerlukan Tindakan Semula', en: 'Disputed / Action Required' }
    };

    const statusLabel = statusMap[topMatch.status] ? (isBM ? statusMap[topMatch.status].bm : statusMap[topMatch.status].en) : topMatch.status;

    let reply = '';
    if (isBM) {
      reply = `🔍 **Maklumat Aduan Berdasarkan Data Aplikasi CivicPulse:**\n\n` +
        `Saya telah menjumpai rekod berkaitan pertanyaan anda dalam pangkalan data komuniti:\n\n` +
        `📋 **No. Rujukan Kes:** \`${topMatch.id}\`\n` +
        `📍 **Lokasi:** ${topMatch.location.address || 'Petaling Jaya'}\n` +
        `🏷️ **Kategori:** ${topMatch.category} — *${topMatch.title}*\n` +
        `⚡ **Status Semasa:** **${statusLabel}**\n` +
        `👥 **Sokongan Penduduk:** ${topMatch.affectedCount || 1} orang penduduk telah mengesahkan terjejas.\n\n` +
        `💬 **Keterangan:** ${topMatch.description || 'Tiada keterangan lanjut.'}\n\n` +
        `*Anda boleh menyokong aduan ini di laman utama atau membuka peta untuk melihat lokasi tepat.*`;
    } else {
      reply = `🔍 **Report Information from CivicPulse Live Database:**\n\n` +
        `I found an active matching record from our community database:\n\n` +
        `📋 **Ticket ID:** \`${topMatch.id}\`\n` +
        `📍 **Location:** ${topMatch.location.address || 'Petaling Jaya'}\n` +
        `🏷️ **Category:** ${topMatch.category} — *${topMatch.title}*\n` +
        `⚡ **Current Status:** **${statusLabel}**\n` +
        `👥 **Community Impact:** ${topMatch.affectedCount || 1} verified residents confirmed affected.\n\n` +
        `💬 **Description:** ${topMatch.description || 'No additional details.'}\n\n` +
        `*You can endorse this report on your home feed or open the community map to see full inspection details.*`;
    }

    const suggestedActions: Array<{ label: string; action: string; payload?: any }> = [
      {
        label: isBM ? `🌊 Sokong Kes (${topMatch.id})` : `🌊 Back Ticket (${topMatch.id})`,
        action: 'ENDORSE_ISSUE',
        payload: topMatch.id
      },
      {
        label: isBM ? '🗺️ Lihat di Peta' : '🗺️ View on Map',
        action: 'NAVIGATE_TAB',
        payload: 'map'
      },
      {
        label: isBM ? '📝 Buat Aduan Baharu' : '📝 File New Report',
        action: 'OPEN_REPORT_MODAL'
      }
    ];

    return {
      reply,
      provider: 'local_nlp',
      model: 'App Database & Saved Context Search',
      suggestedActions
    };
  }

  // 2. If no specific database issue matched, run the rule-based local civic triage responder (hotlines, how-to, general queries)
  const localResponse = generateChatbotResponse(message, role, language, currentIssues);

  return {
    reply: localResponse.reply,
    provider: 'local_nlp',
    model: 'Saved Civic Knowledge & Offline Engine',
    suggestedActions: localResponse.suggestedActions || extractSuggestedActions(localResponse.reply, role, language)
  };
}

/**
 * Unified Chat Handler with Multi-Provider Support and Automatic Failover:
 * Primary: Gemini -> Secondary: Groq -> Tertiary: App Database & Saved Context Search
 */
export async function getAIChatResponse(options: AIChatOptions): Promise<AIChatResult> {
  const {
    message,
    role = 'CITIZEN',
    language = 'EN',
    provider = 'auto',
    currentIssues = [],
    history = []
  } = options;

  const systemPrompt = buildSystemPrompt(role, language, currentIssues);

  // If user specifically picked GROQ
  if (provider === 'groq') {
    try {
      const groqReply = await callGroq(message, systemPrompt, history, language);
      return {
        reply: groqReply,
        provider: 'groq',
        model: GROQ_MODEL,
        suggestedActions: extractSuggestedActions(groqReply, role, language)
      };
    } catch (err: any) {
      console.warn(`[AI Service] Groq error (${err.message}). Trying Gemini fallback...`);
      try {
        const geminiRes = await callGemini(message, systemPrompt, history, language);
        return {
          reply: geminiRes.text,
          provider: 'gemini',
          model: geminiRes.model,
          suggestedActions: extractSuggestedActions(geminiRes.text, role, language)
        };
      } catch (geminiErr: any) {
        console.warn(`[AI Service] Gemini fallback also failed (${geminiErr.message}). Falling back to App Context Search...`);
      }
    }
    return searchSavedAppContext(message, currentIssues, language, role);
  }

  // 1. PRIMARY AI: Google Gemini AI (Default & 'auto')
  try {
    const geminiRes = await callGemini(message, systemPrompt, history, language);
    return {
      reply: geminiRes.text,
      provider: 'gemini',
      model: geminiRes.model,
      suggestedActions: extractSuggestedActions(geminiRes.text, role, language)
    };
  } catch (geminiErr: any) {
    console.warn(`[AI Service] Primary Gemini failed or rate-limit reached (${geminiErr.message}). Falling back to Groq AI...`);
  }

  // 2. SECONDARY AI: Groq AI (unlimited high-throughput fallback)
  try {
    const groqReply = await callGroq(message, systemPrompt, history, language);
    return {
      reply: groqReply,
      provider: 'groq',
      model: GROQ_MODEL,
      suggestedActions: extractSuggestedActions(groqReply, role, language)
    };
  } catch (groqErr: any) {
    console.warn(`[AI Service] Groq AI also failed (${groqErr.message}). Falling back to Saved App Context Search...`);
  }

  // 3. TERTIARY FALLBACK: Search Saved App Context & Local Database
  console.log('[AI Service] Serving response via Saved App Context & Live Database Search');
  return searchSavedAppContext(message, currentIssues, language, role);
}
