import idleUrl from './assets/xixi/idle.png';
import blinkUrl from './assets/xixi/blink.png';
import privacyUrl from './assets/xixi/privacy.png';
import typingUrl from './assets/xixi/typing.png';
import typingFastUrl from './assets/xixi/typing_fast.png';
import handLeftUrl from './assets/xixi/hand_left.png';
import handRightUrl from './assets/xixi/hand_right.png';

/** Layout contract for keyboard/mouse positioning shared with CatEngine. */
export interface XiXiLayout {
  logicalW: number;
  kbCenterX: number;
  kbCenterY: number;
  kbWidth: number;
  kbHeight: number;
  kbTiltRad: number;
  mouseBtnX: number;
  mouseBtnY: number;
  mouseNX: number;
  mouseLeft: boolean;
  mouseRight: boolean;
  mouseActiveAt: number;
  mouseClickAt: number;
  petEnergy: number;
  privacyMode: boolean;
  privacyTypingAt: number;
  is108: boolean;
}

type ExprKey = 'idle' | 'blink' | 'privacy' | 'typing' | 'typingFast';

interface HandState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  lastAt: number;
  squash: number;
  heldVks: Set<number>;
}

/** Soft blink: ease-in → hold → ease-out (no base fade — avoids black flash). */
const BLINK_EASE_IN_MS = 110;
const BLINK_HOLD_MS = 90;
const BLINK_EASE_OUT_MS = 170;
const BLINK_TOTAL_MS = BLINK_EASE_IN_MS + BLINK_HOLD_MS + BLINK_EASE_OUT_MS;

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * 西西 — armless expression sprites + gray sleeves + photo hands over keyboard/mouse.
 * Sprite body with procedural hands; no whale tail.
 */
export class XiXiRenderer {
  private sprites: Record<ExprKey, HTMLImageElement>;
  private handSprites: { left: HTMLImageElement; right: HTMLImageElement };

  private lastKeyAt = -10000;
  private keyTimes: number[] = [];
  private typingHeat = 0;
  private moodTier: 0 | 1 | 2 = 0;
  private moodChangedAt = -10000;
  private nextBlinkAt = performance.now() + 3600 + Math.random() * 2600;
  /** Start time of current blink cycle; -1 when idle. */
  private blinkStartedAt = -1;
  private blinkWeight = 0;

  private bodyShiftX = 0;
  private bodyShiftVel = 0;
  private bodyShiftTarget = 0;
  private bodyTilt = 0;
  private bodyTiltVel = 0;
  private bodyTiltTarget = 0;
  private bodyDiveY = 0;
  private bodyBob = 0;

  private leftHand: HandState = {
    x: 155,
    y: 312,
    tx: 155,
    ty: 312,
    lastAt: -10000,
    squash: 0,
    heldVks: new Set(),
  };
  private rightHand: HandState = {
    x: 235,
    y: 312,
    tx: 235,
    ty: 312,
    lastAt: -10000,
    squash: 0,
    heldVks: new Set(),
  };

  constructor() {
    const mk = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    this.sprites = {
      idle: mk(idleUrl),
      blink: mk(blinkUrl),
      privacy: mk(privacyUrl),
      typing: mk(typingUrl),
      typingFast: mk(typingFastUrl),
    };
    this.handSprites = {
      left: mk(handLeftUrl),
      right: mk(handRightUrl),
    };
  }

  public onPrivacyModeChanged(active: boolean): void {
    if (active) {
      this.leftHand.heldVks.clear();
      this.rightHand.heldVks.clear();
    }
  }

  public onPrivacyTyping(): void {
    this.bodyBob = Math.min(0.65, this.bodyBob + 0.42);
  }

  public resetLeftHandForMouse(): void {
    this.leftHand.lastAt = -10000;
  }

  public onMouseAction(now: number = performance.now()): void {
    this.bodyBob = Math.min(1, this.bodyBob + 0.35);
    this.lastKeyAt = Math.max(this.lastKeyAt, now - 200);
  }

  public onKeyDown(vk: number, pt: { x: number; y: number }, layout: XiXiLayout, repeat: boolean): void {
    if (layout.privacyMode || repeat) return;
    const now = performance.now();
    this.lastKeyAt = now;
    this.keyTimes.push(now);
    this.bodyBob = Math.min(1.0, this.bodyBob + 0.55);

    const charX = layout.is108 ? 268 : 192;
    const normX = Math.max(-1, Math.min(1, (pt.x - layout.kbCenterX) / (layout.kbWidth * 0.46)));
    const mouseBusy = layout.mouseLeft || layout.mouseRight || now - layout.mouseActiveAt < 900;
    const isLeftSide = pt.x < layout.kbCenterX - 2;

    // Plant fingertips on the key deck.
    const keyY = layout.kbCenterY + 6;

    if (mouseBusy) {
      // Left stays on mouse; right taps keyboard.
      const shiftBase = layout.is108 ? -88 : -38;
      const curCharX = charX + shiftBase;
      const comfortX = Math.max(curCharX - 10, Math.min(curCharX + 92, pt.x));
      this.rightHand.tx = comfortX;
      this.rightHand.ty = keyY;
      this.rightHand.lastAt = now;
      this.rightHand.squash = 1;
      this.rightHand.heldVks.add(vk);
    } else {
      this.bodyTiltTarget = normX * 0.095;
      this.bodyShiftTarget = normX * (layout.is108 ? 22 : 13);
      const comfortX =
        charX + this.bodyShiftTarget + Math.max(-76, Math.min(76, (pt.x - charX) * 0.78));
      if (isLeftSide) {
        this.leftHand.tx = comfortX;
        this.leftHand.ty = keyY;
        this.leftHand.lastAt = now;
        this.leftHand.squash = 1;
        this.leftHand.heldVks.add(vk);
      } else {
        this.rightHand.tx = comfortX;
        this.rightHand.ty = keyY;
        this.rightHand.lastAt = now;
        this.rightHand.squash = 1;
        this.rightHand.heldVks.add(vk);
      }
    }
  }

  public onKeyUp(vk: number): void {
    this.leftHand.heldVks.delete(vk);
    this.rightHand.heldVks.delete(vk);
  }

  public update(dt: number, now: number, layout: XiXiLayout): void {
    this.bodyBob *= Math.exp(-12 * dt);

    const isHappy = !layout.privacyMode && layout.petEnergy > 0.25;
    const isTyping =
      !layout.privacyMode &&
      (now - this.lastKeyAt < 550 || this.leftHand.heldVks.size > 0 || this.rightHand.heldVks.size > 0);
    const mouseMode =
      !layout.privacyMode &&
      !isHappy &&
      (layout.mouseLeft || layout.mouseRight || now - layout.mouseActiveAt < 900);

    while (this.keyTimes.length && now - this.keyTimes[0] > 2800) {
      this.keyTimes.shift();
    }
    const typingCPS = this.keyTimes.length / 2.8;
    const heatTarget = layout.privacyMode
      ? 0
      : Math.min(1, Math.max(0, (typingCPS - 2.4) / 5.4));
    if (heatTarget > this.typingHeat) {
      this.typingHeat += (heatTarget - this.typingHeat) * (1 - Math.exp(-2.2 * dt));
    } else {
      this.typingHeat += (heatTarget - this.typingHeat) * (1 - Math.exp(-0.65 * dt));
    }

    const dwell = now - this.moodChangedAt;
    if (this.moodTier === 0) {
      if (this.typingHeat >= 0.4 && dwell >= 1400) {
        this.moodTier = 1;
        this.moodChangedAt = now;
      }
    } else if (this.moodTier === 1) {
      if (this.typingHeat >= 0.78 && dwell >= 1800) {
        this.moodTier = 2;
        this.moodChangedAt = now;
      } else if (this.typingHeat < 0.22 && dwell >= 2200) {
        this.moodTier = 0;
        this.moodChangedAt = now;
      }
    } else if (this.moodTier === 2) {
      if (this.typingHeat < 0.55 && dwell >= 2200) {
        this.moodTier = 1;
        this.moodChangedAt = now;
      }
    }

    // Soft blink cycle (only when base expr would be idle)
    const canBlink =
      !layout.privacyMode && !isHappy && this.moodTier === 0 && this.blinkStartedAt < 0;
    if (canBlink && now >= this.nextBlinkAt) {
      this.blinkStartedAt = now;
      this.nextBlinkAt = now + BLINK_TOTAL_MS + 4500 + Math.random() * 2700;
    }
    if (this.blinkStartedAt > 0) {
      const elapsed = now - this.blinkStartedAt;
      if (elapsed >= BLINK_TOTAL_MS) {
        this.blinkStartedAt = -1;
        this.blinkWeight = 0;
      } else if (elapsed < BLINK_EASE_IN_MS) {
        this.blinkWeight = smoothstep(elapsed / BLINK_EASE_IN_MS);
      } else if (elapsed < BLINK_EASE_IN_MS + BLINK_HOLD_MS) {
        this.blinkWeight = 1;
      } else {
        const outT = (elapsed - BLINK_EASE_IN_MS - BLINK_HOLD_MS) / BLINK_EASE_OUT_MS;
        this.blinkWeight = 1 - smoothstep(outT);
      }
    } else {
      this.blinkWeight = 0;
    }
    if (layout.privacyMode || isHappy || this.moodTier !== 0) {
      this.blinkStartedAt = -1;
      this.blinkWeight = 0;
    }

    if (layout.privacyMode) {
      this.bodyShiftTarget = 0;
      const shySway =
        Math.sin(now * 0.0042) * 0.032 +
        (now - layout.privacyTypingAt < 240 ? Math.sin(now * 0.04) * 0.024 : 0);
      this.bodyTiltTarget = shySway;
      this.bodyDiveY *= Math.exp(-9 * dt);
    } else if (mouseMode) {
      const baseShift = layout.is108 ? -125 : -38;
      this.bodyShiftTarget = baseShift + (layout.mouseNX - 0.5) * 12;
      this.bodyTiltTarget = -0.1;
      this.bodyDiveY += (8 - this.bodyDiveY) * (1 - Math.exp(-10 * dt));
    } else if (!isTyping) {
      this.bodyShiftTarget *= Math.exp(-2.4 * dt);
      this.bodyTiltTarget = Math.sin(now * 0.0018) * 0.018;
      this.bodyDiveY *= Math.exp(-8 * dt);
    } else {
      this.bodyShiftTarget *= Math.exp(-0.8 * dt);
      this.bodyDiveY *= Math.exp(-6 * dt);
    }

    const shiftLerp = 1 - Math.exp(-(mouseMode ? 14 : 9) * dt);
    this.bodyShiftVel += (this.bodyShiftTarget - this.bodyShiftX) * 42 * dt - this.bodyShiftVel * 10 * dt;
    this.bodyShiftX += this.bodyShiftVel * dt;
    this.bodyShiftX += (this.bodyShiftTarget - this.bodyShiftX) * shiftLerp * 0.35;

    const tiltAcc = (this.bodyTiltTarget - this.bodyTilt) * 90 - this.bodyTiltVel * 12;
    this.bodyTiltVel += tiltAcc * dt;
    this.bodyTilt = Math.max(-0.35, Math.min(0.35, this.bodyTilt + this.bodyTiltVel * dt));
  }

  public renderBody(ctx: CanvasRenderingContext2D, now: number, layout: XiXiLayout): void {
    const g = this.computeGeom(now, layout);
    const isHappy = !layout.privacyMode && layout.petEnergy > 0.25;

    let exprKey: ExprKey = 'idle';
    if (layout.privacyMode) exprKey = 'privacy';
    else if (isHappy || this.moodTier === 2) exprKey = 'typingFast';
    else if (this.moodTier === 1) exprKey = 'typing';

    const img = this.sprites[exprKey] || this.sprites.idle;
    if (!img || !img.complete || img.naturalWidth < 2) return;

    const drawSprite = (sprite: HTMLImageElement, alpha: number) => {
      if (alpha <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(g.charCenterX, g.pivotY);
      ctx.rotate(this.bodyTilt);
      ctx.scale(1 + this.bodyBob * 0.022, 1 - this.bodyBob * 0.018);
      ctx.drawImage(sprite, -g.drawW * 0.5, -g.drawH + g.pivotOff, g.drawW, g.drawH);
      ctx.restore();
    };

    ctx.save();
    // Clip body above the deck so baked lower limbs don't fight keyboard;
    // procedural hands in renderForeground sit on top of mouse/keys.
    ctx.beginPath();
    ctx.rect(0, 0, layout.logicalW, layout.kbCenterY - layout.kbHeight * 0.36);
    ctx.clip();

    // Keep base fully opaque — fading it caused the black flash.
    drawSprite(img, 1);
    const w = this.blinkWeight;
    if (w > 0.001 && exprKey === 'idle') {
      const blinkImg = this.sprites.blink;
      if (blinkImg && blinkImg.complete && blinkImg.naturalWidth > 1) {
        // Soft overlay only (blink ≈ idle pose; eyes close via alpha).
        drawSprite(blinkImg, w);
      }
    }

    ctx.restore();
  }

  /** Drawn AFTER keyboard & mouse so hands cover the deck. */
  public renderForeground(
    ctx: CanvasRenderingContext2D,
    dt: number,
    now: number,
    layout: XiXiLayout,
  ): void {
    const g = this.computeGeom(now, layout);
    // Shoulder stumps after arm strip (sprite 224×278): jacket edges ~x=44/178 at y≈158.
    const shL = g.spritePointToWorld(0.26, 0.575);
    const shR = g.spritePointToWorld(0.74, 0.575);

    const isHappy = !layout.privacyMode && layout.petEnergy > 0.25;
    const mouseMode =
      !layout.privacyMode &&
      !isHappy &&
      (layout.mouseLeft || layout.mouseRight || now - layout.mouseActiveAt < 900);

    const leftTyping =
      !layout.privacyMode &&
      !mouseMode &&
      (now - this.leftHand.lastAt < 380 || this.leftHand.heldVks.size > 0);
    const rightTyping =
      !layout.privacyMode &&
      (now - this.rightHand.lastAt < 380 || this.rightHand.heldVks.size > 0);

    let lTargetX: number;
    let lTargetY: number;
    let rTargetX: number;
    let rTargetY: number;
    let leftReach = 58;
    let rightReach = 58;

    if (layout.privacyMode) {
      const eyeL = g.spritePointToWorld(0.39, 0.476);
      const eyeR = g.spritePointToWorld(0.598, 0.476);
      const shyBob = Math.sin(now * 0.008) * 1.4;
      lTargetX = eyeL.x;
      lTargetY = eyeL.y + shyBob;
      rTargetX = eyeR.x;
      rTargetY = eyeR.y - shyBob;
      leftReach = 72;
      rightReach = 72;
    } else if (isHappy) {
      // Slightly outstretched cheer — sleeve clears the shoulder stump.
      const cheer = Math.sin(now * 0.016) * 5.0;
      lTargetX = shL.x - 22;
      lTargetY = shL.y + 28 + cheer;
      rTargetX = shR.x + 22;
      rTargetY = shR.y + 28 - cheer;
      leftReach = 76;
      rightReach = 76;
    } else {
      if (mouseMode) {
        // Aim palm center on the mouse shell — pull tip back so photo fingers don't overshoot.
        const pressOff = layout.mouseLeft || layout.mouseRight ? 2.4 : 0.6;
        const mx = layout.mouseBtnX;
        const my = layout.mouseBtnY + pressOff;
        const mdx = mx - shL.x;
        const mdy = my - shL.y;
        const mLen = Math.max(1, Math.hypot(mdx, mdy));
        const pullBack = 12;
        lTargetX = mx - (mdx / mLen) * pullBack;
        lTargetY = my - (mdy / mLen) * pullBack;
        leftReach = layout.is108 ? 108 : 100;
      } else if (leftTyping) {
        lTargetX = this.leftHand.tx;
        lTargetY = this.leftHand.ty;
        leftReach = 92;
      } else {
        // Idle: short arms tucked near the body (not on the keyboard).
        lTargetX = shL.x - 10;
        lTargetY = shL.y + 34;
        leftReach = 58;
      }
      if (rightTyping) {
        rTargetX = this.rightHand.tx;
        rTargetY = this.rightHand.ty;
        rightReach = 92;
      } else if (mouseMode) {
        // Right stays near keys / body while left handles mouse.
        rTargetX = shR.x + 12;
        rTargetY = layout.kbCenterY + 6;
        rightReach = 92;
      } else {
        rTargetX = shR.x + 10;
        rTargetY = shR.y + 34;
        rightReach = 58;
      }
    }

    const hLerp = 1 - Math.exp(-26 * dt);
    this.leftHand.x += (lTargetX - this.leftHand.x) * hLerp;
    this.leftHand.y += (lTargetY - this.leftHand.y) * hLerp;
    this.rightHand.x += (rTargetX - this.rightHand.x) * hLerp;
    this.rightHand.y += (rTargetY - this.rightHand.y) * hLerp;
    this.leftHand.squash *= Math.exp(-14 * dt);
    this.rightHand.squash *= Math.exp(-14 * dt);

    this.drawSleeveArm(
      ctx,
      shL.x,
      shL.y,
      this.leftHand.x,
      this.leftHand.y,
      'left',
      this.leftHand.squash,
      leftReach,
    );
    this.drawSleeveArm(
      ctx,
      shR.x,
      shR.y,
      this.rightHand.x,
      this.rightHand.y,
      'right',
      this.rightHand.squash,
      rightReach,
    );
  }

  private drawSleeveArm(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    targetX: number,
    targetY: number,
    side: 'left' | 'right',
    squash: number,
    maxLen: number,
  ): void {
    const dx = targetX - sx;
    const dy = targetY - sy;
    const rawLen = Math.max(1, Math.hypot(dx, dy));
    const len = Math.min(rawLen, maxLen);
    const ux = dx / rawLen;
    const uy = dy / rawLen;
    const px = sx + ux * len;
    const py = sy + uy * len;
    const nx = -uy;
    const ny = ux;
    const ang = Math.atan2(dy, dx);
    const sgn = side === 'left' ? -1 : 1;

    // Leave a bit of sleeve before the photo hand so the cuff tucks under the wrist.
    const wristDist = Math.max(16, len - 12);
    const wx = sx + ux * wristDist;
    const wy = sy + uy * wristDist;
    const rSh = 16;
    const rMid = 14;
    const rCuff = 13;
    const midX = (sx + wx) * 0.5 + nx * (sgn * 2.8);
    const midY = (sy + wy) * 0.5 + ny * (sgn * 2.8);

    const sleeve = '#e7e9eb';
    const sleeveDeep = '#d5d8dc';
    const crease = '#b8bdc3';
    const creaseSoft = '#c5c9ce';
    const edge = '#b0b5bb';

    ctx.save();
    ctx.globalAlpha = 1;

    // Soft shoulder cap — seals armless stump.
    ctx.beginPath();
    ctx.ellipse(sx - ux * 2, sy - uy * 2, rSh + 1.8, rSh * 0.94, ang, 0, Math.PI * 2);
    ctx.fillStyle = sleeve;
    ctx.fill();

    const grad = ctx.createLinearGradient(sx, sy, wx, wy);
    grad.addColorStop(0, sleeve);
    grad.addColorStop(0.55, sleeveDeep);
    grad.addColorStop(1, sleeve);

    ctx.beginPath();
    ctx.moveTo(sx + nx * rSh, sy + ny * rSh);
    ctx.quadraticCurveTo(midX + nx * rMid, midY + ny * rMid, wx + nx * rCuff, wy + ny * rCuff);
    ctx.lineTo(wx - nx * rCuff, wy - ny * rCuff);
    ctx.quadraticCurveTo(midX - nx * rMid, midY - ny * rMid, sx - nx * rSh, sy - ny * rSh);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, rSh, 0, Math.PI * 2);
    ctx.fillStyle = sleeve;
    ctx.fill();

    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + nx * rSh, sy + ny * rSh);
    ctx.quadraticCurveTo(midX + nx * rMid, midY + ny * rMid, wx + nx * rCuff, wy + ny * rCuff);
    ctx.moveTo(sx - nx * rSh, sy - ny * rSh);
    ctx.quadraticCurveTo(midX - nx * rMid, midY - ny * rMid, wx - nx * rCuff, wy - ny * rCuff);
    ctx.stroke();

    // Soft irregular fabric creases (not parallel stripes).
    ctx.lineCap = 'round';
    const creaseSpecs: Array<{ t: number; bias: number; skew: number; len: number; w: number }> = [
      { t: 0.22, bias: sgn * 3.4, skew: -sgn * 1.8, len: 0.48, w: 1.15 },
      { t: 0.41, bias: sgn * 0.6, skew: sgn * 2.4, len: 0.62, w: 1.25 },
      { t: 0.63, bias: -sgn * 2.1, skew: -sgn * 0.9, len: 0.42, w: 1.1 },
      { t: 0.78, bias: sgn * 1.4, skew: sgn * 1.5, len: 0.36, w: 1.2 },
    ];
    for (const c of creaseSpecs) {
      const cx = sx + (wx - sx) * c.t + nx * c.bias;
      const cy = sy + (wy - sy) * c.t + ny * c.bias;
      const half = (rSh + (rCuff - rSh) * c.t) * c.len;
      ctx.strokeStyle = c.t < 0.5 ? creaseSoft : crease;
      ctx.lineWidth = c.w;
      ctx.beginPath();
      ctx.moveTo(cx - nx * half + ux * c.skew, cy - ny * half + uy * c.skew);
      ctx.quadraticCurveTo(
        cx + ux * (2.2 + c.skew * 0.4) + nx * (sgn * 0.8),
        cy + uy * (2.2 + c.skew * 0.4) + ny * (sgn * 0.8),
        cx + nx * half * 0.75 - ux * c.skew * 0.5,
        cy + ny * half * 0.75 - uy * c.skew * 0.5,
      );
      ctx.stroke();
    }

    // Soft cuff band + fine cross-fold
    const trimDist = Math.max(10, wristDist - 6);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(sx + ux * trimDist, sy + uy * trimDist);
    ctx.rotate(ang + Math.PI / 2);
    ctx.strokeStyle = crease;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-rCuff + 1.5, 0);
    ctx.lineTo(rCuff - 1.5, 0);
    ctx.stroke();
    ctx.strokeStyle = creaseSoft;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-rCuff + 3, 2.8);
    ctx.quadraticCurveTo(0, 4.2, rCuff - 3, 2.2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(wx, wy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = sleeveDeep;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -0.3, 11.2, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Photo hand at sleeve tip (wrist toward cuff, fingers along arm).
    const handImg = side === 'left' ? this.handSprites.left : this.handSprites.right;
    if (handImg && handImg.complete && handImg.naturalWidth > 1) {
      const dw = 32 * (1 + squash * 0.1);
      const dh = 33 * (1 - squash * 0.06);
      // Sprites have wrist near the top; rotate so +Y (fingers) follows arm direction.
      const handRot = ang - Math.PI / 2 + (side === 'left' ? -0.12 : 0.12);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(px, py);
      ctx.rotate(handRot);
      // Nudge along fingers so wrist overlaps cuff.
      ctx.drawImage(handImg, -dw * 0.5, -dh * 0.38, dw, dh);
      ctx.restore();
    }

    ctx.restore();
  }

  private computeGeom(now: number, layout: XiXiLayout) {
    const charX = layout.is108 ? 268 : 192;
    const baseCharY = layout.is108 ? 366 : 364;
    const breath = Math.sin(now * 0.0034) * 2.2 + this.bodyBob * 3.8 + this.bodyDiveY;
    const charCenterX = charX + this.bodyShiftX;
    const charBaseY = baseCharY + breath;
    const drawW = layout.is108 ? 268 : 262;
    const drawH = drawW * (278 / 224);
    const pivotOff = 48;
    const pivotY = charBaseY - pivotOff;

    const spritePointToWorld = (normX: number, normY: number) => {
      const lx = (normX - 0.5) * drawW;
      const ly = normY * drawH - drawH + pivotOff;
      const c = Math.cos(this.bodyTilt);
      const s = Math.sin(this.bodyTilt);
      return {
        x: charCenterX + lx * c - ly * s,
        y: pivotY + lx * s + ly * c,
      };
    };

    return {
      charCenterX,
      charBaseY,
      drawW,
      drawH,
      pivotOff,
      pivotY,
      spritePointToWorld,
    };
  }
}
