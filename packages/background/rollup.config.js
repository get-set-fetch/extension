import { join } from 'path';

import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import globals from 'rollup-plugin-node-globals';

// from 'get-set-fetch' we only need: BaseEntity, BaseResource, BloomFilter (replace its nodejs Logger with browser extension Logger)
function gsfBuiltin() {
  return {
    name: 'gsf-builtin',
    resolveId(source) {
      if (/Logger/.test(source)) {
        return require.resolve(join(__dirname, 'src', 'ts', 'logger', 'Logger.ts'));
      }
      return null;
    }
  };
}

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
    gsfBuiltin(),

    resolve({
      mainFields: ['module', 'main'],
      browser: true,
      preferBuiltins: false,
      extensions: [ '.js', '.json', '.ts' ],
    }),

    commonjs({
      include: /node_modules/,
      namedExports: {
        'pako': [ 'inflate', 'deflate' ],
        'url-parse': [ 'Url' ],
      },
    }),

    json(),

    globals(),

    typescript(),
  ],
};

const crawlPlugins = [
  { name: 'SelectResourcePlugin', src: 'src/ts/plugins/builtin/SelectResourcePlugin.ts' },
  { name: 'UpdateResourcePlugin', src: 'src/ts/plugins/builtin/UpdateResourcePlugin.ts' },
  { name: 'InsertResourcesPlugin', src: 'src/ts/plugins/builtin/InsertResourcesPlugin.ts' },
  { name: 'FetchPlugin', src: 'src/ts/plugins/builtin/FetchPlugin.ts' },
  { name: 'ExtractUrlsPlugin', src: 'src/ts/plugins/builtin/ExtractUrlsPlugin.ts' },
  { name: 'ScrollPlugin', src: 'src/ts/plugins/builtin/ScrollPlugin.ts' },
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
