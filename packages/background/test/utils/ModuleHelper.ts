// tslint:disable:no-var-requires
const fs = require('fs');
const path = require('path');

import GsfProvider from '../../src/ts/storage/GsfProvider';
import PluginManager from '../../src/ts/plugins/PluginManager';
import { IModuleDefinition, IModuleInfo } from 'get-set-fetch-extension-commons';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';

declare global {
  namespace NodeJS {
    interface Global {
      GsfProvider: any;
      window: any;
    }
  }
}

export default class ModuleHelper {
  static async mockPluginManager() {
    PluginManager.register = async (name: string) => {
      // scenario already registered
      if (PluginManager.cache.get(name)) return;

      const plugin = await GsfProvider.Plugin.get(name);
      let moduleInfo: IModuleInfo;

      // builtin plugins, not linked to a scenario
      const pluginPath = path.join(__dirname, '..', '..', 'dist', 'plugins', `${name}.js`);
      const pluginModule = await import(pluginPath);

      moduleInfo = {
        code: plugin.code,
        module: pluginModule,
        url: null
      };

      PluginManager.cache.set(name, moduleInfo);
    };
  }

  static async init() {
    // store plugins in db
    const pluginDefinitions: IModuleDefinition[] = await this.getModulesContent(path.join(__dirname, '..', '..', 'dist', 'plugins'));
    const plugins = pluginDefinitions.map(moduleDef => new IdbPlugin(moduleDef));
    await PluginManager.persistPlugins(plugins);

    // mock register as nodejs doesn't suppport blob or URL.createURLfromObject
    ModuleHelper.mockPluginManager();

    // register them in PluginManager.cache
    await Promise.all(
      PluginManager.DEFAULT_PLUGINS.map(defaultPluginName => PluginManager.register(defaultPluginName))
    );
  }

  static getModulesContent(moduleDir): Promise<IModuleDefinition[]> {
    return new Promise(resolve => {
      const modules: IModuleDefinition[] = [];
      const pluginDirents = fs.readdirSync(moduleDir, { withFileTypes: true }).filter(pluginDirent => pluginDirent.isFile());

      for (let i = 0; i < pluginDirents.length; i += 1) {
        const pluginDirent = pluginDirents[i];
        const pluginContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'plugins', pluginDirent.name), 'utf8');
        const pluginName = pluginDirent.name.match(/^(\w+).js$/)[1];
        modules.push({
          name: pluginName,
          code: pluginContent
        });
      }

      resolve(modules);
    });
  }
}
