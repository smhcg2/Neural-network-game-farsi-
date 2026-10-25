import { useEffect, useRef } from 'react';

export function AiEntranceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      targetMouseX = clientX;
      targetMouseY = clientY;
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Tunnel Rings
    const NUM_RINGS = 14;
    const rings = Array.from({ length: NUM_RINGS }, (_, i) => ({
      z: (i / NUM_RINGS) * 1000,
      baseRadius: 180,
      nodes: 8,
      rotation: (i * Math.PI) / 6,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.003,
    }));

    // Data stream particles
    const NUM_PARTICLES = 120;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 1000,
      speed: 2.5 + Math.random() * 3.5,
      size: 1 + Math.random() * 2.5,
      hue: Math.random() > 0.6 ? 180 : Math.random() > 0.3 ? 270 : 150,
      alpha: 0.3 + Math.random() * 0.7,
    }));

    // Floating neural tokens (AI symbols)
    const SYMBOLS = ['AI', '0', '1', '∑', 'W', 'f(x)', 'λ', 'θ', 'ReLU', 'Softmax', 'Token'];
    const tokens = Array.from({ length: 24 }, (_, i) => ({
      text: SYMBOLS[i % SYMBOLS.length],
      x: (Math.random() - 0.5) * 700,
      y: (Math.random() - 0.5) * 700,
      z: Math.random() * 1000,
      speed: 1.5 + Math.random() * 2,
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const centerX = width / 2 + (mouseX - width / 2) * 0.12;
      const centerY = height / 2 + (mouseY - height / 2) * 0.12;

      // Dark futuristic gradient background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Deep radial glow at portal center
      const radial = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.max(width, height) * 0.7);
      radial.addColorStop(0, 'rgba(0, 243, 255, 0.22)');
      radial.addColorStop(0.3, 'rgba(139, 92, 246, 0.12)');
      radial.addColorStop(0.7, 'rgba(16, 185, 129, 0.05)');
      radial.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      const focalLength = 320;

      // 1. Draw Particles (Data Warp)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= p.speed * dt * 260;
        if (p.z <= 10) {
          p.z = 1000;
          p.x = (Math.random() - 0.5) * 700;
          p.y = (Math.random() - 0.5) * 700;
        }

        const scale = focalLength / p.z;
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, (1000 - p.z) / 700) * p.alpha;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.8, p.size * scale), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${depthAlpha})`;
          ctx.fill();
        }
      }

      // 2. Draw Floating AI Symbols / Tokens
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        t.z -= t.speed * dt * 200;
        if (t.z <= 20) {
          t.z = 1000;
          t.x = (Math.random() - 0.5) * 800;
          t.y = (Math.random() - 0.5) * 800;
        }

        const scale = focalLength / t.z;
        const tx = centerX + t.x * scale;
        const ty = centerY + t.y * scale;

        if (tx >= -50 && tx <= width + 50 && ty >= -50 && ty <= height + 50) {
          const depthAlpha = Math.min(0.65, (1000 - t.z) / 800);
          ctx.fillStyle = `rgba(0, 243, 255, ${depthAlpha})`;
          ctx.fillText(t.text, tx, ty);
        }
      }

      // 3. Draw Concentric 3D Neural Rings (The AI Entrance Portal)
      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        ring.z -= 180 * dt;
        ring.rotation += ring.rotSpeed;

        if (ring.z <= 20) {
          ring.z = 1000;
        }

        const scale = focalLength / ring.z;
        const radius = ring.baseRadius * scale;
        const alpha = Math.min(0.7, (1000 - ring.z) / 600);

        if (radius > 15 && radius < Math.max(width, height)) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(ring.rotation);

          // Draw polygon ring
          ctx.beginPath();
          const nodePoints: { x: number; y: number }[] = [];
          for (let n = 0; n < ring.nodes; n++) {
            const angle = (n / ring.nodes) * Math.PI * 2;
            const nx = Math.cos(angle) * radius;
            const ny = Math.sin(angle) * radius;
            nodePoints.push({ x: nx, y: ny });
            if (n === 0) ctx.moveTo(nx, ny);
            else ctx.lineTo(nx, ny);
          }
          ctx.closePath();

          ctx.strokeStyle = `rgba(0, 243, 255, ${alpha * 0.45})`;
          ctx.lineWidth = Math.max(1, 2.5 * scale);
          ctx.stroke();

          // Draw nodes on polygon vertices
          for (let n = 0; n < nodePoints.length; n++) {
            const np = nodePoints[n];
            ctx.beginPath();
            ctx.arc(np.x, np.y, Math.max(1.8, 4.5 * scale), 0, Math.PI * 2);
            ctx.fillStyle = n % 2 === 0 ? `rgba(16, 185, 129, ${alpha * 0.9})` : `rgba(0, 243, 255, ${alpha * 0.9})`;
            ctx.fill();

            // Synapse beams to center horizon for front rings
            if (ring.z < 450 && n % 2 === 0) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(np.x, np.y);
              ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.2})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          ctx.restore();
        }
      }

      // Outer vignette
      const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.4, width / 2, height / 2, Math.max(width, height) * 0.8);
      vignette.addColorStop(0, 'rgba(3, 7, 18, 0)');
      vignette.addColorStop(1, 'rgba(3, 7, 18, 0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
