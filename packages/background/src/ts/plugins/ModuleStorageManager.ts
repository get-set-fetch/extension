import { IModuleStorage, IScenarioStorage } from 'get-set-fetch-extension-commons';
import IdbPlugin from '../storage/IdbPlugin';
import Logger from '../logger/Logger';
import IdbScenario from '../storage/IdbScenario';
import ModuleRuntimeManager from './ModuleRuntimeManager';
import GsfProvider from '../storage/GsfProvider';

const Log = Logger.getLogger('ModuleStorageManager');

export default class ModuleStorageManager {
  static persistModules(mdls: (IdbPlugin | IdbScenario)[]) {
    return Promise.all(
      mdls.map(async mdl => {
        const storedModule = await (mdl instanceof IdbPlugin ? GsfProvider.Plugin.get(mdl.name) : GsfProvider.Scenario.get(mdl.name));
        if (!storedModule) {
          Log.info(`Saving module ${mdl.name} to database`);
          await mdl.save();
          Log.info(`Saving module ${mdl.name} to database DONE`);
        }
      }),
    );
  }

  /* PLUGIN UTILITIES */

  static get DEFAULT_PLUGINS(): string[] {
    return [
      'SelectResourcePlugin',
      'FetchPlugin',
      'DynamicNavigationPlugin',
      'ScrollPlugin',
      'ExtractUrlsPlugin',
      'ExtractHtmlContentPlugin',
      'UpsertResourcePlugin',
      'InsertResourcesPlugin',
    ];
  }

  static async discoverLocalPlugins() {
    const pluginDefinitions = await this.getModulesContent('background/plugins');
    const plugins = pluginDefinitions.map(moduleDef => new GsfProvider.Plugin(moduleDef));
    await ModuleStorageManager.persistModules(plugins);
  }

  static getDefaultPluginDefs() {
    const availablePluginDefs = this.getAvailablePluginDefs();
    return availablePluginDefs.filter(pluginDef => this.DEFAULT_PLUGINS.indexOf(pluginDef.name) !== -1);
  }

  static getAvailablePluginDefs() {
    const pluginKeys = Array.from(ModuleRuntimeManager.cache.keys());

    return pluginKeys.map(pluginKey => {
      const ClassDef = ModuleRuntimeManager.cache.get(pluginKey).module.default;

      const pluginInstance = new (ClassDef)();

      // for each plugin, based on its instance, return its name and default options
      return {
        name: pluginInstance.constructor.name,
        opts: pluginInstance.opts || {},
      };
    });
  }

  /* SCENARIO UTILITIES */

  static async discoverLocalScenarios() {
    const scenarioPkgDefs: IScenarioStorage[] = await ModuleStorageManager.getLocalScenarios();
    const scenarioPkgs = scenarioPkgDefs.map(scenarioPkgDef => new GsfProvider.Scenario(scenarioPkgDef));
    await this.persistModules(scenarioPkgs);

    // store plugins embedded with scenarios
    await ModuleStorageManager.storeEmbeddedPlugins(scenarioPkgDefs);
  }

  static async getLocalScenarios(): Promise<IScenarioStorage[]> {
    const scenarioDirs = await ModuleStorageManager.getLocalDirs('scenarios');
    const scenarioPkgs = Promise.all(
      scenarioDirs.map(scenarioDir => ModuleStorageManager.getLocalScenarioDetails(scenarioDir)),
    );
    return scenarioPkgs;
  }

  static async getLocalScenarioDetails(dir: DirectoryEntry): Promise<IScenarioStorage> {
    // read local package.json
    const pkgFileContent: string = await new Promise(resolve => {
      dir.getFile('package.json', {}, async (pkgFileEntry: FileEntry) => {
        const fileContent = await ModuleStorageManager.getFileContent(pkgFileEntry);
        resolve(fileContent);
      });
    });
    const pkgJson = JSON.parse(pkgFileContent);

    // read local main file
    const code: string = await new Promise(resolve => {
      dir.getFile(pkgJson.main, {}, async (mainFileEntry: FileEntry) => {
        const fileContent = await ModuleStorageManager.getFileContent(mainFileEntry);
        resolve(fileContent);
      });
    });

    // pick relevant json npm props
    const extractProps = (
      { name, version, description, main, author, license, homepage },
    ) => ({ name, version, description, main, author: author.name, license, homepage });
    const scenarioStorage: IScenarioStorage = { name: pkgJson.name, package: extractProps(pkgJson), code, builtin: true };

    return scenarioStorage;
  }

  static storeEmbeddedPlugins(scenarioPkgDefs: IScenarioStorage[]) {
    return Promise.all(
      scenarioPkgDefs.map(async scenarioPkgDef => {
        Log.info(`Checking ${scenarioPkgDef.name} for embedded plugins`);
        const scenario = await GsfProvider.Scenario.get(scenarioPkgDef.name);
        await ModuleRuntimeManager.registerScenario(scenarioPkgDef.name);
        const modulePlugins = ModuleRuntimeManager.cache.get(scenarioPkgDef.name).module.embeddedPlugins;
        const embeddedPluginNames = modulePlugins ? Object.keys(modulePlugins) : [];
        const embeddedPlugins = embeddedPluginNames.map(name => new GsfProvider.Plugin({
          scenarioId: scenario.id,
          name,
          code: null,
          builtin: true,
        }));
        await ModuleStorageManager.persistModules(embeddedPlugins);
      }),
    );
  }

  /* FILE UTILITIES */

  static getLocalDirs(relativeDir: string): Promise<DirectoryEntry[]> {
    return new Promise((resolve, reject) => {
      let dirs: DirectoryEntry[] = [];

      chrome.runtime.getPackageDirectoryEntry(root => {
        root.getDirectory(relativeDir, { create: false }, modulesDir => {
          const reader = modulesDir.createReader();
          // assume there are just a dozen plugins,
          // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
          reader.readEntries(
            async (entries: Entry[]) => {
              dirs = entries.filter(entry => entry.isDirectory) as DirectoryEntry[];
              resolve(dirs);
            },
            err => {
              reject(err);
            },
          );
        });
      });
    });
  }

  static getFileContent(fileEntry: FileEntry): Promise<string> {
    return new Promise(resolve => {
      fileEntry.file(pluginFile => {
        const fileReader = new FileReader();
        fileReader.onloadend = () => resolve(fileReader.result as string);
        fileReader.readAsText(pluginFile);
      });
    });
  }

  static getModulesContent(relativeDir: string): Promise<IModuleStorage[]> {
    return new Promise((resolve, reject) => {
      let modules: IModuleStorage[] = [];

      chrome.runtime.getPackageDirectoryEntry(root => {
        root.getDirectory(relativeDir, { create: false }, modulesDir => {
          const reader = modulesDir.createReader();
          // assume there are just a dozen plugins,
          // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
          reader.readEntries(
            async (moduleFileEntries: FileEntry[]) => {
              modules = await Promise.all(
                moduleFileEntries.map(async moduleFileEntry => {
                  const code = await ModuleStorageManager.getFileContent(moduleFileEntry);
                  const name = moduleFileEntry.name.match(/^(\w+).js$/)[1];
                  const moduleDef: IModuleStorage = { name, code, builtin: true };
                  return moduleDef;
                }),
              );

              resolve(modules);
            },
            err => {
              reject(err);
            },
          );
        });
      });
    });
  }
}
