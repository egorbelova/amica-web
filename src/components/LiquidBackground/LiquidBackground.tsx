import { useSettings } from '@/contexts/settings/context';
import React, { useRef, useEffect, useState } from 'react';

const LiquidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { gradient } = useSettings();

  const [color1, setColor1] = useState(gradient?.colors[0]?.color ?? '#0a84ff');
  const [color2, setColor2] = useState(gradient?.colors[1]?.color ?? '#5e5ce6');
  const [color3, setColor3] = useState(gradient?.colors[1]?.color ?? '#ff2d55');

  //   useEffect(() => {
  //     setColor1(gradient?.colors[0]?.color ?? '#0a84ff');
  //     setColor2(gradient?.colors[1]?.color ?? '#5e5ce6');
  //     setColor3(gradient?.colors[1]?.color ?? '#ff2d55');
  //   }, [gradient]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const drawBlob = (
      x: number,
      y: number,
      radius: number,
      color: string,
      speedX: number,
      speedY: number,
    ) => {
      if (!ctx) return;
      const offsetX = Math.sin(time * speedX) * 100;
      const offsetY = Math.cos(time * speedY) * 100;

      const gradient = ctx.createRadialGradient(
        x + offsetX,
        y + offsetY,
        0,
        x + offsetX,
        y + offsetY,
        radius,
      );

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      drawBlob(canvas.width * 0.3, canvas.height * 0.4, 300, color1, 0.8, 1.2);
      drawBlob(canvas.width * 0.7, canvas.height * 0.5, 350, color2, 1.1, 0.7);
      drawBlob(canvas.width * 0.5, canvas.height * 0.7, 400, color3, 0.6, 1.4);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [color1, color2, color3]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 10,
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          padding: '10px 15px',
          borderRadius: 20,
        }}
      >
        <input
          type='color'
          value={color1}
          onChange={(e) => setColor1(e.target.value)}
        />
        <input
          type='color'
          value={color2}
          onChange={(e) => setColor2(e.target.value)}
        />
        <input
          type='color'
          value={color3}
          onChange={(e) => setColor3(e.target.value)}
        />
      </div>
    </>
  );
};

export default LiquidBackground;
