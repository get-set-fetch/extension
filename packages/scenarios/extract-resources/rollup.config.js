import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import tslint from 'rollup-plugin-tslint';

export default {
  input: 'src/ts/ExtractResources.ts',
  output: {
    file: `dist/ExtractResources.js`,
    format: 'system',
  },
  plugins: [
    typescript(),
    commonjs(),
    json(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    tslint(),
  ],
}
