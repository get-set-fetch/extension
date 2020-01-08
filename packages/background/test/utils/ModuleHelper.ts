import { IModuleRuntime, IModuleStorage } from 'get-set-fetch-extension-commons';
import GsfProvider from '../../src/ts/storage/GsfProvider';

import ModuleRuntimeManager from '../../src/ts/plugins/ModuleRuntimeManager';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';
import ModuleStorageManager from '../../src/ts/plugins/ModuleStorageManager';

const fs = require('fs');
const path = require('path');

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
    ModuleRuntimeManager.registerPlugin = async (name: string) => {
      // scenario already registered
      if (ModuleRuntimeManager.cache.get(name)) return;

      const plugin = await GsfProvider.Plugin.get(name);

      // builtin plugins, not linked to a scenario
      const pluginPath = path.join(__dirname, '..', '..', 'dist', 'plugins', `${name}.js`);
      const pluginModule = await import(pluginPath);

      const moduleRuntime: IModuleRuntime = {
        code: plugin.code,
        module: pluginModule,
        url: null,
      };

      ModuleRuntimeManager.cache.set(name, moduleRuntime);
    };
  }

  static async init() {
    // store plugins in db
    const pluginDefinitions: IModuleStorage[] = await this.getModulesContent(path.join(__dirname, '..', '..', 'dist', 'plugins'));
    const plugins = pluginDefinitions.map(moduleDef => new IdbPlugin(moduleDef));
    await ModuleStorageManager.persistModules(plugins);

    // mock register as nodejs doesn't suppport blob or URL.createURLfromObject
    ModuleHelper.mockPluginManager();

    // register them in PluginManager.cache
    await Promise.all(
      ModuleStorageManager.DEFAULT_PLUGINS.map(defaultPluginName => ModuleRuntimeManager.registerPlugin(defaultPluginName)),
    );
  }

  static getModulesContent(moduleDir): Promise<IModuleStorage[]> {
    return new Promise(resolve => {
      const modules: IModuleStorage[] = [];
      const pluginDirents = fs.readdirSync(moduleDir, { withFileTypes: true }).filter(pluginDirent => pluginDirent.isFile());

      for (let i = 0; i < pluginDirents.length; i += 1) {
        const pluginDirent = pluginDirents[i];
        const pluginContent = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'plugins', pluginDirent.name), 'utf8');
        const pluginName = pluginDirent.name.match(/^(\w+).js$/)[1];
        modules.push({
          name: pluginName,
          code: pluginContent,
          builtin: true,
        });
      }

      resolve(modules);
    });
  }
}
