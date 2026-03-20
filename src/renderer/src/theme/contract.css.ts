import { createThemeContract } from "@vanilla-extract/css";

export const themeVars = createThemeContract({
  color: {
    background: {
      app: null,
      heroGlow: null,
      panel: null,
      panelMuted: null,
      canvas: null,
      overlay: null,
    },
    border: {
      subtle: null,
      standard: null,
      strong: null,
      accent: null,
    },
    text: {
      primary: null,
      secondary: null,
      muted: null,
      accent: null,
      inverse: null,
    },
    surface: {
      accent: null,
      accentMuted: null,
      success: null,
      successMuted: null,
      warning: null,
      warningMuted: null,
      danger: null,
    },
    editor: {
      background: null,
      lineHighlight: null,
      selection: null,
      cursor: null,
      gutter: null,
    },
    preview: {
      background: null,
    },
    focus: {
      ring: null,
    },
  },
  space: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
  },
  size: {
    toolbarHeight: null,
    statusHeight: null,
    panelMinHeight: null,
    editorMinWidth: null,
    previewMinWidth: null,
  },
  radius: {
    sm: null,
    md: null,
    lg: null,
    xl: null,
    pill: null,
  },
  font: {
    family: {
      sans: null,
      mono: null,
    },
    size: {
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
      hero: null,
    },
    weight: {
      regular: null,
      medium: null,
      strong: null,
    },
    lineHeight: {
      tight: null,
      normal: null,
      relaxed: null,
    },
    tracking: {
      eyebrow: null,
    },
  },
  shadow: {
    panel: null,
    focus: null,
  },
  motion: {
    duration: {
      fast: null,
      normal: null,
    },
    easing: {
      standard: null,
    },
  },
});
