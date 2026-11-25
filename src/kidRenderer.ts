import idleUrl from './assets/kid/idle.png';
import privacyUrl from './assets/kid/privacy.png';

export interface KidLayout {
  logicalW: number;
  kbCenterX: number;
  kbCenterY: number;
  kbWidth: number;
  kbHeight: number;
  privacyMode: boolean;
  typingEnergy: number;
  sleepAmount: number;
  petEnergy: number;
}

export interface KidAssetMap {
  mode: 'full' | 'rig';
  idle?: string;
  privacy?: string;
}

type SpriteKey = 'idle' | 'privacy';

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  return img;
}

/**
 * Full-sprite KeyboardKid companion: swaps idle ↔ privacy whole images,
 * with light procedural bob / sway / squash (no fake limb layers yet).
 */
export class KidRenderer {
  private sprites: Record<SpriteKey, HTMLImageElement>;
  private customUrls: Partial<Record<SpriteKey, string>> = {};
  private lastKeyAt = -10000;
  private bodyBob = 0;
  private bodySway = 0;
  private bodySwayVel = 0;
  private squash = 0;
  private breathPhase = 0;

  constructor() {
    this.sprites = {
      idle: loadImage(idleUrl),
      privacy: loadImage(privacyUrl),
    };
  }

  public applyAssetMap(map: KidAssetMap | null | undefined): void {
    if (!map) return;
    if (map.idle) this.reloadSprite('idle', map.idle);
    if (map.privacy) this.reloadSprite('privacy', map.privacy);
  }

  public reloadBuiltin(): void {
    this.reloadSprite('idle', idleUrl);
    this.reloadSprite('privacy', privacyUrl);
    this.customUrls = {};
  }

  private reloadSprite(key: SpriteKey, src: string): void {
    this.customUrls[key] = src;
    this.sprites[key] = loadImage(src);
  }

  public onKeyPulse(now: number = performance.now()): void {
    this.lastKeyAt = now;
    this.bodyBob = Math.min(1, this.bodyBob + 0.55);
    this.squash = Math.min(1, this.squash + 0.7);
    const side = Math.random() > 0.5 ? 1 : -1;
    this.bodySwayVel += side * (1.8 + Math.random() * 1.2);
  }

  public onMousePulse(now: number = performance.now()): void {
    this.lastKeyAt = now;
    this.bodyBob = Math.min(1, this.bodyBob + 0.35);
    this.squash = Math.min(1, this.squash + 0.4);
  }

  public onPrivacyTyping(): void {
    this.bodyBob = Math.min(0.55, this.bodyBob + 0.28);
  }

  public update(dt: number, now: number, layout: KidLayout): void {
    this.breathPhase += dt * (1.6 - layout.sleepAmount * 0.5);
    this.bodyBob *= Math.exp(-4.2 * dt);
    this.squash *= Math.exp(-6.5 * dt);

    const typing = now - this.lastKeyAt < 420 || layout.typingEnergy > 0.12;
    const swayTarget = typing
      ? Math.sin(now * 0.011) * (0.08 + layout.typingEnergy * 0.14)
      : Math.sin(now * 0.0025) * 0.02;
    const damp = layout.privacyMode ? 0.45 : 1;
    const acc = (swayTarget * damp - this.bodySway) * 90 - this.bodySwayVel * 11;
    this.bodySwayVel += acc * dt;
    this.bodySway = Math.max(-0.35, Math.min(0.35, this.bodySway + this.bodySwayVel * dt));
  }

  /** Draw character behind keyboard (torso/hips sit on keys). */
  public renderBody(ctx: CanvasRenderingContext2D, now: number, layout: KidLayout): void {
    const img = layout.privacyMode
      ? this.sprites.privacy || this.sprites.idle
      : this.sprites.idle;
    if (!img || !img.complete || img.naturalWidth < 2) return;

    const g = this.computeGeom(layout, img);
    const breath = Math.sin(this.breathPhase) * (1.2 + layout.sleepAmount * 1.5);
    const bobY =
      -this.bodyBob * 7 -
      breath * 0.7 -
      layout.sleepAmount * 10 -
      (layout.privacyMode ? 2 : 0);
    const squashY = 1 - this.squash * 0.045;
    const squashX = 1 + this.squash * 0.03;
    const tilt = this.bodySway + (layout.privacyMode ? 0 : layout.typingEnergy * 0.02);

    ctx.save();
    ctx.translate(g.centerX, g.pivotY + bobY);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);
    ctx.drawImage(img, -g.drawW * 0.5, -g.drawH + g.pivotOff, g.drawW, g.drawH);
    ctx.restore();
  }

  /** Optional foreground flourishes (kept for API symmetry with DaFeiYu). */
  public renderForeground(
    _ctx: CanvasRenderingContext2D,
    _dt: number,
    _now: number,
    _layout: KidLayout,
  ): void {
    // Full-sprite MVP: no separate limb layer yet.
  }

  private computeGeom(layout: KidLayout, img: HTMLImageElement) {
    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    // Sit the figure on the keyboard: bottom of sprite near kb top.
    const drawH = layout.privacyMode ? 210 : 248;
    const drawW = drawH * aspect;
    const centerX = layout.kbCenterX + (layout.privacyMode ? 8 : 0);
    const feetY = layout.kbCenterY - layout.kbHeight * 0.42;
    const pivotOff = drawH * 0.78;
    const pivotY = feetY;
    return { drawW, drawH, centerX, pivotY, pivotOff };
  }
}
