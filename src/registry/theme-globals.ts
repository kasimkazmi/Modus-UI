/** Space between things, in points. Pick from the scale instead of typing a number. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Corner radii, from slightly rounded to a full pill. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Type sizes with matching line heights. */
export const fontSize = {
  caption: { fontSize: 12, lineHeight: 16 },
  body: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 20, lineHeight: 28 },
  heading: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 40, lineHeight: 46 },
} as const;

/** Font weights as the string values React Native expects. */
export const fontWeight = { regular: "400", medium: "500", semibold: "600", bold: "700" } as const;

/** Elevation levels as box shadows. */
export const shadow = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.12)",
  md: "0 4px 12px rgba(0, 0, 0, 0.16)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.22)",
} as const;
