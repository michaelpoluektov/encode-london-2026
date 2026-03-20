import { createTheme } from "@vanilla-extract/css";
import { themeVars } from "./contract.css";

export const darkThemeValues = {
  color: {
    background: {
      app: "#060913",
      heroGlow: "rgba(78, 116, 180, 0.42)",
      panel: "rgba(9, 14, 27, 0.9)",
      panelMuted: "rgba(12, 18, 34, 0.74)",
      canvas: "#09101f",
      overlay: "rgba(5, 9, 18, 0.72)",
    },
    border: {
      subtle: "rgba(138, 164, 212, 0.14)",
      standard: "rgba(138, 164, 212, 0.18)",
      strong: "rgba(167, 191, 235, 0.3)",
      accent: "#d0a65e",
    },
    text: {
      primary: "#eff4ff",
      secondary: "#c3d1eb",
      muted: "#88a0ce",
      accent: "#f4c984",
      inverse: "#07101e",
    },
    surface: {
      accent: "#d0a65e",
      accentMuted: "rgba(208, 166, 94, 0.16)",
      success: "#6fc7a2",
      successMuted: "rgba(111, 199, 162, 0.12)",
      warning: "#f0bb69",
      warningMuted: "rgba(240, 187, 105, 0.12)",
      danger: "#f18d85",
    },
    editor: {
      background: "#07101c",
      lineHighlight: "#0f1a2d",
      selection: "#17304f",
      cursor: "#f3d6a2",
      gutter: "#6f86b5",
    },
    preview: {
      background: "#09101f",
    },
    focus: {
      ring: "rgba(208, 166, 94, 0.36)",
    },
  },
  space: {
    0: "0",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "32px",
    8: "40px",
    9: "48px",
  },
  size: {
    toolbarHeight: "56px",
    statusHeight: "76px",
    panelMinHeight: "420px",
    editorMinWidth: "420px",
    previewMinWidth: "360px",
  },
  radius: {
    sm: "10px",
    md: "16px",
    lg: "20px",
    xl: "28px",
    pill: "999px",
  },
  font: {
    family: {
      sans: '"IBM Plex Sans", "Segoe UI", sans-serif',
      mono: '"IBM Plex Mono", "SFMono-Regular", monospace',
    },
    size: {
      xs: "12px",
      sm: "13px",
      md: "15px",
      lg: "18px",
      xl: "24px",
      hero: "clamp(2.6rem, 4vw, 4.4rem)",
    },
    weight: {
      regular: "400",
      medium: "500",
      strong: "600",
    },
    lineHeight: {
      tight: "1.1",
      normal: "1.45",
      relaxed: "1.65",
    },
    tracking: {
      eyebrow: "0.18em",
    },
  },
  shadow: {
    panel: "0 24px 80px rgba(0, 0, 0, 0.35)",
    focus: "0 0 0 4px rgba(208, 166, 94, 0.14)",
  },
  motion: {
    duration: {
      fast: "120ms",
      normal: "220ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
    },
  },
} as const;

export const darkThemeClass = createTheme(themeVars, darkThemeValues);
