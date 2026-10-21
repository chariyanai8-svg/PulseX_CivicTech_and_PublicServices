import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Globe,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SupportedLanguage, t } from '../../../../packages/shared-types';
import { API_BASE } from '../apiConfig';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
  provider?: 'gemini' | 'groq' | 'local_nlp';
  model?: string;
}

interface CivicChatbotProps {
  role?: 'ADMIN' | 'CITIZEN';
  language: SupportedLanguage;
  onToggleLanguage?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenReportModal?: (prefillTitle?: string, prefillDesc?: string) => void;
  onEndorseIssue?: (issueId: string) => void;
  onFilterStatus?: (status: string) => void;
  floatingPosition?: string;
  isOpenControlled?: boolean;
  onOpenControlled?: () => void;
  onCloseControlled?: () => void;
  layoutMode?: 'desktop' | 'phone';
}

export const CivicChatbot: React.FC<CivicChatbotProps> = ({
  role = 'CITIZEN',
  language,
  onToggleLanguage,
  onNavigateTab,
  onOpenReportModal,
  onEndorseIssue,
  onFilterStatus,
  floatingPosition = 'bottom-20 right-4 sm:bottom-6 sm:right-6',
  isOpenControlled,
  onOpenControlled,
  onCloseControlled,
  layoutMode = 'phone'
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<'auto' | 'gemini' | 'groq'>('auto');
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const handleSetOpen = (open: boolean) => {
    setInternalIsOpen(open);
    if (isOpenControlled !== undefined) {
      if (open && onOpenControlled) onOpenControlled();
      if (!open && onCloseControlled) onCloseControlled();
    }
  };

  const isPhoneLayout = layoutMode === 'phone' || role === 'CITIZEN';
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'msg-init',
    sender: 'assistant',
    text: language === 'BM'
      ? '👋 **Hai! Saya Pembantu Aduan AI Komuniti anda.**\n\nAda masalah longkang tersumbat, lampu jalan rosak, atau jalan berlubang? Tulis kepada saya atau pilih soalan cadangan di bawah untuk bantuan segera!'
      : '👋 **Hi! I am your CivicPulse AI Resident Concierge.**\n\nNeed help reporting a pothole, tracking drainage repairs, or finding council hotlines? Ask me anything or select a prompt below!',
    timestamp: 'Just now',
    suggestedActions: language === 'BM'
      ? [
          { label: '📝 Cara Buat Aduan', action: 'SEND_PROMPT', payload: 'Bagaimana cara buat aduan?' },
          { label: '🌊 Status Longkang Jln 17/5', action: 'SEND_PROMPT', payload: 'Status longkang Jalan 17/5' },
          { label: '📞 Hotline Kecemasan', action: 'SEND_PROMPT', payload: 'Nombor hotline kecemasan' }
        ]
      : [
          { label: '📝 How to Report?', action: 'SEND_PROMPT', payload: 'How do I submit a report?' },
          { label: '🌊 Jalan 17/5 Drain Status', action: 'SEND_PROMPT', payload: 'Status of Jalan 17/5 drain' },
          { label: '📞 Emergency Hotlines', action: 'SEND_PROMPT', payload: 'Emergency council hotlines' }
        ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([initialGreeting]);
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role,
          language,
          provider: aiProvider,
          history: messages.slice(-4).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (res.ok) {
        const json = await res.json();
        const botData = json.data;
        const botMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'assistant',
          text: botData.reply || (language === 'BM' ? 'Maaf, tiada maklum balas daripada pelayan.' : 'Sorry, no response received from server.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: botData.suggestedActions || [],
          provider: botData.provider,
          model: botData.model
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.warn('Chatbot fallback error:', err);
      const lower = query.toLowerCase();
      let fallbackText = '';
      let fallbackActions: Array<{ label: string; action: string; payload?: any }> = [];

      if (lower.includes('how to report') || lower.includes('cara lapor') || lower.includes('buat aduan') || lower.includes('hantar aduan')) {
        fallbackText = language === 'BM'
          ? '📝 **Cara Menghantar Aduan di CivicPulse:**\n\n1. Klik butang kuning **"HANTAR ADUAN ANDA DI SINI"**.\n2. Tulis masalah anda secara ringkas.\n3. Tekan **✨ NLP Auto-Triage** untuk cadangan kategori automatik.\n4. Sahkan pin lokasi pada peta dan hantar!'
          : '📝 **How to Submit a Report on CivicPulse:**\n\n1. Tap the yellow **"REPORT YOUR ISSUE HERE"** button.\n2. Type your problem in natural language.\n3. Tap **✨ NLP Auto-Triage** for automated classification.\n4. Confirm your map pin and submit!';
        fallbackActions = [
          { label: language === 'BM' ? 'Buka Borang Aduan' : 'Open Report Form', action: 'OPEN_REPORT_MODAL' },
          { label: language === 'BM' ? 'Lihat Peta Komuniti' : 'View Map', action: 'NAVIGATE_TAB', payload: 'map' }
        ];
      } else if (lower.includes('jalan 17') || lower.includes('longkang') || lower.includes('drain') || lower.includes('banjir') || lower.includes('pothole') || lower.includes('lubang')) {
        fallbackText = language === 'BM'
          ? '🌊 **Status Aduan Semasa (Seksyen 17 / Jalan 17/5):**\n\n- **CIV-2026-004281**: Longkang tersumbat & risiko limpahan banjir sedang **Dalam Tindakan**.\n- Skuad Pembersihan MBPJ telah dijadualkan ke lokasi. Sebanyak **34 penduduk** telah menyokong aduan ini.'
          : '🌊 **Current Status (Section 17 / Jalan 17/5 Drainage):**\n\n- **CIV-2026-004281**: Blocked drain & flash flood risk is currently **In Progress**.\n- MBPJ Cleansing squad dispatched. **34 verified residents** have endorsed this report.';
        fallbackActions = [
          { label: language === 'BM' ? 'Sokong Aduan Ini (Saya Terjejas)' : 'Back This Issue (I\'m Affected)', action: 'ENDORSE_ISSUE', payload: 'CIV-2026-004281' },
          { label: language === 'BM' ? 'Buka Peta' : 'Open Map', action: 'NAVIGATE_TAB', payload: 'map' }
        ];
      } else if (lower.includes('hotline') || lower.includes('telefon') || lower.includes('contact') || lower.includes('nombor') || lower.includes('kecemasan')) {
        fallbackText = language === 'BM'
          ? '📞 **Hotline Pihak Berkuasa Tempatan:**\n\n- **MBPJ 24-Jam**: 03-7956 3544\n- **WhatsApp MBPJ**: 019-338 1234\n- **TNB (Lampu/Elektrik)**: 15454\n- **Air Selangor (Paip Pecah)**: 15300'
          : '📞 **Municipal Hotline Directory:**\n\n- **MBPJ 24-Hour Hotline**: 03-7956 3544\n- **MBPJ WhatsApp**: 019-338 1234\n- **TNB Outages**: 15454\n- **Air Selangor Pipe Burst**: 15300';
        fallbackActions = [
          { label: language === 'BM' ? 'Hantar Aduan Dalam Talian' : 'Submit Report', action: 'OPEN_REPORT_MODAL' }
        ];
      } else if (lower.includes('high risk') || lower.includes('berisiko') || lower.includes('critical') || lower.includes('bahaya')) {
        fallbackText = language === 'BM'
          ? '🚨 **Aduan Berisiko Tinggi Semasa:**\n\n- **CIV-2026-004281**: Banjir Kilat & Longkang Tersumbat (Jalan 17/5) · 34 penduduk terjejas.\n- **CIV-2026-004285**: Lubang Jalan Dalam (Jalan 17/2) · Bahaya kemalangan motosikal.'
          : '🚨 **Active High-Risk Cases:**\n\n- **CIV-2026-004281**: Flash Flooding & Blocked Drain (Jalan 17/5) · 34 residents affected.\n- **CIV-2026-004285**: Severe Road Pothole (Jalan 17/2) · Motorcycle accident hazard.';
        fallbackActions = [
          { label: language === 'BM' ? 'Lihat di Peta Langsung' : 'View on Live Map', action: 'NAVIGATE_TAB', payload: 'map' },
          { label: language === 'BM' ? 'Buka Borang Aduan' : 'Open Report Form', action: 'OPEN_REPORT_MODAL' }
        ];
      } else {
        fallbackText = language === 'BM'
          ? `🤖 **Pembantu AI Komuniti CivicPulse:**\n\nSaya telah merekodkan mesej anda. Adakah anda mahu saya sediakan borang aduan dengan butiran ini?`
          : `🤖 **CivicPulse AI Resident Concierge:**\n\nI noted your inquiry. Would you like me to open the report form with your message pre-filled?`;
        fallbackActions = [
          {
            label: language === 'BM' ? '📝 Buka Borang Aduan (Auto-Isi)' : '📝 Open Pre-filled Report Form',
            action: 'OPEN_REPORT_MODAL',
            payload: { title: query.slice(0, 50), description: query }
          },
          { label: language === 'BM' ? '🗺️ Peta Komuniti' : '🗺️ Community Map', action: 'NAVIGATE_TAB', payload: 'map' }
        ];
      }

      const fallbackReply: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: fallbackActions
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string, payload?: any) => {
    if (action === 'SEND_PROMPT') {
      handleSendMessage(payload);
    } else if (action === 'NAVIGATE_TAB' && onNavigateTab) {
      onNavigateTab(payload);
      handleSetOpen(false);
    } else if (action === 'OPEN_REPORT_MODAL' && onOpenReportModal) {
      if (typeof payload === 'object' && payload !== null) {
        onOpenReportModal(payload.title, payload.description);
      } else {
        onOpenReportModal();
      }
      handleSetOpen(false);
    } else if (action === 'FILTER_STATUS' && onFilterStatus) {
      onFilterStatus(payload);
    } else if (action === 'ENDORSE_ISSUE' && onEndorseIssue) {
      onEndorseIssue(payload);
      const ackMsg: ChatMessage = {
        id: `msg-ack-${Date.now()}`,
        sender: 'assistant',
        text: language === 'BM'
          ? `✅ **Sokongan Berjaya Didaftarkan!** Anda telah mengesahkan terjejas oleh aduan **${payload}**. Terima kasih kerana membantu mengukuhkan keutamaan tindakan majlis.`
          : `✅ **Endorsement Registered!** You confirmed being affected by issue **${payload}**. Thank you for helping escalate this priority with the council.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: language === 'BM' ? 'Lihat Peta Komuniti' : 'View on Map', action: 'NAVIGATE_TAB', payload: 'map' }
        ]
      };
      setMessages(prev => [...prev, ackMsg]);
    }
  };

  const formatInline = (text: string) => {
    const tokenRegex = /(\*\*.*?\*\*|`.*?`)/g;
    const parts = text.split(tokenRegex);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-slate-50">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200/80 dark:border-blue-800/80 shadow-2xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const formatText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Empty line
      if (trimmed === '') {
        return <div key={idx} className="h-1.5" />;
      }

      // Divider
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        return <hr key={idx} className="my-2.5 border-t border-slate-200 dark:border-slate-700/60" />;
      }

      // Markdown Headers (###, ##, #)
      if (trimmed.startsWith('#')) {
        const headerLevel = trimmed.match(/^#+/)?.[0].length || 1;
        const headerText = trimmed.replace(/^#+\s*/, '');
        return (
          <div key={idx} className="mt-3 mb-1.5 flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="w-1.5 h-3.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shrink-0" />
            <span className={headerLevel <= 2 ? 'text-xs font-black' : 'text-xs font-extrabold'}>
              {formatInline(headerText)}
            </span>
          </div>
        );
      }

      // Markdown Table Row (e.g. | col | col |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (/^\|[-:\s|]+\|$/.test(trimmed)) {
          return null;
        }
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map(c => c.trim())
          .filter(c => c.length > 0);

        return (
          <div
            key={idx}
            className="my-1.5 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100 shadow-2xs"
          >
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className="inline-flex items-center text-xs">
                {formatInline(cell)}
                {cIdx < cells.length - 1 && (
                  <span className="ml-1.5 text-slate-400 dark:text-slate-500 font-bold">·</span>
                )}
              </span>
            ))}
          </div>
        );
      }

      // Bullets (- or *)
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      if (isBullet) {
        const bulletText = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs my-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
            {formatInline(bulletText)}
          </li>
        );
      }

      // Numbered lists (e.g. 1. Item)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="ml-2 text-xs my-0.5 leading-relaxed flex items-start gap-1.5 text-slate-800 dark:text-slate-200">
            <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{numMatch[1]}.</span>
            <span>{formatInline(numMatch[2])}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5 text-slate-800 dark:text-slate-200">
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex justify-end pointer-events-none z-[9050] animate-in fade-in zoom-in-95">
          <button
            onClick={() => handleSetOpen(true)}
            className="pointer-events-auto group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 text-white border-blue-400/40 hover:shadow-blue-500/30 ring-2 ring-white/20"
            title={language === 'BM' ? 'Buka Pembantu AI Aduan' : 'Open Resident AI Aduan'}
          >
            <div className="relative">
              <Bot size={19} className="animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black tracking-wide flex items-center gap-1">
                <span>{language === 'BM' ? 'AI Aduan Penduduk' : 'Resident AI Aduan'}</span>
                <span className="text-[8px] bg-white/25 px-1 py-0.2 rounded font-mono uppercase tracking-wider">{language}</span>
              </div>
              <p className="text-[9px] text-white/80 font-medium leading-none">
                {language === 'BM' ? 'Bantuan aduan segera' : 'Instant civic triage'}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* CHAT WINDOW (PHONE IN-APP MODAL OR DESKTOP POPUP) */}
      {isOpen && (
        isPhoneLayout ? (
          <>
            {/* Transparent backdrop for outside clicks - no blur, no blackout */}
            <div
              className="fixed inset-0 z-[9490] cursor-default"
              onClick={() => handleSetOpen(false)}
            />
            <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[9500] bg-white dark:bg-[#121420] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border-x border-slate-200 dark:border-white/10">
              {/* TOP BAR FOR PHONE */}
              <div className="p-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shrink-0 chatbot-dark-topbar">
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => handleSetOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                    title={language === 'BM' ? 'Kembali ke Aplikasi' : 'Back to App'}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Bot size={18} className="text-indigo-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs tracking-tight text-white" style={{ color: '#ffffff' }}>
                        {t('chat.citizen_title', language)}
                      </h3>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {language === 'BM' ? 'Dalam Talian' : 'Online'}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/90 font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {language === 'BM' ? 'Aduan MBPJ & Triage Komuniti' : 'MBPJ Reports & Civic Triage'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {onToggleLanguage && (
                    <button
                      onClick={onToggleLanguage}
                      style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border transition flex items-center gap-1"
                      title="Toggle Language (EN / BM)"
                    >
                      <Globe size={11} className="text-white" />
                      <span style={{ color: '#ffffff' }}>{language}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleSetOpen(false)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition flex items-center justify-center border border-white/10 active:scale-95"
                    title="Close chat"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* MESSAGES LIST FOR PHONE */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/70 dark:bg-[#0d0f17]/70 custom-scrollbar">
                {messages.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white dark:bg-[#191c2b] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {!isUser ? (
                          <div className="space-y-1">{formatText(msg.text)}</div>
                        ) : (
                          <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[9px] text-slate-400">
                          {msg.timestamp}
                        </span>
                        {!isUser && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                            🤖 Civic AI
                          </span>
                        )}
                      </div>

                      {!isUser && msg.suggestedActions && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                          {msg.suggestedActions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => handleActionClick(act.action, act.payload)}
                              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#202436] hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold shadow-xs transition hover:scale-[1.02] active:scale-95 flex items-center gap-1"
                            >
                              <span>{act.label}</span>
                              <ChevronRight size={10} className="text-indigo-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-[#191c2b] text-slate-500 dark:text-slate-400 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-white/10 text-xs w-fit">
                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                    <span className="font-medium animate-pulse">
                      {language === 'BM' ? 'AI sedang menganalisis...' : 'AI is thinking...'}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPTS STRIP */}
              <div className="px-3 py-2 bg-slate-100/80 dark:bg-[#151724] border-t border-slate-200 dark:border-white/5 flex gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {(language === 'BM'
                  ? ['📝 Cara Buat Aduan', '🌊 Status Longkang', '📞 Hotline MBPJ', '🚨 Aduan Berisiko']
                  : ['📝 How to Report?', '🌊 Drain Status', '📞 Council Hotlines', '🚨 High Risk Cases']
                ).map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 whitespace-nowrap transition active:scale-95 shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* INPUT FORM */}
              <div className="p-2.5 bg-white dark:bg-[#121420] border-t border-slate-200 dark:border-white/10 shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={
                      language === 'BM'
                        ? 'Tanya soalan (cth: status longkang Jalan 17/5)...'
                        : 'Ask question (e.g. status of drain Jalan 17/5)...'
                    }
                    className="flex-1 bg-slate-100 dark:bg-[#1a1d2e] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none transition font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-2.5 rounded-xl text-white font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shrink-0 active:scale-95"
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div
            className={`fixed z-[9995] bg-white dark:bg-[#121420] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'inset-3 sm:inset-12 max-w-2xl mx-auto'
                : `${floatingPosition} w-[92vw] sm:w-[380px] h-[520px] max-h-[80vh]`
            }`}
          >
            {/* TOP BAR */}
            <div className="p-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-900/90 via-blue-900/90 to-slate-900 text-white chatbot-dark-topbar">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Bot size={18} className="text-indigo-200" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-xs tracking-tight text-white" style={{ color: '#ffffff' }}>
                      {t('chat.citizen_title', language)}
                    </h3>
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      {language === 'BM' ? 'Dalam Talian' : 'Online'}
                    </span>
                  </div>
                       </div>
              </div>

              <div className="flex items-center space-x-1">
                {onToggleLanguage && (
                  <button
                    onClick={onToggleLanguage}
                    style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border transition flex items-center gap-1"
                    title="Toggle Language (EN / BM)"
                  >
                    <Globe size={11} className="text-white" />
                    <span style={{ color: '#ffffff' }}>{language}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center border border-white/10"
                  title={isExpanded ? 'Minimize' : 'Maximize'}
                >
                  {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>

                <button
                  onClick={() => handleSetOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition flex items-center justify-center border border-white/10"
                  title="Close chat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70 dark:bg-[#0d0f17]/70 custom-scrollbar">
              {messages.map(msg => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-[#191c2b] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {!isUser ? (
                        <div className="space-y-1">{formatText(msg.text)}</div>
                      ) : (
                        <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[9px] text-slate-400">
                        {msg.timestamp}
                      </span>
                      {!isUser && (
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                          🤖 Civic AI
                        </span>
                      )}
                    </div>

                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-w-[90%]">
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleActionClick(act.action, act.payload)}
                            className="px-2 py-0.5 rounded-full bg-white dark:bg-[#202436] hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[9px] font-bold shadow-xs transition hover:scale-[1.02] active:scale-95 flex items-center gap-1"
                          >
                            <span>{act.label}</span>
                            <ChevronRight size={9} className="text-blue-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-[#191c2b] text-slate-500 dark:text-slate-400 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-white/10 text-xs w-fit">
                  <Loader2 size={13} className="animate-spin text-blue-500" />
                  <span className="font-medium animate-pulse">
                    {language === 'BM' ? 'AI sedang mencari jawapan...' : 'AI is searching...'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK PROMPTS STRIP */}
            <div className="px-2.5 py-1.5 bg-slate-100/80 dark:bg-[#151724] border-t border-slate-200 dark:border-white/5 flex gap-1.5 overflow-x-auto hide-scrollbar">
              {(language === 'BM'
                ? ['📝 Cara Buat Aduan', '🌊 Longkang Jln 17/5', '📞 Hotline MBPJ']
                : ['📝 How to Report?', '🌊 Jln 17/5 Drain', '📞 Council Hotlines']
              ).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 whitespace-nowrap transition active:scale-95 shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* INPUT FORM */}
            <div className="p-2.5 bg-white dark:bg-[#121420] border-t border-slate-200 dark:border-white/10">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={t('chat.input_placeholder', language)}
                  className="flex-1 bg-slate-100 dark:bg-[#1a1d2e] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs px-3 py-2 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-40"
                  title="Send message"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )
      )}
    </>
  );
};
export default CivicChatbot;
