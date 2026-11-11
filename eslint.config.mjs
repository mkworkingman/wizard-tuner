import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import tseslint from "typescript-eslint"
import jsxA11y from "eslint-plugin-jsx-a11y"
import betterTailwind from "eslint-plugin-better-tailwindcss"
import storybook from "eslint-plugin-storybook"
import prettier from "eslint-config-prettier/flat"

// Raw Tailwind palette colours and arbitrary colour values bypass the design
// tokens in app/globals.css. Use semantic tokens (bg-primary, text-muted-foreground…).
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white"
const COLOR_UTILS =
  "bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|decoration|accent|caret|divide|placeholder"

// 8px grid (see AGENTS.md): utilities whose numeric steps are spacing/size.
const SPACING_UTILS =
  "p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|w|h|size|min-[wh]|max-[wh]|inset(-[xy])?|top|right|bottom|left|start|end|translate-[xy]|basis|indent|scroll-[mp][xytrblse]?"

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

  // `type` over `interface`; interfaces only to augment globals (use an eslint-disable comment there).
  {
    rules: { "@typescript-eslint/consistent-type-definitions": ["error", "type"] },
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
            // 8px grid: Tailwind steps are 4px, so odd steps above 1 and half steps are off-grid.
            // Step 1 (4px) is allowed but discouraged (see AGENTS.md).
            {
              pattern: `^([a-zA-Z0-9:/_\\[\\]&*-]*:)?!?-?(${SPACING_UTILS})-((?!1$)\\d*[13579]|\\d+\\.\\d+)$`,
              message:
                "Off the 8px grid — use even steps (p-2 = 8px, p-4 = 16px); p-1 (4px) only if needed.",
            },
            // One shared focus indicator (see "No duplicated styling" in AGENTS.md).
            {
              pattern: "(^|:)(focus|focus-visible):!?outline-.*$|^!?outline-none$",
              message:
                "Hand-written focus outline — use the shared `focus-ring` utility from app/globals.css.",
            },
            // Transitions are 200ms via --default-transition-duration in app/globals.css.
            {
              pattern: "(^|:)!?duration-.*$",
              message:
                "No duration-* classes — --default-transition-duration in app/globals.css sets 200ms for every transition.",
            },
            // No arbitrary px, except 1–2px effects (borders, outlines, rings, shadows, blur).
            {
              pattern:
                "^(?!.*(border|outline|ring|shadow|divide|blur)).*-\\[[^\\]]*\\d+px[^\\]]*\\]$",
              message:
                "Arbitrary px value — use the spacing scale (rem) or add a token to app/globals.css.",
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

  // Component files and their stories are PascalCase (NavButton.tsx, NavButton.stories.tsx).
  // components/ui stays kebab-case (shadcn CLI output).
  {
    files: ["components/**/*.tsx", "**/_components/**/*.tsx", "stories/**/*.tsx"],
    ignores: ["components/ui/**"],
    plugins: {
      local: {
        rules: {
          "pascal-case-filename": {
            meta: { type: "problem", schema: [] },
            create(context) {
              return {
                Program(node) {
                  const name = context.filename.split(/[\\/]/).pop() ?? ""
                  if (!/^[A-Z][A-Za-z0-9]*(\.stories)?\.tsx$/.test(name)) {
                    context.report({
                      node,
                      message: `File name '${name}' must be PascalCase and match the exported component (e.g. NavButton.tsx).`,
                    })
                  }
                },
              }
            },
          },
        },
      },
    },
    rules: { "local/pascal-case-filename": "error" },
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
])
