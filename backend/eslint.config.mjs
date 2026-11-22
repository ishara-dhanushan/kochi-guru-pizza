import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // SWC hoists global jest.mock calls before imports in these test files.
  {
    files: ["tests/**/*.ts"],
    languageOptions: { globals: globals.jest }
  }
];
