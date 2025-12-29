import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Mic,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from './components/ui/button.jsx';
import { Input } from './components/ui/input.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './components/ui/dialog.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs.jsx';
import { cn } from './lib/utils.js';

const HISTORY_KEY = 'querybee_history';
const MAX_HISTORY = 200;

function getApiBase() {
  const explicit = (window.__QUERYBEE_API_BASE__ || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (window.location && window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }

  if (
    window.location &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.port &&
    window.location.port !== '3000'
  ) {
    return 'http://localhost:3000';
  }

  return '';
}

function ensureSessionId() {
  let sessionId = localStorage.getItem('querybee_session');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 12);
    localStorage.setItem('querybee_session', sessionId);
  }
  return sessionId;
}

function formatTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function randomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).slice(2);
}

const DEFAULT_QUICK = [
  { id: 'q1', text: 'What is QueryBee?' },
  { id: 'q2', text: 'How does it work?' },
  { id: 'q3', text: 'What can you help me with?' },
];

const DEFAULT_THEME = {
  accent: '166 74% 42%',
  accentFg: '0 0% 100%',
  bg: '220 20% 8%',
  fg: '210 40% 98%',
  card: '220 20% 10%',
  border: '220 12% 22%',
  muted: '220 16% 14%',
  mutedFg: '215 18% 72%',
  radius: '18px',
  font: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  bubbleStyle: 'soft',
  mode: 'dark',
  glass: 0.92,
  blur: 14,
  voiceUri: '',
  fontSize: 13,
};

const THEME_PRESETS = [
  {
    id: 'emerald-dark',
    name: 'Emerald Dark',
    theme: {
      mode: 'dark',
      accent: '166 74% 42%',
      accentFg: '0 0% 100%',
      bg: '220 20% 8%',
      fg: '210 40% 98%',
      card: '220 20% 10%',
      border: '220 12% 22%',
      muted: '220 16% 14%',
      mutedFg: '215 18% 72%',
      radius: '18px',
      font: DEFAULT_THEME.font,
      glass: 0.92,
      blur: 14,
    },
  },
  {
    id: 'ocean-light',
    name: 'Ocean Light',
    theme: {
      mode: 'light',
      accent: '203 89% 45%',
      accentFg: '0 0% 100%',
      bg: '210 40% 98%',
      fg: '222 47% 11%',
      card: '0 0% 100%',
      border: '214 18% 86%',
      muted: '210 32% 96%',
      mutedFg: '215 16% 40%',
      radius: '18px',
      font: DEFAULT_THEME.font,
      glass: 0.86,
      blur: 10,
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    theme: {
      mode: 'dark',
      accent: '262 83% 62%',
      accentFg: '0 0% 100%',
      bg: '240 20% 8%',
      fg: '210 40% 98%',
      card: '240 18% 12%',
      border: '240 12% 24%',
      muted: '240 18% 14%',
      mutedFg: '235 14% 72%',
      radius: '20px',
      font: DEFAULT_THEME.font,
      glass: 0.90,
      blur: 16,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    theme: {
      mode: 'dark',
      accent: '24 94% 50%',
      accentFg: '0 0% 100%',
      bg: '14 22% 8%',
      fg: '30 40% 96%',
      card: '14 18% 12%',
      border: '14 12% 24%',
      muted: '14 16% 14%',
      mutedFg: '20 16% 74%',
      radius: '22px',
      font: DEFAULT_THEME.font,
      glass: 0.90,
      blur: 14,
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    theme: {
      mode: 'dark',
      accent: '215 20% 56%',
      accentFg: '0 0% 100%',
      bg: '220 10% 10%',
      fg: '210 20% 96%',
      card: '220 10% 14%',
      border: '220 8% 24%',
      muted: '220 10% 16%',
      mutedFg: '220 10% 70%',
      radius: '16px',
      font: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
      glass: 0.92,
      blur: 12,
    },
  },
  {
    id: 'mint-glass',
    name: 'Mint Glass',
    theme: {
      mode: 'light',
      accent: '158 64% 40%',
      accentFg: '0 0% 100%',
      bg: '210 40% 98%',
      fg: '222 47% 11%',
      card: '0 0% 100%',
      border: '214 18% 86%',
      muted: '210 32% 96%',
      mutedFg: '215 16% 40%',
      radius: '22px',
      font: DEFAULT_THEME.font,
      glass: 0.78,
      blur: 18,
    },
  },
];

function loadTheme() {
  try {
    const raw = localStorage.getItem('querybee_theme');
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

function saveTheme(next) {
  localStorage.setItem('querybee_theme', JSON.stringify(next));
}

export function QueryBeeWidget() {
  const API_BASE = useMemo(() => getApiBase(), []);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [theme, setTheme] = useState(() => loadTheme());

  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [quickVisible, setQuickVisible] = useState(true);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-MAX_HISTORY);
    } catch {
      return [];
    }
  });

  const [panelSize, setPanelSize] = useState(() => {
    try {
      const raw = localStorage.getItem('querybee_size');
      if (!raw) return { w: 360, h: 520 };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.w !== 'number' || typeof parsed.h !== 'number') return { w: 360, h: 520 };
      return { w: Math.round(parsed.w), h: Math.round(parsed.h) };
    } catch {
      return { w: 360, h: 520 };
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState(null);
  const recognitionRef = useRef(null);

  const [speechState, setSpeechState] = useState({ messageId: null, playing: false });
  const [voices, setVoices] = useState([]);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const [dragEnabled, setDragEnabled] = useState(false);
  const [pos, setPos] = useState(() => {
    try {
      const raw = localStorage.getItem('querybee_position');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const isTouchDevice = useMemo(() => {
    return (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
    );
  }, []);

  useEffect(() => {
    setDragEnabled(!isTouchDevice && !expanded);
  }, [isTouchDevice]);

  useEffect(() => {
    setDragEnabled(!isTouchDevice && !expanded);
  }, [isTouchDevice, expanded]);

  useEffect(() => {
    const hasUserMsg = messages.some((m) => m.type === 'user');
    setQuickVisible(!hasUserMsg);
  }, [messages]);

  useEffect(() => {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }, [messages]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages, typing]);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e) => {
      const s = resizeRef.current;
      if (!s) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;

      const maxW = Math.max(300, Math.min(560, window.innerWidth - 24));
      const maxH = Math.max(420, Math.min(760, window.innerHeight - 140));
      const nextW = clamp(s.startW + dx, 300, maxW);
      const nextH = clamp(s.startH + dy, 420, maxH);
      setPanelSize({ w: Math.round(nextW), h: Math.round(nextH) });
    };

    const onUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
      try {
        localStorage.setItem('querybee_size', JSON.stringify(panelSize));
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isResizing, panelSize]);

  useEffect(() => {
    const onResize = () => {
      if (!pos) return;
      const next = open && !expanded
        ? clampBubblePos(pos, { panelW: panelSize.w, panelH: panelSize.h })
        : clampBubblePos(pos, { panelW: 56, panelH: 56 });
      if (next.x !== pos.x || next.y !== pos.y) {
        setPos(next);
        try {
          localStorage.setItem('querybee_position', JSON.stringify(next));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pos, open, expanded, panelSize]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE}/api/test`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!cancelled) setIsConnected(!!res.ok);
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    }

    check();
    const id = setInterval(check, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [API_BASE]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const update = () => {
      try {
        const list = synth.getVoices() || [];
        setVoices(list);
      } catch {
        setVoices([]);
      }
    };
    update();
    synth.onvoiceschanged = update;
    return () => {
      try {
        synth.onvoiceschanged = null;
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.addEventListener('start', () => {
      setMicStatus(null);
      setIsListening(true);
    });
    rec.addEventListener('end', () => setIsListening(false));
    rec.addEventListener('error', (event) => {
      setIsListening(false);
      const err = event?.error || '';
      if (err) setMicStatus(err);
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        addBot('Microphone permission is blocked. Please allow microphone access and try again.');
      }
    });
    rec.addEventListener('result', (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim?.() || '';
      if (transcript) {
        setInput(transcript);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    });

    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addMessage(entry) {
    setMessages((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_HISTORY) return next.slice(next.length - MAX_HISTORY);
      return next;
    });
  }

  function addBot(text) {
    addMessage({
      id: randomId(),
      sender: 'QueryBee',
      text,
      type: 'bot',
      timestamp: Date.now(),
      feedback: null,
    });
  }

  function addUser(text) {
    addMessage({
      id: randomId(),
      sender: 'You',
      text,
      type: 'user',
      timestamp: Date.now(),
      feedback: null,
    });
  }

  function maybeGreeting() {
    if (messages.length > 0) return;
    addBot("Hello there! 👋 It's nice to meet you!");
    setTimeout(() => {
      addBot(
        'What brings you here today? Use the quick questions below or ask me anything about M. L. Dahanukar College.'
      );
    }, 350);
  }

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        setTimeout(() => maybeGreeting(), 150);
      } else {
        setExpanded(false);
      }
      return next;
    });
  }

  function clampBubblePos(next, opts) {
    const padding = 8;
    const bubble = 56;
    const panelW = opts?.panelW || bubble;
    const panelH = opts?.panelH || bubble;
    const gap = opts?.gap || 0;

    const minX = Math.max(padding, panelW - bubble + padding);
    const minY = Math.max(padding, panelH + gap - bubble + padding);
    const maxX = Math.max(minX, window.innerWidth - bubble - padding);
    const maxY = Math.max(minY, window.innerHeight - bubble - padding);

    return {
      x: Math.max(minX, Math.min(next.x, maxX)),
      y: Math.max(minY, Math.min(next.y, maxY)),
    };
  }

  function clearChat() {
    if (!messages.length) {
      setMessages([]);
      return;
    }
    const ok = window.confirm('Clear all chat history?');
    if (!ok) return;
    setMessages([]);
    addBot('Chat history cleared.');
  }

  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    if (isSending) return;

    setQuickVisible(false);
    setIsSending(true);
    setTyping(true);

    addUser(trimmed);

    try {
      const sessionId = ensureSessionId();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_BASE}/api/dialogflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const txt = await res.text();
        throw new Error(
          txt ? 'Server returned an invalid response. Check server logs.' : 'Server returned an invalid response.'
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.response || data?.error || `HTTP error: ${res.status}`);
      }

      setIsConnected(true);

      if (data?.response) addBot(data.response);
      else if (data?.error) addBot(data.error);
      else addBot("Sorry, I didn't get a response.");
    } catch (e) {
      const msg = e?.name === 'AbortError' ? 'Request timed out. Please try again.' : e?.message || 'Sorry, something went wrong.';
      setIsConnected(false);
      addBot(msg);
    } finally {
      setTyping(false);
      setIsSending(false);
    }
  }

  function toggleListening() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isSending) return;

    try {
      if (isListening) rec.stop();
      else rec.start();
    } catch {
      // ignore
    }
  }

  function toggleSpeech(entry) {
    if (!('speechSynthesis' in window)) return;

    const isSame = speechState.messageId === entry.id && speechState.playing;
    window.speechSynthesis.cancel();

    if (isSame) {
      setSpeechState({ messageId: null, playing: false });
      return;
    }

    const utter = new SpeechSynthesisUtterance(entry.text);
    utter.lang = 'en-US';
    utter.rate = 1;
    utter.pitch = 1;

    if (theme.voiceUri) {
      const v = (voices || []).find((x) => x.voiceURI === theme.voiceUri);
      if (v) utter.voice = v;
    }

    utter.onend = () => setSpeechState({ messageId: null, playing: false });
    utter.onerror = () => setSpeechState({ messageId: null, playing: false });

    setSpeechState({ messageId: entry.id, playing: true });
    window.speechSynthesis.speak(utter);
  }

  function setFeedback(entryId, value) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== entryId) return m;
        const next = m.feedback === value ? null : value;
        return { ...m, feedback: next };
      })
    );
  }

  const themeStyle = useMemo(() => {
    return {
      '--qb-accent': theme.accent,
      '--qb-accent-fg': theme.accentFg,
      '--qb-bg': theme.bg,
      '--qb-fg': theme.fg,
      '--qb-card': theme.card,
      '--qb-border': theme.border,
      '--qb-muted': theme.muted,
      '--qb-muted-fg': theme.mutedFg,
      '--qb-radius': theme.radius,
      '--qb-font': theme.font,
      '--qb-glass': String(theme.glass ?? 0.92),
      '--qb-blur': `${Math.round(theme.blur ?? 14)}px`,
      '--qb-font-size': `${Math.round(theme.fontSize ?? 13)}px`,
    };
  }, [theme]);

  const panelVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' },
    show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, y: 22, scale: 0.98, filter: 'blur(6px)' },
  };

  return (
    <div className="qb-surface" style={themeStyle}>
      <motion.div
        className="fixed z-[9999] relative h-14 w-14"
        style={pos ? { left: pos.x, top: pos.y } : { right: 18, bottom: 18 }}
        drag={dragEnabled && !open && !expanded}
        dragMomentum={false}
        dragElastic={0.12}
        onDragEnd={(e, info) => {
          if (!dragEnabled) return;
          const nextRaw = { x: info.point.x, y: info.point.y };
          const next = open && !expanded
            ? clampBubblePos(nextRaw, { panelW: panelSize.w, panelH: panelSize.h, gap: 16 })
            : clampBubblePos(nextRaw, { panelW: 56, panelH: 56 });
          setPos(next);
          localStorage.setItem('querybee_position', JSON.stringify(next));
        }}
      >
        <motion.button
          onClick={toggleOpen}
          className={cn(
            'qb-motion relative grid place-items-center rounded-full border border-[hsl(var(--qb-border))] bg-gradient-to-br from-[hsl(var(--qb-accent))] to-[#7c3aed] text-[hsl(var(--qb-accent-fg))] shadow-[0_16px_40px_rgba(0,0,0,0.28)]',
            open ? 'h-11 w-11' : 'h-14 w-14'
          )}
          style={{ zIndex: 20, position: 'absolute', right: 0, bottom: 0 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Open QueryBee"
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MessageSquare className="h-6 w-6" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={panelVariants}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={cn(
                'qb-motion absolute right-0 flex flex-col overflow-hidden rounded-[var(--qb-radius)] border border-[hsl(var(--qb-border))] text-[hsl(var(--qb-fg))] shadow-[0_20px_60px_rgba(0,0,0,0.25)]',
                'bg-[hsl(var(--qb-bg)/var(--qb-glass))] backdrop-blur-[var(--qb-blur)]',
                expanded ? 'fixed left-0 right-0 top-0 bottom-0 w-auto rounded-none' : 'bottom-16'
              )}
              style={
                expanded
                  ? undefined
                  : isTouchDevice
                    ? { width: 'min(360px, calc(100vw - 24px))', height: 'min(520px, calc(100vh - 140px))' }
                    : { width: `${panelSize.w}px`, height: `${panelSize.h}px` }
              }
            >
              <div className="relative">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.18),transparent_45%)]" />
                <div className="relative flex items-center justify-between gap-2 border-b border-[hsl(var(--qb-border))] bg-[rgba(0,0,0,0.15)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-white/10">
                      <span aria-hidden="true">🤖</span>
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">QueryBee</div>
                        <div className="flex items-center gap-1 text-xs text-[hsl(var(--qb-muted-fg))]">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                            )}
                          />
                          <span>{isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[hsl(var(--qb-muted-fg))]">Ask anything about MLDC</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-[14px]"
                      onClick={() => setSettingsOpen(true)}
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-[14px]"
                      onClick={() => {
                        setOpen(false);
                        setExpanded(false);
                      }}
                      title="Minimize"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-[14px]"
                      onClick={() => setExpanded((v) => !v)}
                      title={expanded ? 'Exit full screen' : 'Full screen'}
                    >
                      {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-[14px]"
                      onClick={() => {
                        setOpen(false);
                        setExpanded(false);
                      }}
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className={cn('flex min-h-0 flex-1 flex-col')}>
                <div
                  ref={listRef}
                  className={cn(
                    'min-h-0 flex-1 overflow-y-auto px-3 py-3',
                    'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className={cn('flex', m.type === 'user' ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-[16px] border px-3 py-2 shadow-sm',
                              m.type === 'user'
                                ? 'border-transparent bg-[hsl(var(--qb-accent))] text-[hsl(var(--qb-accent-fg))]'
                                : (theme.mode || 'dark') === 'dark'
                                  ? 'border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] text-[hsl(var(--qb-fg))]'
                                  : 'border-gray-300 bg-white text-gray-900'
                            )}
                          >
                            <div className="text-[length:var(--qb-font-size)] leading-relaxed">{m.text}</div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className={cn(
                                'text-[10px] opacity-80',
                                m.type === 'user'
                                  ? 'text-[hsl(var(--qb-accent-fg))]'
                                  : (theme.mode || 'dark') === 'dark'
                                    ? 'text-[hsl(var(--qb-muted-fg))]'
                                    : 'text-gray-500'
                              )}>
                                {formatTime(m.timestamp)}
                              </div>
                              {m.type === 'bot' && (
                                <div className="flex items-center gap-1">
                                  {'speechSynthesis' in window && (
                                    <button
                                      className={cn(
                                        'grid h-7 w-7 place-items-center rounded-[10px] border transition-colors',
                                        (theme.mode || 'dark') === 'dark'
                                          ? 'border-[hsl(var(--qb-border))] bg-transparent text-[hsl(var(--qb-muted-fg))] hover:bg-[hsl(var(--qb-muted))]'
                                          : 'border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100'
                                      )}
                                      onClick={() => toggleSpeech(m)}
                                      title={
                                        speechState.messageId === m.id && speechState.playing
                                          ? 'Stop narration'
                                          : 'Play response'
                                      }
                                    >
                                      {speechState.messageId === m.id && speechState.playing ? (
                                        <VolumeX className="h-3.5 w-3.5" />
                                      ) : (
                                        <Volume2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}

                                  <button
                                    className={cn(
                                      'grid h-7 w-7 place-items-center rounded-[10px] border transition-colors',
                                      (theme.mode || 'dark') === 'dark'
                                        ? 'border-[hsl(var(--qb-border))] bg-transparent'
                                        : 'border-gray-300 bg-transparent',
                                      m.feedback === 'up'
                                        ? (theme.mode || 'dark') === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                        : (theme.mode || 'dark') === 'dark' ? 'text-[hsl(var(--qb-muted-fg))]' : 'text-gray-600',
                                      (theme.mode || 'dark') === 'dark' ? 'hover:bg-[hsl(var(--qb-muted))]' : 'hover:bg-gray-100'
                                    )}
                                    onClick={() => setFeedback(m.id, 'up')}
                                    title="Helpful"
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    className={cn(
                                      'grid h-7 w-7 place-items-center rounded-[10px] border transition-colors',
                                      (theme.mode || 'dark') === 'dark'
                                        ? 'border-[hsl(var(--qb-border))] bg-transparent'
                                        : 'border-gray-300 bg-transparent',
                                      m.feedback === 'down'
                                        ? (theme.mode || 'dark') === 'dark' ? 'text-rose-400' : 'text-rose-600'
                                        : (theme.mode || 'dark') === 'dark' ? 'text-[hsl(var(--qb-muted-fg))]' : 'text-gray-600',
                                      (theme.mode || 'dark') === 'dark' ? 'hover:bg-[hsl(var(--qb-muted))]' : 'hover:bg-gray-100'
                                    )}
                                    onClick={() => setFeedback(m.id, 'down')}
                                    title="Not helpful"
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          key="typing"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex justify-start"
                        >
                          <div className="rounded-[16px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 py-2">
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--qb-muted-fg))] [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--qb-muted-fg))] [animation-delay:120ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--qb-muted-fg))] [animation-delay:240ms]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence>
                  {quickVisible && quick.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="border-t border-[hsl(var(--qb-border))] bg-[rgba(255,255,255,0.06)] px-3 py-2"
                    >
                      <div className="flex flex-col gap-2">
                        {quick.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between gap-2 rounded-[14px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 py-2"
                          >
                            <button
                              className="flex-1 text-left text-[length:calc(var(--qb-font-size)-1px)] text-[hsl(var(--qb-fg))]"
                              onClick={() => sendMessage(q.text)}
                            >
                              {q.text}
                            </button>
                            <button
                              className="grid h-7 w-7 place-items-center rounded-[12px] text-[hsl(var(--qb-muted-fg))] hover:bg-[hsl(var(--qb-muted))]"
                              onClick={() => setQuick((prev) => prev.filter((x) => x.id !== q.id))}
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="qb-safe-bottom border-t border-[hsl(var(--qb-border))] bg-[rgba(0,0,0,0.15)] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Write a message"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = input;
                            setInput('');
                            sendMessage(v);
                          }
                        }}
                        disabled={isSending}
                      />
                    </div>

                    <div className="relative">
                      <Button
                        size="icon"
                        variant="outline"
                        className={cn(
                          'rounded-[14px]',
                          isListening && 'border-emerald-400/60'
                        )}
                        onClick={toggleListening}
                        disabled={isSending || !(window.SpeechRecognition || window.webkitSpeechRecognition)}
                        title={
                          !(window.SpeechRecognition || window.webkitSpeechRecognition)
                            ? 'Voice input not supported'
                            : isListening
                              ? 'Stop listening'
                              : 'Tap to speak'
                        }
                      >
                        <Mic className="h-4 w-4" />
                      </Button>

                      <AnimatePresence>
                        {isListening && (
                          <motion.span
                            className="pointer-events-none absolute inset-0 rounded-[14px]"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: [0.25, 0.1, 0.25], scale: [1, 1.2, 1] }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ boxShadow: '0 0 0 2px rgba(52, 211, 153, 0.35)' }}
                          />
                        )}
                      </AnimatePresence>
                    </div>

                    <Button
                      size="icon"
                      className="rounded-[14px]"
                      onClick={() => {
                        const v = input;
                        setInput('');
                        sendMessage(v);
                      }}
                      disabled={isSending || !input.trim()}
                      title="Send"
                    >
                      {isSending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        >
                          <Send className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {micStatus && (
                    <div className="mt-1 text-[10px] text-rose-300">
                      Mic: {micStatus === 'not-allowed' || micStatus === 'service-not-allowed'
                        ? 'permission blocked (allow mic permission in browser)'
                        : micStatus.replace(/-/g, ' ')}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[hsl(var(--qb-muted-fg))]">
                    <div>
                      By chatting, you agree to our{' '}
                      <a href="terms.html" className="underline decoration-white/20 hover:decoration-white/60">
                        privacy policy
                      </a>
                      .
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-[12px]"
                      onClick={clearChat}
                      title="Clear chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>

                  <div className="mt-1 text-[10px] text-[hsl(var(--qb-muted-fg))]">
                    Powered by <span className="font-medium text-[hsl(var(--qb-fg))]">🤖 Vighnesh More</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-[11px] text-[hsl(var(--qb-muted-fg))]">Theme</div>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={(theme.mode || 'dark') === 'dark'}
                        className={cn(
                          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--qb-accent))]/50',
                          (theme.mode || 'dark') === 'dark' ? 'bg-[hsl(var(--qb-accent))]' : 'bg-gray-400'
                        )}
                        onClick={() => {
                          const mode = (theme.mode || 'dark') === 'dark' ? 'light' : 'dark';
                          const preset = mode === 'dark' ? THEME_PRESETS[0]?.theme : THEME_PRESETS[1]?.theme;
                          if (preset) {
                            setTheme((prev) => ({
                              ...prev,
                              mode,
                              bg: preset.bg,
                              card: preset.card,
                              border: preset.border,
                              muted: preset.muted,
                              mutedFg: preset.mutedFg,
                            }));
                          } else {
                            setTheme((prev) => ({ ...prev, mode }));
                          }
                        }}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300',
                            (theme.mode || 'dark') === 'dark' ? 'translate-x-7' : 'translate-x-0'
                          )}
                        />
                      </button>
                      <span className={cn(
                        'ml-2 text-[11px] font-medium',
                        (theme.mode || 'dark') === 'dark' ? 'text-white' : 'text-gray-700'
                      )}>
                        {(theme.mode || 'dark') === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!expanded && !isTouchDevice && (
                <div
                  className="absolute bottom-2 right-2 grid h-6 w-6 cursor-nwse-resize place-items-center rounded-[10px] border border-[hsl(var(--qb-border))] bg-white/5"
                  style={{ zIndex: 15, color: (theme.mode || 'dark') === 'dark' ? 'white' : 'black' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                    resizeRef.current = {
                      startX: e.clientX,
                      startY: e.clientY,
                      startW: panelSize.w,
                      startH: panelSize.h,
                    };
                  }}
                  title="Resize"
                >
                  <span className="text-[10px]">↘</span>
                </div>
              )}

              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Customization</DialogTitle>
                    <DialogDescription>Change the widget theme and typography (saved on this device).</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="theme">
                    <TabsList>
                      <TabsTrigger value="theme">Theme</TabsTrigger>
                      <TabsTrigger value="typography">Fonts</TabsTrigger>
                      <TabsTrigger value="voice">Voice</TabsTrigger>
                    </TabsList>

                    <TabsContent value="theme">
                      <div className="mt-2 grid gap-3">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium text-white">Presets</div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {THEME_PRESETS.map((p) => (
                              <button
                                key={p.id}
                                className="rounded-[12px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 py-2 text-left text-[12px] hover:bg-[hsl(var(--qb-muted))]"
                                onClick={() => setTheme((prev) => ({ ...prev, ...p.theme }))}
                              >
                                <div className="font-medium text-white">{p.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 py-2">
                          <div>
                            <div className="text-sm font-medium text-white">Light / Dark</div>
                            <div className="text-[12px] text-white/60">Switch base appearance.</div>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <span className="text-[12px] text-[hsl(var(--qb-muted-fg))]">Light</span>
                            <input
                              type="checkbox"
                              checked={(theme.mode || 'dark') === 'dark'}
                              onChange={(e) => {
                                const mode = e.target.checked ? 'dark' : 'light';
                                const preset = mode === 'dark' ? THEME_PRESETS[0] : THEME_PRESETS[1];
                                setTheme((prev) => ({ ...prev, mode, ...preset.theme, accent: prev.accent, accentFg: prev.accentFg, radius: prev.radius, font: prev.font, glass: prev.glass, blur: prev.blur, fg: prev.fg }));
                              }}
                            />
                            <span className="text-[12px] text-[hsl(var(--qb-muted-fg))]">Dark</span>
                          </label>
                        </div>

                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Accent color</div>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={hslToHex(theme.accent)}
                              onChange={(e) => {
                                const hsl = hexToHsl(e.target.value);
                                setTheme((prev) => ({ ...prev, accent: hsl }));
                              }}
                              className="h-10 w-14 rounded-[12px] border border-[hsl(var(--qb-border))] bg-transparent"
                            />
                            <div className="text-sm text-[hsl(var(--qb-muted-fg))]">Applies to buttons and user bubbles.</div>
                          </div>
                        </div>

                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Text color</div>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={hslToHex(theme.fg)}
                              onChange={(e) => {
                                const hsl = hexToHsl(e.target.value);
                                setTheme((prev) => ({ ...prev, fg: hsl }));
                              }}
                              className="h-10 w-14 rounded-[12px] border border-[hsl(var(--qb-border))] bg-transparent"
                            />
                            <div className="text-sm text-[hsl(var(--qb-muted-fg))]">Controls main text color.</div>
                          </div>
                        </div>

                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Glass intensity</div>
                          <input
                            type="range"
                            min={0.7}
                            max={1}
                            step={0.02}
                            value={theme.glass ?? 0.92}
                            onChange={(e) => setTheme((p) => ({ ...p, glass: parseFloat(e.target.value) }))}
                          />
                        </div>

                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Glass blur</div>
                          <input
                            type="range"
                            min={0}
                            max={24}
                            step={1}
                            value={Math.round(theme.blur ?? 14)}
                            onChange={(e) => setTheme((p) => ({ ...p, blur: parseFloat(e.target.value) }))}
                          />
                        </div>

                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Corner radius</div>
                          <input
                            type="range"
                            min={12}
                            max={26}
                            value={parseInt(theme.radius, 10) || 18}
                            onChange={(e) => setTheme((p) => ({ ...p, radius: `${e.target.value}px` }))}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="typography">
                      <div className="mt-2 grid gap-3">
                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Font</div>
                          <select
                            value={theme.font}
                            onChange={(e) => setTheme((p) => ({ ...p, font: e.target.value }))}
                            className="h-10 w-full rounded-[12px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 text-sm"
                          >
                            <option value={DEFAULT_THEME.font}>System</option>
                            <option value="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Modern Sans</option>
                            <option value="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Inter</option>
                            <option value="Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Poppins</option>
                            <option value="Montserrat, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Montserrat</option>
                            <option value="Nunito, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Nunito</option>
                            <option value="DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">DM Sans</option>
                            <option value="Playfair Display, ui-serif, Georgia, Cambria, Times New Roman, Times, serif">Playfair Display</option>
                            <option value="Roboto Slab, ui-serif, Georgia, Cambria, Times New Roman, Times, serif">Roboto Slab</option>
                            <option value="ui-serif, Georgia, Cambria, Times New Roman, Times, serif">Serif</option>
                            <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace">Mono</option>
                            <option value="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace">JetBrains Mono</option>
                          </select>
                        </div>

                        <div className="grid gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-white">Font size</div>
                            <div className="text-[12px] text-white/60">{Math.round(theme.fontSize ?? 13)}px</div>
                          </div>
                          <input
                            type="range"
                            min={12}
                            max={16}
                            value={Math.round(theme.fontSize ?? 13)}
                            onChange={(e) => setTheme((p) => ({ ...p, fontSize: parseInt(e.target.value, 10) }))}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="voice">
                      <div className="mt-2 grid gap-3">
                        <div className="grid gap-1">
                          <div className="text-sm font-medium text-white">Speech voice</div>
                          <select
                            value={theme.voiceUri || ''}
                            onChange={(e) => setTheme((p) => ({ ...p, voiceUri: e.target.value }))}
                            className="h-10 w-full rounded-[12px] border border-[hsl(var(--qb-border))] bg-[hsl(var(--qb-card))] px-3 text-sm"
                            disabled={!('speechSynthesis' in window)}
                          >
                            <option value="">Default</option>
                            {(voices || []).map((v) => (
                              <option key={v.voiceURI} value={v.voiceURI}>
                                {v.name} ({v.lang})
                              </option>
                            ))}
                          </select>
                          {!('speechSynthesis' in window) && (
                            <div className="text-[12px] text-[hsl(var(--qb-muted-fg))]">Speech synthesis is not supported in this browser.</div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-4 flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="secondary">Done</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

function hexToHsl(hex) {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hh = Math.round(h * 360);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);
  return `${hh} ${ss}% ${ll}%`;
}

function hslToHex(hsl) {
  try {
    const parts = String(hsl).trim().split(/\s+/);
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace('%', '')) / 100;
    const l = parseFloat(parts[2].replace('%', '')) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (n) => {
      const v = Math.round((n + m) * 255);
      return v.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return '#22c55e';
  }
}
