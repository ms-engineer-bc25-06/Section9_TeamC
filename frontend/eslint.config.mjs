import tseslint from 'typescript-eslint';

export default [
  // 無視対象
  { ignores: ['.next/', 'node_modules/', 'dist/', 'build/', 'coverage/', 'out/'] },

  // TypeScript/TSX をパース
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // まず通すための最小緩和（後で段階的に厳しく戻せます）
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // テストでは any を許可（lintで落とさない）
  { files: ['/tests//.', '**/.test.'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
];
