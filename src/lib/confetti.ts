const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#fbbf24", "#34d399", "#f472b6", "#a78bfa", "#fb923c"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  opacity: number;
}

export function triggerConfetti(originX: number, originY: number) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const count = 70;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 5 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: 7 + Math.random() * 6,
      height: 3.5 + Math.random() * 3,
      opacity: 1,
    });
  }

  const gravity = 0.25;
  const friction = 0.99;
  let frame: number;
  let done = false;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allFaded = true;
    for (const p of particles) {
      p.vy += gravity;
      p.vx *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.018;

      if (p.opacity > 0) {
        allFaded = false;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
    }

    if (allFaded || done) {
      canvas.remove();
      return;
    }
    frame = requestAnimationFrame(draw);
  }

  frame = requestAnimationFrame(draw);

  // Safety cleanup after 3s
  setTimeout(() => {
    done = true;
    cancelAnimationFrame(frame);
    canvas.remove();
  }, 3000);
}
