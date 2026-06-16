import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const ignored = {
  ignores: [
    ".next/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "coverage/**",
    "animation-for-game-development/**",
  ],
};

const eslintConfig = [ignored, ...nextVitals, ...nextTypescript];

export default eslintConfig;
