import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import { eslint } from 'rollup-plugin-eslint';

export default [
  {
    input: 'src/js/popup.js',
    output: {
      file: 'dist/popup.js',
      format: 'esm',
    },
    plugins: [
      commonjs(),
      json(),
      resolve({
        browser: true,
        preferBuiltins: true,
        extensions: ['.js', '.json'],
        jsnext: true,
      }),
      eslint(),
    ],
  },
];
