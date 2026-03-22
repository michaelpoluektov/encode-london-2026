import { createTheme } from "@vanilla-extract/css";
import { themeVars } from "./contract.css";

export const darkThemeValues = {
  color: {
    background: {
      app: "#0e0e0e",
      heroGlow: "rgba(199, 153, 255, 0.22)",
      panel: "#131313",
      panelRaised: "#1f2020",
      panelInset: "#0e0e0e",
      panelMuted: "#181818",
      canvas: "#0b0b0b",
      overlay: "rgba(20, 20, 20, 0.86)",
    },
    border: {
      subtle: "rgba(72, 72, 72, 0.14)",
      standard: "rgba(72, 72, 72, 0.24)",
      strong: "rgba(72, 72, 72, 0.36)",
      accent: "#c799ff",
    },
    text: {
      primary: "#f5efff",
      heading: "#f8f4ff",
      body: "#adabaa",
      label: "#c799ff",
      code: "#69c8eb",
      secondary: "#b7b4bb",
      muted: "#7d7983",
      accent: "#69c8eb",
      inverse: "#240043",
    },
    surface: {
      accent: "#c799ff",
      accentMuted: "rgba(199, 153, 255, 0.18)",
      interactive: "#1a1a1c",
      interactiveHover: "#262628",
      interactiveActive: "#2d2338",
      success: "#69c8eb",
      successMuted: "rgba(105, 200, 235, 0.14)",
      warning: "#ff8ba0",
      warningMuted: "rgba(255, 139, 160, 0.12)",
      danger: "#ff8ba0",
    },
    editor: {
      background: "#131313",
      lineHighlight: "#19191b",
      selection: "rgba(199, 153, 255, 0.2)",
      cursor: "#69c8eb",
      gutter: "#66636a",
      indentGuide: "#26222c",
      activeIndentGuide: "#4d3866",
    },
    preview: {
      background: "#11161f",
      scene: "#09101f",
      lightWarm: "#fdf2c8",
      lightCool: "#17304d",
      lightKey: "#ffffff",
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
    panelHeaderHeight: "32px",
    panelMinHeight: "420px",
    editorMinWidth: "420px",
    previewMinWidth: "360px",
    controlXs: "20px",
    controlSm: "30px",
    controlMd: "36px",
    editorPaddingTop: "20px",
  },
  font: {
    family: {
      sans: '"Inter", "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SFMono-Regular", monospace',
    },
    size: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "24px",
      xl: "36px",
      hero: "2.25rem",
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
      eyebrow: "0.05em",
    },
  },
  shadow: {
    panel: "0 18px 40px rgba(0, 0, 0, 0.32)",
    focus:
      "0 0 0 1px rgba(72, 72, 72, 0.2), 0 0 0 4px rgba(199, 153, 255, 0.14)",
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
