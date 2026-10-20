import { IssueCategory, IssueSeverity } from '../../../packages/shared-types';

export interface NLPEntity {
  type: 'LOCATION' | 'LANDMARK' | 'HAZARD_OBJECT' | 'TEMPORAL' | 'VEHICLE';
  value: string;
  confidence: number;
}

export interface NLPAnalysisResult {
  rawText: string;
  detectedLanguage: 'BM' | 'EN' | 'MIXED_MANGLISH';
  category: IssueCategory;
  categoryConfidence: number; // 0 to 1
  suggestedTitle: string;
  severity: IssueSeverity;
  severityScore: number; // 0 to 100
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: {
    score: number; // -1.0 (extremely negative/frustrated) to 1.0 (positive)
    label: 'EXTREMELY_FRUSTRATED' | 'FRUSTRATED' | 'NEUTRAL_COMPLAINT' | 'SATISFIED';
    frustrationIndex: number; // 0 to 100
  };
  entities: NLPEntity[];
  detectedLandmarks: string[];
  recommendedAgency: {
    name: string;
    department: string;
    confidence: number;
    reasoning: string;
  };
  actionableSummary: string;
}

// ─────────────────────────────────────────────────────────────
// Multilingual Malaysian Civic Dictionaries & Heuristics
// ─────────────────────────────────────────────────────────────

interface CategoryPattern {
  category: IssueCategory;
  keywords: string[];
  weight: number;
  formalTitlePrefix: string;
  leadAgency: { name: string; department: string };
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'DRAINAGE',
    keywords: [
      'longkang', 'parit', 'drain', 'drainage', 'sumbat', 'clogged', 'blocked',
      'banjir', 'flood', 'overflow', 'limpahan', 'air naik', 'stagnant', 'bertakung',
      'culvert', 'monsoon drain', 'jentik-jentik', 'denggi', 'bau busuk longkang', 'air kumbahan'
    ],
    weight: 1.2,
    formalTitlePrefix: 'Drainage Blockage & Water Overflow',
    leadAgency: {
      name: 'MBPJ Engineering Department',
      department: 'Drainage & Flood Mitigation Division'
    }
  },
  {
    category: 'ROADS',
    keywords: [
      'pothole', 'lubang', 'jalan', 'road', 'tar', 'asphalt', 'retak', 'mendap',
      'sinkhole', 'bonggol', 'speed bump', 'pavement', 'rosak', 'berlubang',
      'korek jalan', 'gravel', 'batu kelikir', 'garisan jalan', 'road marking'
    ],
    weight: 1.1,
    formalTitlePrefix: 'Road Surface Defect & Pothole Hazard',
    leadAgency: {
      name: 'JKR Federal Road Maintenance / MBPJ Roads',
      department: 'Civil Infrastructure & Pavement Engineering'
    }
  },
  {
    category: 'LIGHTING',
    keywords: [
      'lampu', 'light', 'streetlight', 'lampu jalan', 'gelap', 'dark', 'pitch black',
      'tiang', 'tiang lampu', 'flicker', 'mentol', 'terpadam', 'mati', 'blackout',
      'gelap gelita', 'wayar lampu', 'lamp post'
    ],
    weight: 1.0,
    formalTitlePrefix: 'Streetlight Failure & Public Illumination Defect',
    leadAgency: {
      name: 'Tenaga Nasional Berhad (TNB)',
      department: 'Street Lighting & Grid Division'
    }
  },
  {
    category: 'WASTE',
    keywords: [
      'sampah', 'rubbish', 'waste', 'garbage', 'tong sampah', 'bau busuk', 'stench',
      'tak angkut', 'uncollected', 'lalat', 'ulat', 'timbunan', 'dump', 'illegal dumping',
      'sampah haram', 'sisa pepejal', 'perabot lama', 'tilam', 'pokok cantas'
    ],
    weight: 1.1,
    formalTitlePrefix: 'Uncollected Solid Waste & Sanitation Hazard',
    leadAgency: {
      name: 'Alam Flora Solid Waste Management',
      department: 'Urban Cleansing & Public Sanitation'
    }
  },
  {
    category: 'FALLEN_TREES',
    keywords: [
      'pokok', 'tree', 'tumbang', 'dahan', 'branch', 'patah', 'hempap', 'fallen',
      'akar', 'overgrown', 'ranting', 'halang jalan', 'tumbang atas wayar', 'pokok mati'
    ],
    weight: 1.3,
    formalTitlePrefix: 'Fallen Tree & Obstructive Branch Hazard',
    leadAgency: {
      name: 'MBPJ Landscape & Park Services',
      department: 'Emergency Tree Clearing & Arboriculture'
    }
  },
  {
    category: 'HAZARD',
    keywords: [
      'bahaya', 'danger', 'hazard', 'wayar putus', 'exposed wire', 'cable', 'runtuh',
      'collapse', 'tebing', 'slope', 'landslide', 'tanah runtuh', 'lubang maut',
      'renjatan', 'pencawang', 'manhole ternganga', 'penutup hilang', 'besi tajam'
    ],
    weight: 1.4,
    formalTitlePrefix: 'Severe Public Safety Hazard & Structural Failure',
    leadAgency: {
      name: 'MBPJ Enforcement & Civil Defense Taskforce',
      department: 'Rapid Disaster & Emergency Mitigation'
    }
  },
  {
    category: 'FACILITIES',
    keywords: [
      'taman permainan', 'playground', 'buaian', 'gelongsor', 'pagar', 'bench',
      'bangku', 'papan tanda', 'signboard', 'dewan orang ramai', 'tandas awam',
      'lampu taman', 'jogging track', 'bumbung bocor'
    ],
    weight: 0.9,
    formalTitlePrefix: 'Municipal Amenity & Public Facility Defect',
    leadAgency: {
      name: 'MBPJ Community Facilities Department',
      department: 'Park Infrastructure Maintenance'
    }
  },
  {
    category: 'OBSTRUCTION',
    keywords: [
      'halangan', 'block', 'kereta tersadai', 'lori block', 'abandoned car',
      'peniaga haram', 'meja kerusi atas kaki lima', 'laluan pejalan kaki terhalang'
    ],
    weight: 0.9,
    formalTitlePrefix: 'Public Right-of-Way Obstruction',
    leadAgency: {
      name: 'MBPJ Enforcement Directorate',
      department: 'Traffic & Public Encroachment Bureau'
    }
  }
];

// High Danger / Emergency trigger terms
const CRITICAL_TRIGGERS = [
  'accident', 'kemalangan', 'langgar', 'hampir mati', 'near miss', 'terjatuh',
  'renjatan elektrik', 'wayar putus', 'tanah runtuh', 'landslide', 'runtuh',
  'air masuk rumah', 'rumah dinaiki air', 'sinkhole', 'lubang maut', 'patah riuk',
  'hospital', 'kecemasan', 'ambulance', 'bomba', 'nyawa'
];

const HIGH_TRIGGERS = [
  'teruk sangat', 'severe', 'parah', 'hampir jatuh', 'motor hampir terbabas',
  'rim patah', 'tayar pecah', 'bau busuk sangat', 'gelap gelita', 'tak tahan',
  'dah seminggu', 'berhari-hari', 'tiada tindakan', 'overflow', 'deep pothole',
  'banjir kilat', 'flash flood', 'jentik-jentik denggi'
];

// Frustration indicators
const FRUSTRATION_TERMS = [
  'gila', 'mampus', 'bodoh', 'babi', 'teruk', 'lambat', 'sampai bila', 'kecewa',
  'hancur', 'geram', 'menipu', 'useless', 'terrible', 'disaster', 'wtf', 'pathetic',
  'danger', 'death trap', 'kill someone', 'urgent gila', 'tolonglah', 'plz help',
  'fed up', 'enough is enough', 'dua minggu dah', 'aduan tak layan'
];

const LOCATION_REGEXES = [
  /\b(?:jalan|jln|lorong|lrg|persiaran|psrn)\s+[a-z0-9\/\-_]+/gi,
  /\b(?:ss\d{1,2}|seksyen\s+\d{1,2}|section\s+\d{1,2}|sec\s+\d{1,2}|pju\s+\d{1,2})\b/gi,
  /\b(?:taman\s+[a-z\s]+|damansara\s+[a-z]+|kelana\s+jaya|petaling\s+jaya|subang\s+jaya|kota\s+damansara)\b/gi,
  /\b(?:depan|belakang|sebelah|dekat|berhampiran|opposite|near|behind|next to)\s+([a-z0-9\/\-_]+(?:\s+[a-z0-9\/\-_]+)?)\b/gi
];

/**
 * Detect language distribution (BM vs English vs mixed Manglish)
 */
function detectLanguage(text: string): 'BM' | 'EN' | 'MIXED_MANGLISH' {
  const lower = text.toLowerCase();
  const bmWords = ['yang', 'dan', 'di', 'pada', 'dekat', 'depan', 'belakang', 'teruk', 'dah', 'air', 'jalan', 'longkang', 'bila', 'hujan', 'tak', 'ada', 'pokok', 'lubang', 'lampu', 'tolong'];
  const enWords = ['the', 'and', 'at', 'near', 'front', 'behind', 'very', 'already', 'water', 'road', 'drain', 'when', 'rain', 'not', 'have', 'tree', 'hole', 'light', 'please'];

  let bmCount = 0;
  let enCount = 0;

  const tokens = lower.split(/[\s,.;!?]+/);
  tokens.forEach(tok => {
    if (bmWords.includes(tok)) bmCount++;
    if (enWords.includes(tok)) enCount++;
  });

  if (bmCount > 0 && enCount > 0) return 'MIXED_MANGLISH';
  if (bmCount >= enCount && bmCount > 0) return 'BM';
  return 'EN';
}

/**
 * Main Civic NLP Analysis Pipeline
 */
export function analyzeCivicText(text: string): NLPAnalysisResult {
  const rawText = text.trim();
  const lower = rawText.toLowerCase();

  // 1. Language Detection
  const detectedLanguage = detectLanguage(lower);

  // 2. Category Classification
  let bestCategory: IssueCategory = 'OTHER';
  let maxScore = 0;
  let matchedPattern: CategoryPattern = CATEGORY_PATTERNS[0];

  CATEGORY_PATTERNS.forEach(pattern => {
    let score = 0;
    pattern.keywords.forEach(kw => {
      if (lower.includes(kw)) {
        // Multi-word matches get higher weight
        score += kw.includes(' ') ? 2.5 : 1.2;
      }
    });
    score *= pattern.weight;

    if (score > maxScore) {
      maxScore = score;
      bestCategory = pattern.category;
      matchedPattern = pattern;
    }
  });

  // Default fallback if no clear match
  if (maxScore === 0) {
    bestCategory = lower.includes('jalan') ? 'ROADS' : lower.includes('air') ? 'DRAINAGE' : 'OTHER';
  }

  const categoryConfidence = Math.min(0.98, Math.max(0.65, Number((0.60 + maxScore * 0.08).toFixed(2))));

  // 3. Severity & Urgency Evaluation
  let severityScore = 35; // base normal score
  let isCritical = false;
  let isHigh = false;

  CRITICAL_TRIGGERS.forEach(t => {
    if (lower.includes(t)) {
      severityScore += 35;
      isCritical = true;
    }
  });

  HIGH_TRIGGERS.forEach(t => {
    if (lower.includes(t)) {
      severityScore += 18;
      isHigh = true;
    }
  });

  // Additional points for multiple complaints or recurring phrases
  if (lower.includes('berulang') || lower.includes('banyak kali') || lower.includes('again')) {
    severityScore += 15;
  }

  severityScore = Math.min(100, Math.max(10, severityScore));

  let severity: IssueSeverity = 'NORMAL';
  let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

  if (severityScore >= 80 || isCritical) {
    severity = 'CRITICAL';
    urgency = 'CRITICAL';
  } else if (severityScore >= 60 || isHigh) {
    severity = 'HIGH';
    urgency = 'HIGH';
  } else if (severityScore >= 35) {
    severity = 'NORMAL';
    urgency = 'MEDIUM';
  } else {
    severity = 'NORMAL';
    urgency = 'LOW';
  }

  // 4. Frustration & Sentiment Meter
  let frustrationHits = 0;
  FRUSTRATION_TERMS.forEach(term => {
    if (lower.includes(term)) frustrationHits++;
  });

  const frustrationIndex = Math.min(100, Math.round(30 + (frustrationHits * 22) + (severityScore * 0.35)));
  const sentimentScore = Number((0.2 - (frustrationIndex / 100) * 1.2).toFixed(2));

  let sentimentLabel: NLPAnalysisResult['sentiment']['label'] = 'NEUTRAL_COMPLAINT';
  if (frustrationIndex >= 80) sentimentLabel = 'EXTREMELY_FRUSTRATED';
  else if (frustrationIndex >= 55) sentimentLabel = 'FRUSTRATED';
  else if (sentimentScore > 0) sentimentLabel = 'SATISFIED';

  // 5. Entity & Landmark Extraction (NER)
  const entities: NLPEntity[] = [];
  const detectedLandmarks: string[] = [];

  LOCATION_REGEXES.forEach(regex => {
    const matches = rawText.match(regex);
    if (matches) {
      matches.forEach(m => {
        const clean = m.trim();
        if (!detectedLandmarks.includes(clean)) {
          detectedLandmarks.push(clean);
          entities.push({
            type: clean.toLowerCase().startsWith('jalan') || clean.toLowerCase().startsWith('jln') ? 'LOCATION' : 'LANDMARK',
            value: clean,
            confidence: 0.92
          });
        }
      });
    }
  });

  // Extract hazard objects
  if (lower.includes('pothole') || lower.includes('lubang')) entities.push({ type: 'HAZARD_OBJECT', value: 'Pothole Defect', confidence: 0.95 });
  if (lower.includes('longkang') || lower.includes('drain')) entities.push({ type: 'HAZARD_OBJECT', value: 'Drainage Channel', confidence: 0.95 });
  if (lower.includes('lampu') || lower.includes('streetlight')) entities.push({ type: 'HAZARD_OBJECT', value: 'Streetlight Fitting', confidence: 0.95 });
  if (lower.includes('pokok') || lower.includes('dahan')) entities.push({ type: 'HAZARD_OBJECT', value: 'Tree Canopy / Trunk', confidence: 0.95 });
  if (lower.includes('sampah') || lower.includes('waste')) entities.push({ type: 'HAZARD_OBJECT', value: 'Solid Waste Accumulation', confidence: 0.95 });

  // 6. Executive Formal Title Generation
  const primaryLandmark = detectedLandmarks[0] || 'Local Jurisdiction';
  const suggestedTitle = `${matchedPattern.formalTitlePrefix} near ${primaryLandmark}`;

  // 7. Actionable Summary
  const actionableSummary = `[NLP Triage: ${urgency}] ${bestCategory} complaint classified with ${(categoryConfidence * 100).toFixed(0)}% confidence. Public Frustration Index: ${frustrationIndex}%. Dispatched authority recommendation: ${matchedPattern.leadAgency.name}.`;

  return {
    rawText,
    detectedLanguage,
    category: bestCategory,
    categoryConfidence,
    suggestedTitle,
    severity,
    severityScore,
    urgency,
    sentiment: {
      score: sentimentScore,
      label: sentimentLabel,
      frustrationIndex
    },
    entities,
    detectedLandmarks,
    recommendedAgency: {
      name: matchedPattern.leadAgency.name,
      department: matchedPattern.leadAgency.department,
      confidence: categoryConfidence,
      reasoning: `Matched high-priority keywords for ${bestCategory} requiring technical intervention by ${matchedPattern.leadAgency.department}.`
    },
    actionableSummary
  };
}

/**
 * Batch NLP Triage for social feeds and unadjudicated queues
 */
export function batchTriageSignals(signals: Array<{ id: any; text: string }>): Array<NLPAnalysisResult & { id: any }> {
  return signals.map(s => ({
    id: s.id,
    ...analyzeCivicText(s.text)
  })).sort((a, b) => b.severityScore - a.severityScore);
}

// ─────────────────────────────────────────────────────────────
// Conversational AI Civic Chatbot Engine
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

export function generateChatbotResponse(
  message: string,
  userRole: 'ADMIN' | 'CITIZEN' = 'CITIZEN',
  language: 'EN' | 'BM' = 'EN',
  issuesContext: any[] = []
): {
  reply: string;
  suggestedActions: Array<{ label: string; action: string; payload?: any }>;
  nlpContext?: Partial<NLPAnalysisResult>;
} {
  const query = message.trim().toLowerCase();
  const isBM = language === 'BM' || query.includes('bagaimana') || query.includes('siapa') || query.includes('longkang') || query.includes('apa') || query.includes('tolong') || query.includes('bila');

  // Perform NLP analysis on the query itself
  const nlp = analyzeCivicText(message);

  // 1. Admin Queries
  if (userRole === 'ADMIN') {
    // Critical / Severe cases overview
    if (query.includes('critical') || query.includes('kritikal') || query.includes('bahaya') || query.includes('urgent')) {
      const criticalCases = issuesContext.filter(i => i.severity === 'CRITICAL' || (i.affectedCount && i.affectedCount >= 25));
      const count = criticalCases.length || 3;
      if (isBM) {
        return {
          reply: `🚨 **Ringkasan Kes Kritikal (${count} Kes Aktif):**\n\n- **CIV-2026-004281**: Banjir kilat & longkang tersumbat (Jalan 17/5) · 34 penduduk terjejas (Berulang 4x).\n- **CIV-2026-004282**: Lubang jalan dalam berhampiran lampu isyarat Jalan Universiti · Risiko kemalangan motosikal.\n- **Status Tindakan**: Unit Tindak Pantas MBPJ telah diarahkan ke lokasi tapak.`,
          suggestedActions: [
            { label: 'Buka Peta Langsung', action: 'NAVIGATE_TAB', payload: 'Live Map' },
            { label: 'Eksport Laporan CSV', action: 'TRIGGER_EXPORT' },
            { label: 'Lihat Isyarat Sosial AI', action: 'NAVIGATE_TAB', payload: 'Signals' }
          ],
          nlpContext: nlp
        };
      }
      return {
        reply: `🚨 **Critical Incidents Briefing (${count} Active High-Risk Cases):**\n\n- **CIV-2026-004281**: Severe Flash Flooding & Blocked Drain (Jalan 17/5) · 34 affected residents (4x recurring).\n- **CIV-2026-004282**: Deep Pothole Hazard near Jalan Universiti traffic lights · High vehicle hazard.\n- **Operational Status**: Fast-Response Units dispatched. Inter-agency tickets generated for JKR and MBPJ Engineering.`,
        suggestedActions: [
          { label: 'Open Live Incident Map', action: 'NAVIGATE_TAB', payload: 'Live Map' },
          { label: 'Export Incident CSV', action: 'TRIGGER_EXPORT' },
          { label: 'Review Social Signals', action: 'NAVIGATE_TAB', payload: 'Signals' }
        ],
        nlpContext: nlp
      };
    }

    // Agency / Jurisdiction routing inquiry
    if (query.includes('jkr') || query.includes('agency') || query.includes('agensi') || query.includes('bidang kuasa') || query.includes('jurisdiction') || query.includes('tnb') || query.includes('alam flora')) {
      if (isBM) {
        return {
          reply: `🏛️ **Panduan Bidang Kuasa & Penyerahan Agensi:**\n\n- **Jalan Persekutuan / Jalan Utama**: Di bawah seliaan **JKR Selangor** (cth. Jalan Universiti, Jalan Templer).\n- **Jalan Perbandaran & Longkang**: Di bawah bidang kuasa **MBPJ Kejuruteraan**.\n- **Pembersihan Sisa & Sampah Haram**: Diuruskan oleh konsesi **Alam Flora Sdn Bhd**.\n- **Lampu Jalan & Tiang Elektrik**: Di bawah seliaan **TNB Distribution (Petaling Jaya)**.\n\n*Petua:* Anda boleh menyerahkan bidang kuasa secara rasmi dalam tab 'Senarai Aduan' -> butang **Serah Bidang Kuasa**.*`,
          suggestedActions: [
            { label: 'Buka Senarai Aduan', action: 'NAVIGATE_TAB', payload: 'Issues' },
            { label: 'Draf Memo JKR', action: 'PREFILL_MEMO', payload: '@JKR: Mohon pemeriksaan segera laluan persekutuan.' }
          ],
          nlpContext: nlp
        };
      }
      return {
        reply: `🏛️ **Inter-Agency Jurisdiction Protocol:**\n\n- **Federal Trunk Roads**: Managed by **JKR Selangor** (e.g., Jalan Universiti, Federal Highway routes).\n- **Municipal Drainage & Roads**: Under **MBPJ Engineering Directorate**.\n- **Solid Waste & Bulk Clearing**: Managed by **Alam Flora Sdn Bhd**.\n- **Streetlights & Power Infrastructure**: Maintained by **Tenaga Nasional Berhad (TNB)**.\n\n*Tip:* To transfer lead agency jurisdiction, open any issue ticket and click **Handover Jurisdiction** to log an audit trail entry.`,
        suggestedActions: [
          { label: 'Open Issues Directory', action: 'NAVIGATE_TAB', payload: 'Issues' },
          { label: 'Draft JKR Memo', action: 'PREFILL_MEMO', payload: '@JKR: Urgent trunk road inspection required.' }
        ],
        nlpContext: nlp
      };
    }

    // Community Disputes & Consensus
    if (query.includes('dispute') || query.includes('pertikaian') || query.includes('verify') || query.includes('sahkan')) {
      if (isBM) {
        return {
          reply: `⚖️ **Status Pengesahan Komuniti (Audit Pertikaian):**\n\n- Terdapat **1 aduan sedang dipertikaikan** oleh penduduk: kes pembersihan sisa pukal Jalan 17/1 di mana **78% penduduk** mengundi 'Belum Selesai' di tapak fizikal.\n- **Peraturan Sistem**: Kontraktor tidak boleh menuntut bayaran selagi audit komuniti tidak mencapai konsensus sekurang-kurangnya 70% pengesahan.`,
          suggestedActions: [
            { label: 'Periksa Kes Dipertikaikan', action: 'FILTER_STATUS', payload: 'DISPUTED' },
            { label: 'Hantar Juruaudit Bebas', action: 'TRIGGER_AUDIT' }
          ],
          nlpContext: nlp
        };
      }
      return {
        reply: `⚖️ **Community Verification & Dispute Audit:**\n\n- There is **1 active disputed sign-off**: contractor marked Jalan 17/1 waste clearing as resolved, but **78% of verified residents** voted 'Not Fixed' with photographic evidence.\n- **Policy Safeguard**: CivicPulse automatically withholds municipal sign-off and flags the contractor for mandatory re-inspection.`,
        suggestedActions: [
          { label: 'Inspect Disputed Cases', action: 'FILTER_STATUS', payload: 'DISPUTED' },
          { label: 'Dispatch Independent Auditor', action: 'TRIGGER_AUDIT' }
        ],
        nlpContext: nlp
      };
    }

    // Default Admin Assistant reply
    if (isBM) {
      return {
        reply: `🤖 **Pembantu AI Eksekutif Majlis CivicPulse:**\n\nSaya boleh membantu anda memantau metrik aduan, memeriksa kes kecemasan, menguruskan penyerahan bidang kuasa agensi (JKR/TNB/Alam Flora), dan menyemak pertikaian komuniti.\n\nContoh soalan yang boleh ditanya:\n- *"Berapa banyak kes kritikal belum selesai?"*\n- *"Siapa bertanggungjawab untuk longkang utama?"*\n- *"Draf memo arahan tindakan untuk JKR"*`,
        suggestedActions: [
          { label: '🚨 Ringkasan Kes Kritikal', action: 'SEND_PROMPT', payload: 'Ringkasan kes kritikal' },
          { label: '🏛️ Panduan Bidang Kuasa Agensi', action: 'SEND_PROMPT', payload: 'Siapa bertanggungjawab untuk longkang dan jalan?' },
          { label: '⚖️ Semak Aduan Dipertikaikan', action: 'SEND_PROMPT', payload: 'Semak aduan dipertikaikan' }
        ],
        nlpContext: nlp
      };
    }
    return {
      reply: `🤖 **CivicPulse Council Co-Pilot:**\n\nI can assist you with monitoring incident telemetry, prioritizing field crew dispatches, drafting inter-agency memorandums, and resolving community verification disputes.\n\nTry asking:\n- *"What are the most critical unresolved cases?"*\n- *"Which agency handles culverts on federal roads?"*\n- *"Show me cases disputed by residents"*`,
      suggestedActions: [
        { label: '🚨 Summary of Critical Cases', action: 'SEND_PROMPT', payload: 'Summary of critical cases' },
        { label: '🏛️ Agency Jurisdiction Guide', action: 'SEND_PROMPT', payload: 'Which agency handles culverts and roads?' },
        { label: '⚖️ Review Resident Disputes', action: 'SEND_PROMPT', payload: 'Review resident disputes' }
      ],
      nlpContext: nlp
    };
  }

  // 2. Citizen / Resident Queries
  // How to report
  if (query.includes('how to report') || query.includes('cara lapor') || query.includes('buat aduan') || query.includes('hantar aduan')) {
    if (isBM) {
      return {
        reply: `📝 **Cara Menghantar Aduan Komuniti di CivicPulse:**\n\n1. Klik butang kuning besar **'HANTAR ADUAN ANDA DI SINI'** di laman utama.\n2. Tulis keterangan masalah dalam Bahasa Melayu, English, atau Manglish (cth: *"longkang tersumbat air naik dekat SS2"*).\n3. Klik **'✨ NLP Auto-Triage'** untuk AI mengisi kategori dan tajuk rasmi secara automatik!\n4. Lampirkan foto bukti jika ada, dan sahkan pin lokasi pada peta.\n5. Tekan **'Hantar Aduan'** — sistem akan memadankan kes pendua berhampiran secara automatik.`,
        suggestedActions: [
          { label: 'Buka Borang Aduan', action: 'OPEN_REPORT_MODAL' },
          { label: 'Lihat Peta Komuniti', action: 'NAVIGATE_TAB', payload: 'map' }
        ],
        nlpContext: nlp
      };
    }
    return {
      reply: `📝 **How to File a Civic Report on CivicPulse:**\n\n1. Tap the bright yellow **'REPORT YOUR ISSUE HERE'** button on the home screen.\n2. Type your problem in natural English, BM, or Manglish (e.g. *"huge pothole near SS2 traffic light"*).\n3. Tap **'✨ NLP Auto-Triage'** to let the AI auto-classify category, formal title, and urgency!\n4. Upload photos from your camera or gallery, and tap the map to set the precise location pin.\n5. Tap **'Submit Report'** — CivicPulse merges duplicate reports and notifies local council teams automatically.`,
      suggestedActions: [
        { label: 'Open Report Form', action: 'OPEN_REPORT_MODAL' },
        { label: 'View Community Map', action: 'NAVIGATE_TAB', payload: 'map' }
      ],
      nlpContext: nlp
    };
  }

  // Specific issue inquiry (e.g. Jalan 17/5 drain or pothole)
  if (query.includes('jalan 17') || query.includes('longkang') || query.includes('drain') || query.includes('banjir') || query.includes('pothole') || query.includes('lubang')) {
    if (isBM) {
      return {
        reply: `🌊 **Status Aduan Semasa (Seksyen 17 / Jalan 17/5):**\n\n- **Kes Terkini (CIV-2026-004281)**: Isu longkang tersumbat & risiko banjir kilat sedang berstatus **Dalam Tindakan (In Progress)**.\n- **Tindakan Majlis**: Unit Pembersihan MBPJ telah dijadualkan ke lokasi. Sebanyak **34 penduduk** telah menyokong aduan ini.\n- Anda boleh klik butang **'Saya Terjejas Juga'** untuk mengukuhkan keutamaan aduan ini kepada pihak majlis!`,
        suggestedActions: [
          { label: 'Sokong Aduan Ini (Saya Terjejas)', action: 'ENDORSE_ISSUE', payload: 'CIV-2026-004281' },
          { label: 'Lihat Perkembangan di Peta', action: 'NAVIGATE_TAB', payload: 'map' }
        ],
        nlpContext: nlp
      };
    }
    return {
      reply: `🌊 **Current Status (Section 17 / Jalan 17/5 Drainage):**\n\n- **Active Ticket (CIV-2026-004281)**: Blocked drain & overflow hazard is currently **In Progress**.\n- **Action Taken**: MBPJ Cleansing crew dispatched. **34 community residents** have backed this report.\n- You can tap **'I\'m Affected Too'** on the home feed to amplify this issue's priority with the city council!`,
      suggestedActions: [
        { label: 'Back This Issue (I\'m Affected)', action: 'ENDORSE_ISSUE', payload: 'CIV-2026-004281' },
        { label: 'View on Community Map', action: 'NAVIGATE_TAB', payload: 'map' }
      ],
      nlpContext: nlp
    };
  }

  // Hotlines & Contacts
  if (query.includes('hotline') || query.includes('telefon') || query.includes('contact') || query.includes('nombor') || query.includes('whatsapp') || query.includes('kecemasan')) {
    if (isBM) {
      return {
        reply: `📞 **Saluran Perhubungan Rasmi Pihak Berkuasa Tempatan:**\n\n- **MBPJ Hotlines**: 03-7956 3544 (Talian 24 Jam)\n- **WhatsApp Aduan MBPJ**: 019-338 1234\n- **Kecemasan Lampu & Elektrik (TNB)**: 15454\n- **Paip Pecah / Bekalan Air (Air Selangor)**: 15300\n- **Waktu Operasi Kaunter**: Isnin – Jumaat (8:00 AM – 5:30 PM)`,
        suggestedActions: [
          { label: 'Hantar Aduan Dalam Talian', action: 'OPEN_REPORT_MODAL' },
          { label: 'Lihat Profil & Tetapan', action: 'NAVIGATE_TAB', payload: 'profile' }
        ],
        nlpContext: nlp
      };
    }
    return {
      reply: `📞 **Official Municipal Emergency & Hotline Directory:**\n\n- **MBPJ General Hotline**: 03-7956 3544 (24/7 Operations)\n- **WhatsApp Complaints (MBPJ)**: 019-338 1234\n- **Streetlight / Power Outages (TNB)**: 15454\n- **Water Burst / Pipe Issues (Air Selangor)**: 15300\n- **Operating Hours**: Monday – Friday (8:00 AM – 5:30 PM)`,
      suggestedActions: [
        { label: 'Submit Online Complaint', action: 'OPEN_REPORT_MODAL' },
        { label: 'View Profile & Settings', action: 'NAVIGATE_TAB', payload: 'profile' }
      ],
      nlpContext: nlp
    };
  }

  // Default Resident response
  if (isBM) {
    return {
      reply: `👋 **Hai! Saya Pembantu AI CivicPulse anda.**\n\nSaya boleh membantu anda membuat aduan komuniti, menyemak status pembaikan longkang dan jalan di kawasan anda, serta memberikan nombor perhubungan pihak majlis.\n\nApa yang boleh saya bantu hari ini?`,
      suggestedActions: [
        { label: '📝 Bagaimana cara buat aduan?', action: 'SEND_PROMPT', payload: 'Bagaimana cara buat aduan?' },
        { label: '🌊 Status longkang Jalan 17/5', action: 'SEND_PROMPT', payload: 'Status longkang Jalan 17/5' },
        { label: '📞 Nombor hotline kecemasan', action: 'SEND_PROMPT', payload: 'Nombor hotline kecemasan' }
      ],
      nlpContext: nlp
    };
  }
  return {
    reply: `👋 **Hi there! I am your CivicPulse AI Community Assistant.**\n\nI can help you file civic reports with automated NLP tagging, check live repair updates for nearby potholes and blocked drains, or find council hotlines.\n\nHow can I help you today?`,
    suggestedActions: [
      { label: '📝 How do I submit a report?', action: 'SEND_PROMPT', payload: 'How do I submit a report?' },
      { label: '🌊 Status of Jalan 17/5 drain', action: 'SEND_PROMPT', payload: 'Status of Jalan 17/5 drain' },
      { label: '📞 Emergency council hotlines', action: 'SEND_PROMPT', payload: 'Emergency council hotlines' }
    ],
    nlpContext: nlp
  };
}
