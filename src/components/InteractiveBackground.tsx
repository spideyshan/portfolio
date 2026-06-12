'use client';

import { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const themeColorsRef = useRef({ accent: '#10b981', muted: '#94a3b8' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const maxParticles = typeof window !== 'undefined' && window.innerWidth < 768 ? 35 : 75;
    const connectionDistance = 110;
    const mouseConnectionDistance = 150;

    // Helper to parse active colors from CSS theme variables
    const updateThemeColors = () => {
      if (typeof window === 'undefined') return;
      const styles = getComputedStyle(document.documentElement);
      
      // Get raw values or use fallback defaults
      const accent = styles.getPropertyValue('--color-accent').trim() || '#10b981';
      const muted = styles.getPropertyValue('--color-muted').trim() || '#94a3b8';
      
      themeColorsRef.current = { accent, muted };
    };

    updateThemeColors();

    // Use MutationObserver to detect theme toggle (data-theme attribute changes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || 800);
        this.y = Math.random() * (canvas?.height || 600);
        
        // Random velocity vector
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        
        // Size: 1px to 3px
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.4 + 0.2; // 0.2 to 0.6 opacity
      }

      update() {
        if (!canvas) return;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off left/right edges
        if (this.x < 0 || this.x > canvas.width) {
          this.vx = -this.vx;
          this.x = Math.max(0, Math.min(this.x, canvas.width));
        }

        // Bounce off top/bottom edges
        if (this.y < 0 || this.y > canvas.height) {
          this.vy = -this.vy;
          this.y = Math.max(0, Math.min(this.y, canvas.height));
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = hexToRgba(themeColorsRef.current.accent, this.alpha);
        context.fill();
      }
    }

    // Convert hex values to rgba to apply opacity levels in canvas
    function hexToRgba(hex: string, alpha: number) {
      // Handle simple named colors or formats if hex is missing
      if (!hex.startsWith('#')) return hex;
      
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      
      // Set display size
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      // Set actual resolution scaled for High DPI screens
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      
      // Scale context to draw at high DPI coordinate space
      ctx.scale(dpr, dpr);
      init();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      if (!canvas) return;
      
      // Clear viewport canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and connect particles
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      // Draw particle-to-particle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = hexToRgba(themeColorsRef.current.accent, alpha);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw mouse-to-particle connections
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx !== null && my !== null) {
        particles.forEach((p) => {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseConnectionDistance) {
            const alpha = (1 - dist / mouseConnectionDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mx, my);
            
            // Render trailing constellation connection line
            ctx.strokeStyle = hexToRgba(themeColorsRef.current.accent, alpha);
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -2,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
