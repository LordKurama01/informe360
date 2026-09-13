import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'mobile/**']
  }
];

export default eslintConfig;
