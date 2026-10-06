sed -i '' -e '267,286d' src/registry/index.ts
cat << 'INNER_EOF' >> src/registry/index.ts
    dependencies: ["clsx", "tailwind-merge", "framer-motion"],
    files: ["registry/bento-grid.tsx"],
  },
  {
    name: "flip-words",
    type: "components:ui",
    dependencies: ["clsx", "tailwind-merge", "framer-motion"],
    files: ["registry/flip-words.tsx"],
  },
  {
    name: "decay-card",
    type: "components:ui",
    dependencies: ["clsx", "tailwind-merge", "framer-motion"],
    files: ["registry/decay-card.tsx"],
  },
  {
    name: "blob-cursor",
    type: "components:ui",
    dependencies: ["clsx", "tailwind-merge", "framer-motion"],
    files: ["registry/blob-cursor.tsx"],
  },
  {
    name: "fuzzy-text",
    type: "components:ui",
    dependencies: ["clsx", "tailwind-merge"],
    files: ["registry/fuzzy-text.tsx"],
  },
];
INNER_EOF
