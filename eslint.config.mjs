import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: jsxA11y.flatConfigs.recommended.rules,
    // Our shadcn primitives are thin wrappers over real elements. Naming them here is what lets the
    // a11y rules see through to the markup, so `<Label>` and `<Input>` call sites get checked at all.
    settings: { 'jsx-a11y': { components: { Label: 'label', Input: 'input' }, controlComponents: ['RadioGroupItem', 'Input'] } }
  },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/lib/api/schema.d.ts', 'coverage/**'])
]);

export default eslintConfig;
