import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import ignore from 'rollup-plugin-ignore';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';

const mainConfig = {
  input: [
    'src/ts/background-bundle.ts',
    'src/ts/background-main.ts',
  ],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  experimentalCodeSplitting: true,
  chunkFileNames: '[name]-1.js',
  sourceMap: true,
  plugins: [
    ignore([ 'https', 'http', 'jsdom', 'fs', 'path', 'puppeteer', 'console', 'knex', 'mongodb', '__filename' ]),
    typescript(),
    commonjs({
      include: /node_modules/,
      namedExports: {
        '../../node_modules/pako': [ 'inflate' ],
        '../../node_modules/url-parse': [ 'Url' ],
      },
      ignore: [ 'util' ],
    }),
    json(),
    resolve({
      browser: true,
      preferBuiltins: false,
      extensions: [ '.js', '.json', '.ts' ],
      only: [
        'get-set-fetch', 'get-set-fetch-extension-commons',
        'murmurhash-js',
        'url-parse', 'requires-port', 'buffer', 'querystringify',
        'jszip', 'pako', 'untar.js',
      ],
    }),
    globals(),
  ],
};

const crawlPlugins = [
  { name: 'SelectResourcePlugin', src: 'src/ts/plugins/builtin/SelectResourcePlugin.ts' },
  { name: 'UpdateResourcePlugin', src: 'src/ts/plugins/builtin/UpdateResourcePlugin.ts' },
  { name: 'InsertResourcesPlugin', src: 'src/ts/plugins/builtin/InsertResourcesPlugin.ts' },
  { name: 'FetchPlugin', src: 'src/ts/plugins/builtin/FetchPlugin.ts' },
  { name: 'ExtractUrlsPlugin', src: 'src/ts/plugins/builtin/ExtractUrlsPlugin.ts' },
];
const crawlPluginConfig = crawlPlugins.map(plugin => ({
  input: plugin.src,
  output: {
    file: `dist/plugins/${plugin.name}.js`,
    format: 'es',
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve({
      browser: true,
      preferBuiltins: false,
      extensions: [ '.js', '.json' ],
      only: [
        'get-set-fetch-extension-commons',
      ],
    }),
    // tslint(),
  ],
}));

export default [ mainConfig, ...crawlPluginConfig ];
