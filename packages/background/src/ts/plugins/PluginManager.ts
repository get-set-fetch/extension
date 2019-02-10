import GsfProvider from './../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';
import AbstractModuleManager from '../systemjs/AbstractModuleManager';
import { BaseNamedEntity } from 'get-set-fetch';

const Log = Logger.getLogger('PluginManager');

class PluginManager extends AbstractModuleManager {

  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.Plugin.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.Plugin.getAll();
  }

  static instantiateModule(data): BaseNamedEntity {
    return new GsfProvider.Plugin({ name: data.name,  code: data.content });
  }

  static async importPlugins() {
    const availablePlugins = await GsfProvider.Plugin.getAll();
    for (let i = 0; i < availablePlugins.length; i += 1) {
      Log.info(`SystemJS importing plugin ${availablePlugins[i].name}`);
      // without specifying a parent url, System.getMatch enters an infinite loop
      await System.import(`./${availablePlugins[i].name}`, 'a');
      Log.info(`SystemJS importing plugin ${availablePlugins[i].name} DONE`);
    }
  }

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
    const pluginKeys = Array.from(Object.keys(System.getRegistry()));

    return pluginKeys.map((pluginKey) => {
      const classDef = System.get(pluginKey).default;

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
      Log.info(`Instantiating plugin ${pluginDefinition.name}`);
      const classDef = System.get(pluginDefinition.name).default;

      if (classDef) {
        return new (classDef)(pluginDefinition.opts);
      }
      else {
        // could not found corresponding plugin definition
        Log.warn(`pluginDefinition for ${pluginDefinition.name} not found`);
        return null;
      }
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
      const moduleContent: string = GsfProvider.Plugin.modules[plugin.constructor.name];
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
