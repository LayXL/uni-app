import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          1: "var(--neutral-1)",
          2: "var(--neutral-2)",
          3: "var(--neutral-3)",
          4: "var(--neutral-4)",
          5: "var(--neutral-5)",
          6: "var(--neutral-6)",
          7: "var(--neutral-7)",
          8: "var(--neutral-8)",
          9: "var(--neutral-9)",
          10: "var(--neutral-10)",
          11: "var(--neutral-11)",
          12: "var(--neutral-12)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config
