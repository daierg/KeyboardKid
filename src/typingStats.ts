export interface TypingSnapshot {
  /** Instantaneous characters per minute (rolling window). */
  cpm: number;
  cps: number;
  /** Characters typed today (key-down events counted as chars). */
  todayChars: number;
  todayPeakCpm: number;
  todayActiveMs: number;
  day: string; // YYYY-MM-DD local
}

interface PersistedStats {
  day: string;
  todayChars: number;
  todayPeakCpm: number;
  todayActiveMs: number;
  history: Record<string, { chars: number; peakCpm: number; activeMs: number }>;
}

const STORAGE_KEY = 'keyboardkid_typing_stats_v1';
const WINDOW_MS = 5000;

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
      const parsed = JSON.parse(raw) as PersistedStats & {
        todayKeys?: number;
        history?: Record<string, { keys?: number; chars?: number; peakCpm?: number; activeMs?: number }>;
      };
      if (parsed && typeof parsed.day === 'string') {
        const history: PersistedStats['history'] = {};
        if (parsed.history && typeof parsed.history === 'object') {
          for (const [k, v] of Object.entries(parsed.history)) {
            history[k] = {
              chars: Number(v.chars ?? v.keys) || 0,
              peakCpm: Number(v.peakCpm) || 0,
              activeMs: Number(v.activeMs) || 0,
            };
          }
        }
        return {
          day: parsed.day,
          todayChars: Number(parsed.todayChars ?? parsed.todayKeys) || 0,
          todayPeakCpm: Number(parsed.todayPeakCpm) || 0,
          todayActiveMs: Number(parsed.todayActiveMs) || 0,
          history,
        };
      }
    }
  } catch {
    // ignore
  }
  return { day: localDayKey(), todayChars: 0, todayPeakCpm: 0, todayActiveMs: 0, history: {} };
}

function savePersisted(data: PersistedStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
}

/**
 * Rolling CPM/CPS + all-day character counters and peak speed.
 * Counts key-down events only (no key text content is stored).
 */
export class TypingStats {
  private keyTimes: number[] = [];
  private persisted = loadPersisted();
  private lastKeyAt = -10000;
  private lastPersistAt = 0;
  private hudVisible = true;
  private midnightTimer: number | null = null;

  constructor() {
    this.rolloverIfNeeded();
    this.armMidnightTimer();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.ensureToday();
          this.armMidnightTimer();
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.ensureToday();
        this.armMidnightTimer();
      });
    }
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
    this.persisted.todayChars += 1;

    const cpm = this.instantCpm(now);
    if (cpm > this.persisted.todayPeakCpm) {
      this.persisted.todayPeakCpm = cpm;
    }

    if (now - this.lastPersistAt > 2500) {
      this.flush();
      this.lastPersistAt = now;
    }
  }

  public flush(): void {
    this.rolloverIfNeeded();
    this.persisted.history[this.persisted.day] = {
      chars: this.persisted.todayChars,
      peakCpm: this.persisted.todayPeakCpm,
      activeMs: this.persisted.todayActiveMs,
    };
    savePersisted(this.persisted);
  }

  public snapshot(now = performance.now()): TypingSnapshot {
    this.rolloverIfNeeded();
    const cpm = this.instantCpm(now);
    if (cpm > this.persisted.todayPeakCpm) {
      this.persisted.todayPeakCpm = cpm;
    }
    const cps = Math.round((cpm / 60) * 10) / 10;
    return {
      cpm,
      cps,
      todayChars: this.persisted.todayChars,
      todayPeakCpm: this.persisted.todayPeakCpm,
      todayActiveMs: this.persisted.todayActiveMs,
      day: this.persisted.day,
    };
  }

  public formatHud(now = performance.now()): string {
    const s = this.snapshot(now);
    return `${s.cpm}字/分`;
  }

  public formatMenuTodayChars(): string {
    const n = this.snapshot().todayChars;
    const label =
      n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('zh-CN');
    return `${label} 字`;
  }

  public formatMenuPeak(): string {
    return `${this.snapshot().todayPeakCpm} 字/分`;
  }

  /**
   * Re-read disk + roll calendar day. Call on menu open / midnight / HUD tick
   * so multi-webview memory cannot keep showing yesterday's "today" counters.
   */
  public ensureToday(): void {
    const disk = loadPersisted();
    // Prefer fresher disk snapshot when another window already rolled or typed.
    if (disk.day > this.persisted.day) {
      this.persisted = disk;
    } else if (disk.day === this.persisted.day) {
      this.persisted.todayChars = Math.max(this.persisted.todayChars, disk.todayChars);
      this.persisted.todayPeakCpm = Math.max(this.persisted.todayPeakCpm, disk.todayPeakCpm);
      this.persisted.todayActiveMs = Math.max(this.persisted.todayActiveMs, disk.todayActiveMs);
      this.persisted.history = { ...disk.history, ...this.persisted.history };
    } else {
      // In-memory is ahead of disk day (we rolled locally); keep memory, still rollover below.
    }
    this.rolloverIfNeeded();
  }

  private armMidnightTimer(): void {
    if (typeof window === 'undefined') return;
    if (this.midnightTimer !== null) {
      window.clearTimeout(this.midnightTimer);
      this.midnightTimer = null;
    }
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const delay = Math.max(250, next.getTime() - now.getTime());
    this.midnightTimer = window.setTimeout(() => {
      this.ensureToday();
      this.flush();
      this.armMidnightTimer();
    }, delay);
  }

  private instantCpm(now: number): number {
    while (this.keyTimes.length > 0 && now - this.keyTimes[0] > WINDOW_MS) {
      this.keyTimes.shift();
    }
    const n = this.keyTimes.length;
    const cps = n / (WINDOW_MS / 1000);
    return Math.round(cps * 60);
  }

  private rolloverIfNeeded(): void {
    const today = localDayKey();
    if (this.persisted.day !== today) {
      this.persisted.history[this.persisted.day] = {
        chars: this.persisted.todayChars,
        peakCpm: this.persisted.todayPeakCpm,
        activeMs: this.persisted.todayActiveMs,
      };
      const keys = Object.keys(this.persisted.history).sort();
      while (keys.length > 14) {
        const old = keys.shift();
        if (old) delete this.persisted.history[old];
      }
      this.persisted.day = today;
      this.persisted.todayChars = 0;
      this.persisted.todayPeakCpm = 0;
      this.persisted.todayActiveMs = 0;
      savePersisted(this.persisted);
    }
  }
}

export const typingStats = new TypingStats();
