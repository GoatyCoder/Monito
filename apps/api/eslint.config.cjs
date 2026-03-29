const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  ignores: ['dist/', 'node_modules/', 'coverage/', 'generated/'],
  files: ['**/*.ts'],
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      project: './tsconfig.eslint.json',
      sourceType: 'module',
      ecmaVersion: 2022,
    },
  },
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
  },
});
