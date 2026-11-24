import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/reports/**",
      "apps/frontend/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
