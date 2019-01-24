import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import serve from 'rollup-plugin-serve';
import tslint from 'rollup-plugin-tslint';
import copy from 'rollup-plugin-copy';

export default {
  input: 'dev/main.tsx',
  output: {
    file: `dev/serve/main.js`,
    format: 'esm',
    sourcemap: 'inline'
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    typescript(),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement'],
        'node_modules/react-dom/index.js': ['render']
      }
    }),
    json(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    globals(),
    builtins(),
    tslint(),
    copy({
      "dev/index.html": "dev/serve/index.html",
      "node_modules/bootstrap/dist": "dev/serve/bootstrap",
      verbose: true
    }),
    serve('dev/serve')
  ],
}
