import { createTheme } from "@vanilla-extract/css";
import { themeVars } from "./contract.css";

export const darkThemeValues = {
  color: {
    background: {
      app: "#11161f",
      heroGlow: "rgba(54, 92, 140, 0.18)",
      panel: "#181d27",
      panelMuted: "#151a23",
      canvas: "#202734",
      overlay: "#141922",
    },
    border: {
      subtle: "rgba(159, 177, 206, 0.08)",
      standard: "rgba(159, 177, 206, 0.14)",
      strong: "rgba(159, 177, 206, 0.22)",
      accent: "#6ba6ff",
    },
    text: {
      primary: "#d7dee9",
      secondary: "#aeb8c7",
      muted: "#7f8a9b",
      accent: "#9bc1ff",
      inverse: "#11161f",
    },
    surface: {
      accent: "#6ba6ff",
      accentMuted: "rgba(107, 166, 255, 0.14)",
      success: "#71c79a",
      successMuted: "rgba(113, 199, 154, 0.12)",
      warning: "#d9b16c",
      warningMuted: "rgba(217, 177, 108, 0.12)",
      danger: "#de7d7d",
    },
    editor: {
      background: "#1e1e1e",
      lineHighlight: "#242a33",
      selection: "#264f78",
      cursor: "#c5c5c5",
      gutter: "#858585",
    },
    preview: {
      background: "#11161f",
    },
    focus: {
      ring: "rgba(107, 166, 255, 0.35)",
    },
  },
  space: {
    0: "0",
    1: "3px",
    2: "4px",
    3: "6px",
    4: "8px",
    5: "10px",
    6: "12px",
    7: "16px",
    8: "20px",
    9: "32px",
  },
  size: {
    footerBarHeight: "24px",
    headerBarHeight: "36px",
    panelMinHeight: "420px",
    editorMinWidth: "420px",
    previewMinWidth: "360px",
  },
  radius: {
    sm: "3px",
    md: "4px",
    lg: "6px",
    xl: "8px",
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
    panel: "0 1px 0 rgba(0, 0, 0, 0.22)",
    focus: "0 0 0 1px rgba(107, 166, 255, 0.24)",
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
