import { useEffect, useRef, useState } from 'react';
import styles from './VibeCard.module.css';

export const VibeCard = ({ result, username }) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculateDimensions = () => {
      const maxWidth = 600;
      const windowWidth = window.innerWidth;
      const width = Math.min(maxWidth, windowWidth - 40);
      const height = (width / 3) * 4;
      return { width, height };
    };

    setDimensions(calculateDimensions());

    const handleResize = () => {
      setDimensions(calculateDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!result || !canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const scale = width / 600;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${40 * scale}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${username}'s vibe check`, width / 2, 60 * scale);

    const { overallVibe, emotionalIntensity, thoughtComplexity, socialEnergy, creativityLevel, analysis } = result;

    const stats = [
      { name: 'Vibe Score', value: overallVibe },
      { name: 'Emotion', value: emotionalIntensity },
      { name: 'Complexity', value: thoughtComplexity },
      { name: 'Social', value: socialEnergy },
      { name: 'Creativity', value: creativityLevel },
    ];

    stats.forEach((stat, index) => {
      const y = (140 + index * 80) * scale;
      const value = stat.value / 100;

      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${20 * scale}px 'Inter', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(stat.name, 50 * scale, y);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(50 * scale, y + 15 * scale, 500 * scale, 18 * scale, 9 * scale);
      ctx.fill();

      const barGradient = ctx.createLinearGradient(50 * scale, 0, 550 * scale, 0);
      barGradient.addColorStop(0, '#10b981');
      barGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(50 * scale, y + 15 * scale, 500 * value * scale, 18 * scale, 9 * scale);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = `bold ${16 * scale}px 'Inter', sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(stat.value)}%`, 540 * scale, y + 28 * scale);
    });
    
    let baseFontSize = 22 * scale; 
    const maxLines = 6;
    const words = analysis.split(' ');
    let line = '';
    let lines = [];
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 100 * scale && line !== '') {
        lines.push(line);
        line = word + ' ';
      } else {
        line = testLine;
      }
    });
    lines.push(line);

    if (lines.length > maxLines) {
      baseFontSize = baseFontSize * (maxLines / lines.length);
      lines = [];
      line = '';
      words.forEach(word => {
        const testLine = line + word + ' ';
        ctx.font = `${baseFontSize}px 'Inter', sans-serif`;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 100 * scale && line !== '') {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      lines.push(line);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${baseFontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'left';
    let y = 540 * scale;
    lines.forEach((lineText, index) => {
      if (index < maxLines) {
        ctx.fillText(lineText, 50 * scale, y + (index * 23 * scale)); // Reduced from 26 * scale
      }
    });
  }, [result, username, dimensions]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${username}_vibe_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="vibe-card flex flex-col items-center p-4">
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-lg"
        width={dimensions.width}
        height={dimensions.height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <button onClick={downloadPNG} className={styles.downloadButton}>
        Save Vibe Card
      </button>
    </div>
  );
};
