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
    const pluginDefinitions = await this.getPluginsModules();
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
    let scenarioNames: string[];
    try {
      scenarioNames = await (
        await fetch(browser.extension.getURL('scenarios/scenario-list.json'))
      ).json();
    }
    catch (err) {
      throw new Error('could not fetch scenario-list.json');
    }

    const scenarioPkgs = Promise.all<IScenarioStorage>(
      scenarioNames.map(async scenarioName => ModuleStorageManager.getLocalScenarioDetails(scenarioName)),
    );

    return scenarioPkgs;
  }

  static async getLocalScenarioDetails(scenarioName: string): Promise<IScenarioStorage> {
    // fetch package.json
    let pkgJson;
    try {
      pkgJson = await (
        await fetch(browser.extension.getURL(`scenarios/${scenarioName}/package.json`))
      ).json();
    }
    catch (err) {
      throw new Error(`could not fetch scenarios/${scenarioName}/package.json`);
    }

    // fetch main file
    let code: string;
    try {
      const scenarioMainFile = `scenarios/${scenarioName}/${pkgJson.main}`;
      code = await (
        await fetch(browser.extension.getURL(scenarioMainFile))
      ).text();
    }
    catch (err) {
      throw new Error(`could not fetch scenarios/${scenarioName}/${pkgJson.main}`);
    }

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

  static async getPluginsModules(): Promise<IModuleStorage[]> {
    let pluginNames: string[];
    try {
      pluginNames = await (
        await fetch(browser.extension.getURL('background/plugins/plugin-list.json'))
      ).json();
    }
    catch (err) {
      throw new Error(`could not fetch plugin-list.json: ${JSON.stringify(err)}`);
    }

    const pluginModules = Promise.all<IModuleStorage>(
      pluginNames.map(async pluginName => {
        const pluginFile = `background/plugins/${pluginName}.js`;
        try {
          const code = await (
            await fetch(browser.extension.getURL(pluginFile))
          ).text();

          const moduleDef: IModuleStorage = { name: pluginName, code, builtin: true };
          return moduleDef;
        }
        catch (err) {
          throw new Error(`could not fetch plugin ${pluginFile}`);
        }
      }),
    );

    return pluginModules;
  }
}
