const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  ignores: ['dist/', 'node_modules/'],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      project: './tsconfig.eslint.json',
      sourceType: 'module',
      ecmaVersion: 2022,
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
});
