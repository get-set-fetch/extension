import GsfProvider from './../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';
import BaseModuleManager from './BaseModuleManager';
import { BaseNamedEntity } from 'get-set-fetch';
import { IModuleInfo } from 'get-set-fetch-extension-commons';
import ScenarioManager from '../scenarios/ScenarioManager';
import IdbPlugin from '../storage/IdbPlugin';

const Log = Logger.getLogger('PluginManager');

class PluginManager extends BaseModuleManager {

  static cache: Map<string, IModuleInfo> = new Map();

  static get DEFAULT_PLUGINS(): string[] {
    return ['SelectResourcePlugin', 'ExtensionFetchPlugin', 'ExtractUrlPlugin', 'UpdateResourcePlugin', 'InsertResourcePlugin'];
  }

  static persistPlugins(plugins: IdbPlugin[]) {
    return Promise.all(
      plugins.map(async (plugin) => {
        const storedPlugin = await GsfProvider.Plugin.get(plugin.name);
        if (!storedPlugin) {
          Log.info(`Saving plugin ${plugin.name} to database`);
          await plugin.save();
          Log.info(`Saving plugin ${plugin.name} to database DONE`);
        }
      })
    );
  }

 static async discoverPlugins() {
  const pluginDefinitions = await this.getModulesContent('background/plugins');
  const plugins = pluginDefinitions.map(moduleDef => new GsfProvider.Plugin(moduleDef));
  await PluginManager.persistPlugins(plugins);
}

  static getDefaultPluginDefs() {
    const availablePluginDefs = this.getAvailablePluginDefs();
    return availablePluginDefs.filter(pluginDef => this.DEFAULT_PLUGINS.indexOf(pluginDef.name) !== -1);
  }

  static getAvailablePluginDefs() {
    const pluginKeys = Array.from(PluginManager.cache.keys());

    return pluginKeys.map((pluginKey) => {
      const classDef = PluginManager.cache.get(pluginKey).module.default;

      const pluginInstance = new (classDef)();

      // for each plugin, based on its instance, return its name and default options
      return {
        name: pluginInstance.constructor.name,
        opts: pluginInstance.opts || {},
        schema: pluginInstance.OPTS_SCHEMA
      };
    });
  }

  static async register(name: string) {
    // scenario already registered
    if (PluginManager.cache.get(name)) return;

    const plugin = await GsfProvider.Plugin.get(name);
    let moduleInfo: IModuleInfo;

    // builtin plugin, not linked to a scenario
    if (!plugin.scenarioId) {
      const pluginBlob = new Blob([plugin.code], { type: 'text/javascript' });
      const pluginUrl = URL.createObjectURL(pluginBlob);
      const pluginModule = await import(pluginUrl);

      moduleInfo = {
        code: plugin.code,
        module: pluginModule,
        url: pluginUrl
      };
    }
    // plugin linked to a scenario
    else {
      moduleInfo = await ScenarioManager.resolveEmbeddedPlugin(plugin);
    }

    PluginManager.cache.set(name, moduleInfo);
  }

  static async instantiate(pluginDefinitions): Promise<any[]> {
    const pluginInstances = [];

    for (const pluginDef of pluginDefinitions) {
      Log.info(`Instantiating plugin ${pluginDef.name}`);

      if (!PluginManager.cache.get(pluginDef.name)) {
        await PluginManager.register(pluginDef.name);
      }

      const classDef = PluginManager.cache.get(pluginDef.name).module.default;
      const pluginInstance = new (classDef)(pluginDef.opts);
      pluginInstances.push(pluginInstance);
    }

    /*
    to do: handle missing plugin definitions
    // could not found corresponding plugin definition
    Log.warn(`pluginDefinition for ${pluginDefinition.name} not found`);
    return null;
    */

    return pluginInstances;
  }

  static async runInTab(tabId, pluginInstance, site, resource) {
    const pluginName = pluginInstance.constructor.name;

    const pluginInfo = PluginManager.cache.get(pluginName);

    /*
      - load each class separately, some utility classes may have already been loaded by other already loaded modules
      if a class is already declared in the current tab, re-loading it fails with
      "Uncaught SyntaxError: Identifier 'ClassName' has already been declared at "
      but the other classes present in module will still load
      - use negative lookahead (?!) to match anyting starting with a class definition but not containing another class definition
     */
    const moduleClasses = pluginInfo.code.match(/(class \w+ {([\s\S](?!(class \w+ {)|export .*))+)/gm);
    for (let i = 0; i < moduleClasses.length; i += 1) {
      await ActiveTabHelper.executeScript(tabId, { code: moduleClasses[i] });
    }

    let result = {};
    try {
      const pluginDeff = `${pluginName}`;
      const pluginInstanceName = `inst${pluginName}`;

      // listen for incoming message
      const message = new Promise((resolve, reject) => {
        const listener = msg => {
            chrome.runtime.onMessage.removeListener(listener);
            if (msg.resolved) {
              resolve(msg.result);
            }
            else {
              reject(msg.err);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
      });

      // async run the plugin and sends the result as message once completed
      await ActiveTabHelper.executeScript(tabId, { code: `
        (async function() {
          try {
            // instantiate plugin instance
            const ${pluginInstanceName} = new ${pluginDeff}(${JSON.stringify(pluginInstance.opts)})

            // execute plugin
            let result = null;
            const isApplicable = ${pluginInstanceName}.test(${JSON.stringify(resource)});
            if (isApplicable) {
              result = await ${pluginInstanceName}.apply(${JSON.stringify(site)}, ${JSON.stringify(resource)});
            }

            // send the result back via messaging as the promise content will just be serialized to {}
            chrome.runtime.sendMessage({resolved: true, result});
          }
          catch(err) {
            chrome.runtime.sendMessage({resolved: false, err: JSON.stringify(err, Object.getOwnPropertyNames(err))});
          }
        })();
      `});

      result = await message;
    }
    catch(err) {
      Log.error(err);
      throw err;
    }

    return result;
  }

}

export default PluginManager;
