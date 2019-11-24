import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import scss from 'rollup-plugin-scss';
import url from 'rollup-plugin-url';
import { join } from 'path';

function gsfBuiltin() {
  return {
    name: 'gsf-builtin',
    resolveId(source) {
      if (source === 'util') {
        return require.resolve(join('..', '..', 'node_modules', 'util', 'util.js'));
      }
      return null;
    },
  };
}

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
      browser: true,
      preferBuiltins: false,
    }),
    commonjs({
      include: '../../node_modules/**',
      namedExports: {
        '../../node_modules/react': [
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
        '../../node_modules/react-dom': [
          'render',
          'hydrate',
        ],
        '../../node_modules/react-is': [
          'isValidElementType',
        ],
        '../../node_modules/uniforms': [
          'BaseField',
        ],
        '../../node_modules/uniforms-bootstrap4': [
          'AutoForm', 'AutoField', 'RadioField', 'SelectField', 'DateField', 'ListField', 'NumField', 'TextField', 'LongTextField', 'BoolField', 'wrapField', 'SubmitField',
        ],
        '../../node_modules/uniforms-bridge-json-schema': [
          'JSONSchemaBridge',
        ],
      },
    }),
    gsfBuiltin(),
    typescript(),
    json(),
    scss({
      output: 'dist/admin.css',
      runtime: 'node-sass',
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
