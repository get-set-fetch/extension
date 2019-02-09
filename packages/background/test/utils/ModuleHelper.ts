// tslint:disable:no-var-requires
const fs = require('fs');
const path = require('path');
const SystemJS = require('systemjs');

import PluginManager from '../../src/js/plugins/PluginManager';
import { System } from 'systemjs';

declare global {
  namespace NodeJS {
    interface Global {
      SystemJS: System;
      GsfProvider: any;
    }
  }
}

global.SystemJS = SystemJS;

export default class ModuleHelper {
  static async init() {
    // 1. configure systemjs
    SystemJS.config({
      map: {
        'idb': './dist/plugins/systemjs/IdbFetchPlugin.js',
        'plugin-babel': './dist/plugins/systemjs/plugin-babel.js',
        'systemjs-babel-build': './dist/plugins/systemjs/systemjs-babel-browser.js'
      },
      transpiler: 'plugin-babel',
      meta: {
        '*.js': {
          babelOptions: {
            // extension run in browsers having ES2015 and stage 1-3 support, disable ES2015, stage 1-3 feature transpilation
            es2015: false,
            stage1: false,
            stage2: false,
            stage3: false
          }
        }
      }
    });

    // 2. read and import in systemjs the builtin plugins
    const plugins: Map<string, string> = await this.getModulesContent(path.join(__dirname, '..', '..', 'dist', 'plugins'));
    await PluginManager.persistModules(plugins);
    await PluginManager.importPlugins();
  }

  static getModulesContent(moduleDir): Promise<Map<string, string>> {
    return new Promise(resolve => {
      const modules: Map<string, string> = new Map<string, string>();
      const pluginDirents = fs.readdirSync(moduleDir, { withFileTypes: true }).filter(pluginDirent => pluginDirent.isFile());

      for (let i = 0; i < pluginDirents.length; i += 1) {
        const pluginDirent = pluginDirents[i];
        const pluginContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'plugins', pluginDirent.name), 'utf8');
        const pluginName = pluginDirent.name.match(/^(\w+).js$/)[1];

        modules.set(pluginName, pluginContent);
      }

      resolve(modules);
    });
  }
}
