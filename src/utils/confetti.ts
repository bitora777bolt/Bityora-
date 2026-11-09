/**
 * Lightweight, zero-dependency HTML5 Canvas confetti generator.
 * Provides a drop-in replacement for canvas-confetti with physics, wobble, and auto cleanup.
 */

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
  scalar?: number;
  ticks?: number;
  gravity?: number;
  decay?: number;
  startVelocity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  wobble: number;
  wobbleSpeed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
  gravity: number;
  life: number;
  maxLife: number;
}

export function confetti(options: ConfettiOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const {
      particleCount = 60,
      spread = 70,
      origin = { x: 0.5, y: 0.6 },
      colors = ['#ffd700', '#f5d061', '#10b981', '#06b6d4', '#ec4899', '#f97316', '#a855f7'],
      scalar = 1,
      gravity = 0.8,
      decay = 0.94,
      startVelocity = 35,
    } = options;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      resolve();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const originX = (origin.x ?? 0.5) * width;
    const originY = (origin.y ?? 0.5) * height;

    const particles: Particle[] = [];
    const spreadRad = (spread * Math.PI) / 180;
    // Central angle straight up is -PI/2 (270 deg)
    const baseAngle = -Math.PI / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
      const speed = startVelocity * (0.6 + Math.random() * 0.8);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = (6 + Math.random() * 6) * scalar;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.08 + Math.random() * 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        decay: decay * (0.98 + Math.random() * 0.02),
        gravity: gravity * (0.8 + Math.random() * 0.4),
        life: 0,
        maxLife: 140 + Math.random() * 60,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        // Physics update
        p.vx *= 0.98;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        if (p.life > p.maxLife * 0.5) {
          p.opacity *= p.decay;
        }

        if (p.opacity > 0.02 && p.y < height + 40) {
          aliveCount++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          const xWobble = Math.cos(p.wobble) * p.size;
          ctx.scale(1, Math.sin(p.wobble));

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);

          // Draw rounded rectangle confetti particle
          const halfW = p.size / 2;
          const halfH = (p.size * 0.6) / 2;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(-halfW, -halfH, p.size, p.size * 0.6, 2) : ctx.rect(-halfW, -halfH, p.size, p.size * 0.6);
          ctx.fill();

          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        resolve();
      }
    };

    animationFrameId = requestAnimationFrame(render);
  });
}

export const triggerConfetti = confetti;
export default confetti;
