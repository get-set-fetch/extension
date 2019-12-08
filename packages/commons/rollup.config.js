import typescript from 'rollup-plugin-typescript';
// import tslint from 'rollup-plugin-tslint';

export default {
  input: 'lib/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    typescript(),
    // tslint(),
  ],
};
