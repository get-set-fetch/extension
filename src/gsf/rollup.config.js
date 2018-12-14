import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import ignore from 'rollup-plugin-ignore';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import { eslint } from 'rollup-plugin-eslint';


const mainConfig = {
  input: [
    'src/js/background-bundle',
    'src/js/background-main',
  ],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  experimentalCodeSplitting: true,
  sourceMap: true,
  plugins: [
    commonjs(),
    json(),
    ignore(['https', 'http', 'jsdom', 'fs', 'path', 'puppeteer', 'console', 'knex', 'mongodb', '__filename']),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
      only: [
        'get-set-fetch',
        'murmurhash-js',
        'url-parse', 'requires-port', 'buffer', 'querystringify',
        'systemjs',
      ],
    }),
    globals(),
    builtins(),
    eslint(),
  ],
};

const systemjsPlugins = [
  { name: 'IdbFetchPlugin', src: 'src/js/plugins/systemjs/IdbFetchPlugin' },
];
const systemjsPluginConfig = systemjsPlugins.map(plugin => ({
  input: plugin.src,
  output: {
    file: `dist/plugins/systemjs/${plugin.name}.js`,
    format: 'esm',
  },
  plugins: [
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    // eslint(),
  ],
}));

const crawlPlugins = [
  { name: 'SelectResourcePlugin', src: 'src/js/plugins/builtin/SelectResourcePlugin' },
  { name: 'UpdateResourcePlugin', src: 'src/js/plugins/builtin/UpdateResourcePlugin' },
  { name: 'InsertResourcePlugin', src: 'src/js/plugins/builtin/InsertResourcePlugin' },
  { name: 'ExtensionFetchPlugin', src: 'src/js/plugins/builtin/ExtensionFetchPlugin' },
  { name: 'ExtractUrlPlugin', src: 'src/js/plugins/builtin/ExtractUrlPlugin' },
  { name: 'ExtractTitlePlugin', src: 'src/js/plugins/builtin/ExtractTitlePlugin' },
];
const crawlPluginConfig = crawlPlugins.map(plugin => ({
  input: plugin.src,
  output: {
    file: `dist/plugins/${plugin.name}.js`,
    format: 'esm',
  },
  plugins: [
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    eslint(),
  ],
}));

export default [mainConfig, ...systemjsPluginConfig, ...crawlPluginConfig];
