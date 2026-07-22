import type { Config } from "tailwindcss";

// Design 2 – Professional zůstává výchozí a přesně odpovídá dřívějším
// hex hodnotám. Od Modulu 16 (Nastavení aplikace) jsou tyto tokeny
// navázané na CSS proměnné, takže se dají za běhu přepnout na jeden
// z šesti schválených designů, aniž by bylo nutné upravovat jakoukoliv
// komponentu, která už tyto Tailwind třídy používá (bg-base-950,
// text-gold, border-turquoise, atd.).
function withOpacity(variableName: string) {
  return `rgb(var(${variableName}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: withOpacity("--c-base-950"),
          900: withOpacity("--c-base-900"),
          800: withOpacity("--c-base-800"),
        },
        glass: {
          border: "rgba(255,255,255,0.08)",
          fill: "rgba(255,255,255,0.04)",
        },
        gold: {
          DEFAULT: withOpacity("--c-gold"),
          light: withOpacity("--c-gold-light"),
        },
        turquoise: {
          DEFAULT: withOpacity("--c-turquoise"),
          light: withOpacity("--c-turquoise-light"),
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
