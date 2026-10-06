import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/controllers/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['mongoose'],
          patterns: [
            {
              group: ['**/models/**', '**/config/database*'],
              message: 'Controllers must access persistence through services.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/services/**/*.ts', 'src/models/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['express'],
          patterns: [
            {
              group: ['**/controllers/**', '**/routes/**', '**/middleware/**'],
              message:
                'Business and data layers must remain independent of HTTP.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['mongoose'],
          patterns: [
            {
              group: ['**/models/**', '**/services/**', '**/config/database*'],
              message: 'Routes must map HTTP requests to controllers only.',
            },
          ],
        },
      ],
    },
  },
);
