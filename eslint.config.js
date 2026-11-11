import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Our Input/Select/Textarea render native controls, so a wrapping <label> is associated.
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["Input", "Select", "Textarea", "PasswordInput"], depth: 3 },
      ],
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^(_|[A-Z])" },
      ],
    },
  },
  {
    // Vercel functions, middleware and config files run on Node.
    files: ["api/**/*.js", "middleware.js", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
