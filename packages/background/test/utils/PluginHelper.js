import SystemJS from 'systemjs';
import PluginManager from '../../src/js/plugins/PluginManager.ts';

const fs = require('fs');
const path = require('path');

// in extension environment some globals are required, replicate them
global.SystemJS = SystemJS;
global.GsfProvider = {};

export default class PluginHelper {
  static async init() {
    // 1. configure systemjs
    SystemJS.config({
      map: {
        idb: './dist/plugins/systemjs/IdbFetchPlugin.js',
        'plugin-babel': './dist/plugins/systemjs/plugin-babel.js',
        'systemjs-babel-build': './dist/plugins/systemjs/systemjs-babel-browser.js',
      },
      transpiler: 'plugin-babel',
      meta: {
        '*.js': {
          babelOptions: {
            // extension run in browsers having ES2015 and stage 1-3 support, disable ES2015, stage 1-3 feature transpilation
            es2015: false,
            stage1: false,
            stage2: false,
            stage3: false,
          },
        },
      },
    });

    // 2. read and import in systemjs the builtin plugins
    const plugins = await PluginHelper.readPluginFiles();
    await PluginManager.persistPlugins(plugins);
    await PluginManager.importPlugins(plugins);
  }

  static async readPluginFiles() {
    const plugins = [];

    const pluginDir = path.join(__dirname, '..', '..', 'dist', 'plugins');
    const pluginDirents = fs.readdirSync(pluginDir, { withFileTypes: true }).filter(pluginDirent => pluginDirent.isFile());

    for (let i = 0; i < pluginDirents.length; i += 1) {
      const pluginDirent = pluginDirents[i];
      const pluginContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'plugins', pluginDirent.name), 'utf8');
      const pluginName = pluginDirent.name.match(/^(\w+).js$/)[1];

      plugins.push(new GsfProvider.UserPlugin(pluginName, pluginContent));
    }

    return plugins;
  }
}
