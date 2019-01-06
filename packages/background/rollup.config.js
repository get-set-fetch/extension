import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import ignore from 'rollup-plugin-ignore';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import tslint from 'rollup-plugin-tslint';


const mainConfig = {
  input: [
    'src/js/background-bundle.ts',
    'src/js/background-main.ts',
  ],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  experimentalCodeSplitting: true,
  sourceMap: true,
  plugins: [
    ignore(['https', 'http', 'jsdom', 'fs', 'path', 'puppeteer', 'console', 'knex', 'mongodb', '__filename']),
    typescript(),
    commonjs(),
    json(),
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
    tslint(),
  ],
};

const systemjsPlugins = [
  { name: 'IdbFetchPlugin', src: 'src/js/plugins/systemjs/IdbFetchPlugin.ts' },
];
const systemjsPluginConfig = systemjsPlugins.map(plugin => ({
  input: plugin.src,
  output: {
    file: `dist/plugins/systemjs/${plugin.name}.js`,
    format: 'esm',
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    tslint(),
  ],
}));

const crawlPlugins = [
  { name: 'SelectResourcePlugin', src: 'src/js/plugins/builtin/SelectResourcePlugin.ts' },
  { name: 'UpdateResourcePlugin', src: 'src/js/plugins/builtin/UpdateResourcePlugin.ts' },
  { name: 'InsertResourcePlugin', src: 'src/js/plugins/builtin/InsertResourcePlugin.ts' },
  { name: 'ExtensionFetchPlugin', src: 'src/js/plugins/builtin/ExtensionFetchPlugin.ts' },
  { name: 'ExtractUrlPlugin', src: 'src/js/plugins/builtin/ExtractUrlPlugin.ts' },
  { name: 'ExtractTitlePlugin', src: 'src/js/plugins/builtin/ExtractTitlePlugin.ts' },
];
const crawlPluginConfig = crawlPlugins.map(plugin => ({
  input: plugin.src,
  output: {
    file: `dist/plugins/${plugin.name}.js`,
    format: 'esm',
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: true,
      extensions: ['.js', '.json'],
      jsnext: true,
    }),
    tslint(),
  ],
}));

export default [mainConfig, ...systemjsPluginConfig, ...crawlPluginConfig];
