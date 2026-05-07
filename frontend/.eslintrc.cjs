module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-refresh', 'unused-imports'],
  rules: {
    // Off: this codebase legitimately co-locates context/helpers with components
    // (Toast.tsx, AuthContext.tsx, etc.). Splitting just to satisfy fast-refresh is paperwork.
    'react-refresh/only-export-components': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    '@typescript-eslint/no-unused-vars': 'off',
    // Keeps the high-value catch (an import you forgot to remove).
    'unused-imports/no-unused-imports': 'error',
    // Off: unused destructures/locals are noise more than bugs in this codebase
    // (form helpers like setValue/isDirty, conditionally-used navigate hooks, etc.).
    // Re-enable as 'warn' if you want to clean up over time.
    'unused-imports/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',

    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-case-declarations': 'off',
    'no-prototype-builtins': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-control-regex': 'off',
  },
}
