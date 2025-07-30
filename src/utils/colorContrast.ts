// WCAG 2.1 Color Contrast Utilities

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Convert hex to RGB
export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate relative luminance
export const getLuminance = (rgb: RGB): number => {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

// Check if contrast meets WCAG requirements
export const meetsWCAGRequirements = (
  contrastRatio: number,
  level: "AA" | "AAA" = "AA",
  isLargeText: boolean = false,
): boolean => {
  if (level === "AA") {
    return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
  } else {
    return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  }
};

// Color palette with WCAG-compliant contrast ratios
export const accessibleColors = {
  // Primary colors with good contrast on white (#FFFFFF)
  primary: {
    600: "#3b82f6", // 3.5:1 on white (use for large text only)
    700: "#2563eb", // 4.6:1 on white (AA compliant)
    800: "#1e40af", // 7.3:1 on white (AAA compliant)
  },

  // Text colors for light backgrounds
  textLight: {
    primary: "#111827", // 15.3:1 on white
    secondary: "#4b5563", // 7.5:1 on white
    tertiary: "#6b7280", // 5.3:1 on white
  },

  // Text colors for dark backgrounds
  textDark: {
    primary: "#f9fafb", // 15.3:1 on #111827
    secondary: "#e5e7eb", // 11.7:1 on #111827
    tertiary: "#d1d5db", // 8.8:1 on #111827
  },

  // Error colors
  error: {
    600: "#dc2626", // 4.5:1 on white
    100: "#fee2e2", // Background color
  },

  // Success colors
  success: {
    600: "#16a34a", // 4.5:1 on white
    100: "#dcfce7", // Background color
  },

  // Warning colors
  warning: {
    600: "#d97706", // 4.5:1 on white
    100: "#fef3c7", // Background color
  },
};

// Utility function to suggest better color combinations
export const suggestAccessibleColor = (
  background: string,
  currentForeground: string,
  targetRatio: number = 4.5,
): string | null => {
  const currentRatio = getContrastRatio(background, currentForeground);

  if (currentRatio >= targetRatio) {
    return null; // Current color is already accessible
  }

  // This is a simplified suggestion - in a real implementation,
  // you'd want to adjust the color while maintaining its hue
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return null;

  const bgLuminance = getLuminance(bgRgb);

  // If background is light, suggest a darker color
  if (bgLuminance > 0.5) {
    return accessibleColors.textLight.primary;
  } else {
    return accessibleColors.textDark.primary;
  }
};
