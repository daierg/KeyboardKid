export interface TypingSnapshot {
  wpm: number;
  cpm: number;
  cps: number;
  todayKeys: number;
  todayActiveMs: number;
  day: string; // YYYY-MM-DD local
}

interface PersistedStats {
  day: string;
  todayKeys: number;
  todayActiveMs: number;
  history: Record<string, { keys: number; activeMs: number }>;
}

const STORAGE_KEY = 'keyboardkid_typing_stats_v1';
const WINDOW_MS = 5000;
const CHARS_PER_WORD = 5;

function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadPersisted(): PersistedStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedStats;
      if (parsed && typeof parsed.day === 'string') {
        return {
          day: parsed.day,
          todayKeys: Number(parsed.todayKeys) || 0,
          todayActiveMs: Number(parsed.todayActiveMs) || 0,
          history: parsed.history && typeof parsed.history === 'object' ? parsed.history : {},
        };
      }
    }
  } catch {
    // ignore
  }
  return { day: localDayKey(), todayKeys: 0, todayActiveMs: 0, history: {} };
}

function savePersisted(data: PersistedStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
}

/**
 * Rolling WPM/CPM/CPS + all-day key counters.
 * Counts key-down events only (no key text content is stored).
 */
export class TypingStats {
  private keyTimes: number[] = [];
  private persisted = loadPersisted();
  private lastKeyAt = -10000;
  private lastPersistAt = 0;
  private hudVisible = true;

  constructor() {
    this.rolloverIfNeeded();
  }

  public setHudVisible(v: boolean): void {
    this.hudVisible = v;
    try {
      localStorage.setItem('keyboardkid_stats_hud', v ? '1' : '0');
    } catch {
      // ignore
    }
  }

  public isHudVisible(): boolean {
    try {
      const v = localStorage.getItem('keyboardkid_stats_hud');
      if (v === '0') return false;
      if (v === '1') return true;
    } catch {
      // ignore
    }
    return this.hudVisible;
  }

  public recordKey(now = performance.now()): void {
    this.rolloverIfNeeded();
    this.keyTimes.push(now);
    while (this.keyTimes.length > 0 && now - this.keyTimes[0] > WINDOW_MS) {
      this.keyTimes.shift();
    }
    if (this.lastKeyAt > 0 && now - this.lastKeyAt < 4000) {
      this.persisted.todayActiveMs += Math.min(now - this.lastKeyAt, 2000);
    }
    this.lastKeyAt = now;
    this.persisted.todayKeys += 1;
    if (now - this.lastPersistAt > 2500) {
      this.flush();
      this.lastPersistAt = now;
    }
  }

  public flush(): void {
    this.rolloverIfNeeded();
    this.persisted.history[this.persisted.day] = {
      keys: this.persisted.todayKeys,
      activeMs: this.persisted.todayActiveMs,
    };
    savePersisted(this.persisted);
  }

  public snapshot(now = performance.now()): TypingSnapshot {
    this.rolloverIfNeeded();
    while (this.keyTimes.length > 0 && now - this.keyTimes[0] > WINDOW_MS) {
      this.keyTimes.shift();
    }
    const n = this.keyTimes.length;
    const cps = n / (WINDOW_MS / 1000);
    const cpm = cps * 60;
    const wpm = cpm / CHARS_PER_WORD;
    return {
      wpm: Math.round(wpm),
      cpm: Math.round(cpm),
      cps: Math.round(cps * 10) / 10,
      todayKeys: this.persisted.todayKeys,
      todayActiveMs: this.persisted.todayActiveMs,
      day: this.persisted.day,
    };
  }

  public formatHud(now = performance.now()): string {
    const s = this.snapshot(now);
    const keys =
      s.todayKeys >= 10000
        ? `${(s.todayKeys / 1000).toFixed(1)}k`
        : s.todayKeys.toLocaleString('en-US');
    return `${s.wpm} WPM · 今日 ${keys}`;
  }

  private rolloverIfNeeded(): void {
    const today = localDayKey();
    if (this.persisted.day !== today) {
      this.persisted.history[this.persisted.day] = {
        keys: this.persisted.todayKeys,
        activeMs: this.persisted.todayActiveMs,
      };
      // Keep last 14 days
      const keys = Object.keys(this.persisted.history).sort();
      while (keys.length > 14) {
        const old = keys.shift();
        if (old) delete this.persisted.history[old];
      }
      this.persisted.day = today;
      this.persisted.todayKeys = 0;
      this.persisted.todayActiveMs = 0;
      savePersisted(this.persisted);
    }
  }
}

export const typingStats = new TypingStats();
