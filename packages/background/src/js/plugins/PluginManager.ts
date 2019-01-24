import GsfProvider from './../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import { System } from 'systemjs';
import Logger from '../logger/Logger';
import AbstractModuleManager from '../systemjs/AbstractModuleManager';
import { BaseNamedEntity } from 'get-set-fetch';

declare const SystemJS: System;
const Log = Logger.getLogger('PluginManager');

class PluginManager extends AbstractModuleManager {

  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.UserPlugin.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.UserPlugin.getAll();
  }

  static instantiateModule(data): BaseNamedEntity {
    return new GsfProvider.UserPlugin(data.name,  data.content);
  }

  static async importPlugins() {
    const availablePlugins = await GsfProvider.UserPlugin.getAll();
    for (let i = 0; i < availablePlugins.length; i += 1) {
      Log.info(`SystemJS importing plugin ${availablePlugins[i].name}`);
      await SystemJS.import(`${availablePlugins[i].name}!idb`);
      Log.info(`SystemJS importing plugin ${availablePlugins[i].name} DONE`);
    }
  }

  /*
    import via SystemJS all available plugins: builtin and user defined ones
  */
 static async discoverPlugins() {
  const plugins = await this.getModulesContent('background/plugins');
  await this.persistModules(plugins);
  await this.importPlugins();
}

  static get DEFAULT_PLUGINS(): string[] {
    return ['SelectResourcePlugin', 'ExtensionFetchPlugin', 'ExtractUrlPlugin', 'UpdateResourcePlugin', 'InsertResourcePlugin'];
  }

  static getDefaultPluginDefs() {
    const availablePluginDefs = this.getAvailablePluginDefs();
    return availablePluginDefs.filter(pluginDef => this.DEFAULT_PLUGINS.indexOf(pluginDef.name) !== -1);
  }

  static getAvailablePluginDefs() {
    // filter plugins so only those loaded from the db via IdbFetchPlugin qualify
    const pluginKeys = Array.from(SystemJS.registry.keys()).filter((key: any) => key.toString().match(/^.+!.+IdbFetchPlugin.js$/));
    return pluginKeys.map((pluginKey) => {
      const classDef = SystemJS.registry.get(pluginKey).default;

      const pluginInstance = new (classDef)();

      // for each plugin, based on its instance, return its name and default options
      return {
        name: pluginInstance.constructor.name,
        opts: pluginInstance.opts || {},
        schema: pluginInstance.OPTS_SCHEMA
      };
    });
  }

  static instantiate(pluginDefinitions) {
    return pluginDefinitions.map((pluginDefinition) => {
      const pluginKey = Array.from(SystemJS.registry.keys()).find((key: any) => key.toString().indexOf(`/${pluginDefinition.name}!`) !== -1);
      Log.info(`Instantiating plugin ${pluginDefinition.name}`);
      if (pluginKey) {
        const classDef = SystemJS.registry.get(pluginKey).default;

        return new (classDef)(pluginDefinition.opts);
      }

      // could not found corresponding plugin definition
      Log.warn(`pluginDefinition for ${pluginDefinition.name} not found`);
      return null;
    });
  }

  static async runInTab(tabId, plugin, site, resource) {
    let result = {};
    try {
      /*
      load each class separately, some utility classes may have already been loaded by other already loaded modules
      if a class is already declared in the current tab, re-loading it fails with
      "Uncaught SyntaxError: Identifier 'ClassName' has already been declared at "
      but the other classes present in module will still load
      */
      const moduleContent: string = GsfProvider.UserPlugin.modules[plugin.constructor.name];
      // use negative lookahead (?!) to match anyting starting with a class definition but not containing another class definition
      const moduleClasses = moduleContent.match(/(class \w+ {([\s\S](?!(class \w+ {)))+)/gm);
      for (let i = 0; i < moduleClasses.length; i += 1) {
        await ActiveTabHelper.executeScript(tabId, { code: moduleClasses[i] });
      }

      // instantiate module with opts
      const pluginInstanceName = `inst${plugin.constructor.name}`;
      await ActiveTabHelper.executeScript(
        tabId,
        { code: `const ${pluginInstanceName} = new ${plugin.constructor.name}(${JSON.stringify(plugin.opts)})` }
      );

      // test if plugin is aplicable
      const isAplicable = await ActiveTabHelper.executeScript(
        tabId,
        { code: `${pluginInstanceName}.test(${JSON.stringify(site)}, ${JSON.stringify(resource)})` }
      );
      if (!isAplicable) return null;

      // apply plugin, the result will be merged at a higher level into the current resource
      result = await ActiveTabHelper.executeScript(
        tabId,
        { code: `${pluginInstanceName}.apply(${JSON.stringify(site)}, ${JSON.stringify(resource)})` }
      );
    }
    catch (err) {
      Log.error(err);
      throw err;
    }

    return result;
  }
}

export default PluginManager;
