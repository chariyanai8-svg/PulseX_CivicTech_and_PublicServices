export type SupportedLanguage = 'EN' | 'BM';

export interface TranslationDictionary {
  [key: string]: {
    EN: string;
    BM: string;
  };
}

export const I18N_STRINGS: Record<string, { EN: string; BM: string }> = {
  // Brand & Shell
  'app.name': { EN: 'CivicPulse', BM: 'CivicPulse' },
  'app.portal.council': { EN: 'Council Portal', BM: 'Portal Majlis' },
  'app.portal.citizen': { EN: 'Resident Portal', BM: 'Portal Penduduk' },
  'app.search_placeholder': { EN: 'Search cases, roads, IDs...', BM: 'Cari kes, jalan, ID...' },
  'app.switch_theme': { EN: 'Switch Theme', BM: 'Tukar Tema' },
  'app.language': { EN: 'Language', BM: 'Bahasa' },
  'app.lang_toggle': { EN: 'BM', BM: 'EN' },
  'app.lang_full': { EN: 'English', BM: 'Bahasa Melayu' },
  'app.sign_out': { EN: 'Sign Out', BM: 'Log Keluar' },

  // Navigation Tabs (Admin)
  'nav.dashboard': { EN: 'Dashboard', BM: 'Papan Pemuka' },
  'nav.live_map': { EN: 'Live Map', BM: 'Peta Langsung' },
  'nav.issues': { EN: 'Issues', BM: 'Senarai Aduan' },
  'nav.analytics': { EN: 'Analytics', BM: 'Analisis Data' },
  'nav.signals': { EN: 'Signals', BM: 'Pengesahan Isyarat' },

  // Navigation Tabs (Citizen)
  'nav.home': { EN: 'Home', BM: 'Utama' },
  'nav.map': { EN: 'Map', BM: 'Peta' },
  'nav.activity': { EN: 'Activity', BM: 'Aktiviti' },
  'nav.profile': { EN: 'Profile', BM: 'Profil' },

  // KPI Metrics (Admin)
  'kpi.active_incidents': { EN: 'ACTIVE INCIDENTS', BM: 'KES AKTIF SEMASA' },
  'kpi.active_incidents_sub': { EN: 'High-risk & ongoing dispatches', BM: 'Disalur & dalam tindakan segera' },
  'kpi.resolution_rate': { EN: 'VERIFIED RESOLUTION RATE', BM: 'KADAR KELULUSAN KOMUNITI' },
  'kpi.resolution_rate_sub': { EN: 'Citizen physical sign-off rate', BM: 'Pengesahan fizikal oleh penduduk' },
  'kpi.recurring_problems': { EN: 'RECURRING PROBLEMS', BM: 'MASALAH BERULANG' },
  'kpi.recurring_problems_sub': { EN: 'Locations with ≥2 repeated repairs', BM: 'Lokasi berulang ≥2 kali pembaikan' },
  'kpi.frustration_index': { EN: 'PUBLIC FRUSTRATION INDEX', BM: 'INDEKS KELUHAN AWAM' },
  'kpi.frustration_index_sub': { EN: 'NLP sentiment & social pressure', BM: 'Sentimen NLP & tekanan media sosial' },

  // Statuses
  'status.REPORTED': { EN: 'Reported', BM: 'Dilaporkan' },
  'status.IN_PROGRESS': { EN: 'In Progress', BM: 'Dalam Tindakan' },
  'status.MARKED_RESOLVED': { EN: 'Marked Resolved', BM: 'Ditandai Selesai' },
  'status.COMMUNITY_VERIFIED': { EN: 'Community Verified', BM: 'Disahkan Komuniti' },
  'status.DISPUTED': { EN: 'Disputed', BM: 'Dipertikaikan' },
  'status.VERIFIED': { EN: 'Verified', BM: 'Disahkan' },

  // Categories
  'cat.DRAINAGE': { EN: 'Drainage / Flooding', BM: 'Saliran & Banjir Kilat' },
  'cat.ROADS': { EN: 'Roads / Potholes', BM: 'Jalan Raya & Lubang' },
  'cat.WASTE': { EN: 'Waste / Garbage', BM: 'Sisa & Sampah Haram' },
  'cat.LIGHTING': { EN: 'Streetlight / Power', BM: 'Lampu Jalan & Elektrik' },
  'cat.FALLEN_TREES': { EN: 'Fallen Trees', BM: 'Pokok Tumbang / Ranting' },
  'cat.OTHER': { EN: 'General / Facilities', BM: 'Kemudahan / Lain-lain' },

  // Citizen Dashboard
  'citizen.welcome': { EN: 'Welcome back,', BM: 'Selamat kembali,' },
  'citizen.report_button': { EN: 'REPORT YOUR ISSUE HERE', BM: 'HANTAR ADUAN ANDA DI SINI' },
  'citizen.active_area': { EN: 'Active Area Incident', BM: 'Isu Aktif Di Kawasan Anda' },
  'citizen.active_issues_title': { EN: 'Active Community Issues', BM: 'Aduan Komuniti Aktif' },
  'citizen.active_issues_sub': { EN: 'Tap any issue to inspect progress & endorse', BM: 'Tekan mana-mana aduan untuk semak & sokong' },
  'citizen.community_verification_title': { EN: 'Community Verification', BM: 'Pengesahan Komuniti' },
  'citizen.community_verification_sub': { EN: 'Council marked these completed. Confirm physical repair quality.', BM: 'PBT tandai selesai. Sahkan kualiti pembaikan fizikal di lokasi.' },
  'citizen.awaiting_audit': { EN: 'Awaiting Audit', BM: 'Menunggu Pengesahan' },
  'citizen.endorse_button': { EN: "I'm Affected Too", BM: 'Saya Terjejas Juga' },
  'citizen.endorsed_badge': { EN: '✓ Backed', BM: '✓ Disokong' },
  'citizen.vote_fixed': { EN: '🟢 Fixed', BM: '🟢 Selesai' },
  'citizen.vote_partial': { EN: '🟡 Partial', BM: '🟡 Separa' },
  'citizen.vote_not_fixed': { EN: '🔴 Not Fixed', BM: '🔴 Belum Selesai' },
  'citizen.vote_prompt': { EN: 'Has this actually been fixed at the physical site?', BM: 'Adakah masalah ini benar-benar telah dibaiki di tapak fizikal?' },
  'citizen.view_map': { EN: 'View Map', BM: 'Lihat Peta' },
  'citizen.inspecting': { EN: 'Inspecting', BM: 'Sedang Disemak' },
  'citizen.tap_to_view': { EN: 'Tap to View', BM: 'Lihat Butiran' },
  'citizen.nlp_autotriage': { EN: '✨ NLP Auto-Triage (BM/EN)', BM: '✨ Auto-Klasifikasi AI (BM/EN)' },
  'citizen.submit_report': { EN: 'Submit Report', BM: 'Hantar Aduan' },
  'citizen.cancel': { EN: 'Cancel', BM: 'Batal' },

  // Admin Actions
  'action.dispatch_auditor': { EN: 'Dispatch Field Auditor', BM: 'Hantar Juruaudit Tapak' },
  'action.reject_resolution': { EN: 'Withhold Sign-off / Reject', BM: 'Tahan Kelulusan / Tolak Bayaran' },
  'action.force_close': { EN: 'Administrative Force-Close', BM: 'Kelulusan Tutup Paksa Eksekutif' },
  'action.handover': { EN: 'Handover Jurisdiction', BM: 'Serah Bidang Kuasa' },
  'action.export_csv': { EN: 'Export CSV', BM: 'Eksport CSV' },
  'action.save_notes': { EN: 'Post Note', BM: 'Hantar Catatan' },

  // AI Chatbot
  'chat.admin_title': { EN: 'CivicPulse Council Co-Pilot', BM: 'Pembantu AI Eksekutif Majlis' },
  'chat.citizen_title': { EN: 'CivicPulse Resident Concierge', BM: 'Pembantu Aduan Komuniti AI' },
  'chat.online_status': { EN: 'AI Engine Active · EN & BM', BM: 'Enjin AI Aktif · BM & EN' },
  'chat.input_placeholder': { EN: 'Ask a question or request assistance...', BM: 'Tanya soalan atau minta bantuan AI...' },
  'chat.quick_prompts': { EN: 'Quick Prompts', BM: 'Cadangan Soalan' },
  'chat.open_assistant': { EN: 'AI Assistant', BM: 'Pembantu AI' },
  'chat.close': { EN: 'Close', BM: 'Tutup' }
};

export function t(key: string, lang: SupportedLanguage = 'EN', fallback?: string): string {
  const entry = I18N_STRINGS[key];
  if (!entry) return fallback !== undefined ? fallback : key;
  return entry[lang] || entry.EN || fallback || key;
}

export const TITLE_TRANSLATIONS: Record<string, string> = {
  'Flash Flooding & Blocked Drain': 'Banjir Kilat & Longkang Tersumbat',
  'Deep Pothole Hazard': 'Bahaya Lubang Jalan Raya',
  'Damaged Guardrail & Broken Kerb': 'Penghadang Jalan Rosak & Bebendul Pecah',
  'Fallen Tree Branch Obstructing Street': 'Dahan Pokok Tumbang Menghalang Laluan',
  'Drain Clearing at Jalan 17/5': 'Pembersihan Longkang di Jalan 17/5',
  'Streetlight Bulb Replacement': 'Penggantian Mentol Lampu Jalan',
  'Illegal Waste Dumping at Alley': 'Pembuangan Sampah Haram di Lorong',
  'Water Disruption & Low Pressure': 'Gangguan Bekalan Air & Tekanan Rendah',
  'Streetlight Outage': 'Kerosakan Lampu Jalan',
  'Blocked Drain & Overflow Risk': 'Longkang Tersumbat & Risiko Limpahan Air',
  'Road Surface Defect': 'Kecacatan Permukaan Jalan Raya',
  'Drainage Issue': 'Masalah Saliran & Longkang'
};

export const DESC_TRANSLATIONS: Record<string, string> = {
  'Longkang tersumbat teruk dekat belakang kedai. Heavy rain causes water to overflow into Jalan 17/5.':
    'Longkang tersumbat teruk di belakang lot kedai. Hujan lebat kerap menyebabkan air melimpah ke Jalan 17/5.',
  'Dangerous pothole near the traffic light. Multiple motorbikes almost crashed.':
    'Lubang jalan berbahaya berhampiran lampu isyarat. Beberapa penunggang motosikal hampir terbabas kemalangan.',
  'Guardrail hit by lorry last night. Sharp metal protruding towards pedestrian walkway.':
    'Penghadang jalan dilanggar lori malam tadi. Logam tajam terkeluar ke arah laluan pejalan kaki.',
  'Bulk construction debris and broken furniture dumped behind shoplots.':
    'Sisa bahan binaan pukal dan perabot lama dilonggokkan secara haram di belakang lot kedai.',
  'Heavy branch blocking pedestrian lane and half the road after thunderstorm.':
    'Dahan pokok besar menghalang lorong pejalan kaki dan separuh jalan raya selepas ribut petir.',
  'Streetlight pole broken near junction, completely dark at night.':
    'Tiang lampu jalan patah berhampiran simpang, gelap gelita dan berbahaya pada waktu malam.',
  'No water supply since morning, low pressure affecting residential blocks.':
    'Tiada bekalan air sejak pagi tadi, tekanan rendah menjejaskan blok perumahan penduduk.',
  'PBT contractor cleared sediment and unblocked underground drain segment.':
    'Kontraktor PBT telah mengorek kelodak dan membuka sekatan saluran pembetung bawah tanah.',
  'Replaced malfunctioning LED streetlight lamp near traffic junction.':
    'Telah menukar lampu jalan LED yang rosak berhampiran persimpangan trafik Jalan 17.'
};

export const TIMELINE_TRANSLATIONS: Record<string, string> = {
  'First reported by community': 'Mula dilaporkan oleh komuniti',
  '12 residents confirmed affected': '12 penduduk sahkan terjejas',
  'PBT Verified issue': 'PBT mengesahkan aduan',
  'Repair work scheduled': 'Kerja pembaikan dijadualkan',
  'Reported by resident': 'Dilaporkan oleh penduduk',
  'Under preliminary review': 'Sedang dalam semakan awal',
  'Reported by community': 'Dilaporkan oleh komuniti',
  'PBT completed cleaning': 'PBT selesai pembersihan',
  'Marked resolved by local council': 'Ditandai selesai oleh majlis tempatan',
  'Reported by Citizen': 'Dilaporkan oleh penduduk',
  'PBT maintenance completed': 'Penyelenggaraan PBT selesai',
  'Repaired by contractor': 'Dibaiki oleh kontraktor',
  'Marked resolved by council': 'Ditandai selesai oleh majlis',
  'Reported': 'Dilaporkan',
  'Community verification in progress': 'Pengesahan komuniti sedang berlangsung'
};

export const NOTIFICATION_TRANSLATIONS: Record<string, string> = {
  'Work Dispatched': 'Tindakan Digerakkan',
  'Action Dispatched': 'Tindakan Digerakkan',
  'MBPJ Cleansing unit assigned to Jalan 17/5 drain.': 'Unit Pembersihan MBPJ ditugaskan ke longkang Jalan 17/5.',
  'Recurrence Flagged': 'Corak Berulang Dikesan',
  'CIV-2026-004281 flagged as repeat occurrence.': 'CIV-2026-004281 ditandakan sebagai aduan berulang.',
  'CIV-2026-004281 flagged as 4x repeat occurrence.': 'CIV-2026-004281 ditandakan 4x berulang.',
  'Flood Risk Warning': 'Amaran Risiko Banjir',
  'Heavy evening downpour anticipated near Section 17.': 'Hujan lebat dijangka petang ini berhampiran Seksyen 17.',
  'Citizen Consensus': 'Konsensus Penduduk',
  'CIV-2026-003910 verified with 75% approval.': 'CIV-2026-003910 disahkan dengan 75% persetujuan penduduk.'
};

export const HOTSPOT_TRANSLATIONS: Record<string, string> = {
  'Section 17 Drainage Corridor': 'Koridor Saliran Seksyen 17',
  'Jalan Universiti Road Belt': 'Zon Laluan Jalan Universiti',
  'SS2 Waste Accumulation Zone': 'Zon Longgokan Sisa SS2',
  'Section 17 School Zone': 'Zon Sekolah Seksyen 17'
};

export const TIME_TRANSLATIONS: Record<string, string> = {
  '10m ago': '10 min lalu',
  '45m ago': '45 min lalu',
  '1h ago': '1 jam lalu',
  '2h ago': '2 jam lalu',
  '3h ago': '3 jam lalu',
  'Today': 'Hari Ini',
  'Just now': 'Sebentar tadi',
  'Yesterday': 'Semalam'
};

export function translateTitle(title?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !title) return title || '';
  const trimmed = title.trim();
  return TITLE_TRANSLATIONS[trimmed] || title;
}

export function translateDescription(desc?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !desc) return desc || '';
  const trimmed = desc.trim();
  return DESC_TRANSLATIONS[trimmed] || desc;
}

export function translateTimeline(title?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !title) return title || '';
  const trimmed = title.trim();
  return TIMELINE_TRANSLATIONS[trimmed] || title;
}

export function translateNotification(text?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !text) return text || '';
  const trimmed = text.trim();
  return NOTIFICATION_TRANSLATIONS[trimmed] || text;
}

export function translateHotspot(name?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !name) return name || '';
  const trimmed = name.trim();
  return HOTSPOT_TRANSLATIONS[trimmed] || name;
}

export function translateTimeAgo(time?: string, lang: SupportedLanguage = 'EN'): string {
  if (lang === 'EN' || !time) return time || '';
  const trimmed = time.trim();
  return TIME_TRANSLATIONS[trimmed] || time;
}

