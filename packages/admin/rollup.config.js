import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import sass from 'rollup-plugin-sass';
import url from 'rollup-plugin-url';

export default {
  input: './src/ts/admin.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  experimentalCodeSplitting: true,
  sourceMap: true,
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs({
      include: [
        'node_modules/**/*',
      ],
      namedExports: {
        react: [
          'Children',
          'Component',
          'PureComponent',
          'PropTypes',
          'createElement',
          'Fragment',
          'cloneElement',
          'StrictMode',
          'createFactory',
          'createRef',
          'createContext',
          'isValidElement',
        ],
        'react-dom': [
          'render',
          'hydrate',
        ],
        'react-is': [
          'isValidElementType',
        ],
      },
    }),
    typescript(),
    json(),
    sass({
      output: 'dist/admin.css',
    }),
    url({
      limit: 0,
      include: [ '**/*.svg', '**/*.png', '**/*.jpg' ],
      destDir: 'dist/images',
      fileName: '[name][extname]',
      publicPath: '/admin/images/',
    }),
    globals(),
  ],
};
