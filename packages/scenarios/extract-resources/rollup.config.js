import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import tslint from 'rollup-plugin-tslint';

export default {
  input: 'src/ts/ExtractResources.ts',
  output: {
    file: 'dist/ExtractResources.js',
    format: 'esm',
  },
  plugins: [
    typescript(),
    commonjs({extensions: ['.js', '.ts']}) ,
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json', '.ts', '.tsx'],
      jsnext: false,
    }),
   // tslint(),
  ],
}
