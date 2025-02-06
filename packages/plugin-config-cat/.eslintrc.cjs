module.exports = {
  extends: ['eslint-config-neo/config-base'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: ['./tsconfig.cjs.json', './test/tsconfig.json'],
    sourceType: 'module',
  },
  rules: {
    jest: 'off',
    'jest/no-commented-out-tests': 'off',
    'jest/no-deprecated-functions': 'off',
    'jest/valid-expect': 'off',
    'jest/valid-expect-in-promise': 'off',
    'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
  },
};
