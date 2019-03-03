import GsfProvider from './../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';
import AbstractModuleManager from './AbstractModuleManager';
import { BaseNamedEntity } from 'get-set-fetch';

const Log = Logger.getLogger('PluginManager');

interface IModuleInfo {
  module: any;
  code: string;
  url: string;
}

class PluginManager extends AbstractModuleManager {

  static cache: Map<string, IModuleInfo> = new Map();

  static get DEFAULT_PLUGINS(): string[] {
    return ['SelectResourcePlugin', 'ExtensionFetchPlugin', 'ExtractUrlPlugin', 'UpdateResourcePlugin', 'InsertResourcePlugin'];
  }

  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.Plugin.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.Plugin.getAll();
  }

  static instantiateModule(data): BaseNamedEntity {
    return new GsfProvider.Plugin({ name: data.name,  code: data.content });
  }

 static async discoverPlugins() {
  const plugins = await this.getModulesContent('background/plugins');
  await this.persistModules(plugins);
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

  static async instantiate(pluginDefinitions): Promise<any[]> {
    const pluginInstances = [];

    for (let i = 0; i < pluginDefinitions.length; i++) {
      const pluginDef = pluginDefinitions[i];
      Log.info(`Instantiating plugin ${pluginDef.name}`);

      if (!PluginManager.cache.get(pluginDef.name)) {
        const plugin = await GsfProvider.Plugin.get(pluginDef.name);
        const pluginBlob = new Blob([plugin.code], { type: 'text/javascript' });
        const pluginUrl = URL.createObjectURL(pluginBlob);
        const pluginModule = await import(pluginUrl);

        PluginManager.cache.set(
          pluginDef.name,
          {
            code: plugin.code,
            module: pluginModule,
            url: pluginUrl
          }
        );
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
            console.log(${pluginDeff});

            // instantiate plugin instance
            const ${pluginInstanceName} = new ${pluginDeff}(${JSON.stringify(pluginInstance.opts)})

            // execute plugin
            let result = null;
            const isApplicable = ${pluginInstanceName}.test(${JSON.stringify(resource)});
            if (isApplicable) {
              result = await ${pluginInstanceName}.apply(${JSON.stringify(site)}, ${JSON.stringify(resource)});
            }

            // send the result back via messaging as the promise content will just be serialized to {}
            console.log(result);
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
