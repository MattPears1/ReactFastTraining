import { Chart } from 'chart.js';

// Gradient plugin for beautiful color transitions
export const gradientPlugin = {
  id: 'customCanvasBackgroundGradient',
  beforeDraw: (chart: Chart, args: any, options: any) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    
    const gradientBackground = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradientBackground.addColorStop(0, 'rgba(14, 165, 233, 0.05)');
    gradientBackground.addColorStop(0.5, 'rgba(14, 165, 233, 0.02)');
    gradientBackground.addColorStop(1, 'rgba(14, 165, 233, 0)');
    
    ctx.save();
    ctx.fillStyle = gradientBackground;
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.restore();
  }
};

// Create gradient for datasets
export const createGradient = (ctx: CanvasRenderingContext2D, height: number, color: string, opacity: [number, number] = [0.8, 0.1]) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  const rgb = hexToRgb(color);
  if (rgb) {
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity[0]})`);
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity[1]})`);
  }
  return gradient;
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Animation configuration for smooth transitions
export const animationConfig = {
  duration: 1500,
  easing: 'easeInOutQuart' as const,
  delay: (context: any) => {
    let delay = 0;
    if (context.type === 'data' && context.mode === 'default') {
      delay = context.dataIndex * 100;
    }
    return delay;
  },
};

// Custom hover effects
export const hoverConfig = {
  hoverBackgroundColor: (context: any) => {
    const originalColor = context.dataset.backgroundColor;
    if (typeof originalColor === 'string') {
      const rgb = hexToRgb(originalColor.replace('rgba(', '').replace(')', '').split(',')[0]);
      return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` : originalColor;
    }
    return originalColor;
  },
  hoverBorderWidth: 3,
};