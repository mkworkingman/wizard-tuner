import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import storybook from "eslint-plugin-storybook";
import prettier from "eslint-config-prettier/flat";

// Raw Tailwind palette colours and arbitrary colour values bypass the design
// tokens in app/globals.css. Use semantic tokens (bg-primary, text-muted-foreground…).
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";
const COLOR_UTILS =
  "bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|decoration|accent|caret|divide|placeholder";

export default defineConfig([
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // jsx-a11y: eslint-config-next registers the plugin but enables only a few
  // rules (mostly as warnings). Turn on the full strict set as errors.
  {
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.strict.rules,
  },

  // Tailwind correctness: unknown/conflicting classes, plus design-token enforcement.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [betterTailwind.configs["correctness-error"]],
    settings: {
      "better-tailwindcss": { entryPoint: "app/globals.css" },
    },
    rules: {
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: `^([a-zA-Z0-9:/_\\[\\]&*-]*:)?!?-?(${COLOR_UTILS})-(${PALETTE})(-\\d{2,3})?(\\/.*)?$`,
              message:
                "Raw palette colour '$2-$3…' — use a design token from app/globals.css (e.g. bg-primary, text-muted-foreground).",
            },
            {
              pattern: "^.*-\\[(#|rgb|hsl|oklch|oklab|lab|lch|color-mix).*\\]$",
              message: "Arbitrary colour value — add a token to app/globals.css instead.",
            },
          ],
        },
      ],
    },
  },
  // shadcn primitives are vendored code that uses a few arbitrary values; tokens
  // are still the rule everywhere else.
  {
    files: ["components/ui/**"],
    rules: {
      "better-tailwindcss/no-restricted-classes": "off",
      // Keep vendored shadcn code diff-able with upstream; don't restyle it.
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },

  ...storybook.configs["flat/recommended"],
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    ".lighthouseci/**",
    "coverage/**",
    "!.storybook",
  ]),
]);
