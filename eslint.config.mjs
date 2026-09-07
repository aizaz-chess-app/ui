import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }, rules: jsxA11y.flatConfigs.recommended.rules },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/lib/api/schema.d.ts', 'coverage/**'])
]);

export default eslintConfig;
