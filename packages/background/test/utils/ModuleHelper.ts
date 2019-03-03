// tslint:disable:no-var-requires
const fs = require('fs');
const path = require('path');

import PluginManager from '../../src/ts/plugins/PluginManager';

declare global {
  namespace NodeJS {
    interface Global {
      GsfProvider: any;
      window: any;
    }
  }
}

export default class ModuleHelper {
  static async init() {
    // 2. read and import in systemjs the builtin plugins
    const plugins: Map<string, string> = await this.getModulesContent(path.join(__dirname, '..', '..', 'dist', 'plugins'));
    await PluginManager.persistModules(plugins);
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
