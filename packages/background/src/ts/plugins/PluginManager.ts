import GsfProvider from './../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';
import AbstractModuleManager from './AbstractModuleManager';
import { BaseNamedEntity } from 'get-set-fetch';

const Log = Logger.getLogger('PluginManager');

// used for allowing external defined GSF_PLUGINS in systemjsFetch function
declare var GSF_PLUGINS;
class PluginManager extends AbstractModuleManager {

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

  static async injectSystemJS(tabId) {
    const systemJSPresent = await ActiveTabHelper.executeScript(
      tabId,
      { code: `System !== undefined` }
    );

    // SystemJS already injected in current tab, nothing to do
    if (systemJSPresent) return null;

    // inject systemjs
    await ActiveTabHelper.executeScript(tabId, { file: 'background/plugins/systemjs/system.js' });

    // inject systemjs custom fetch
    await ActiveTabHelper.executeScript(tabId, { file: 'background/plugins/systemjs/systemjs-fetch-plugin.ts' });

    // define module registry containing source code
    await ActiveTabHelper.executeScript(tabId, { code: 'let GSF_PLUGINS = {}' });

    // define custom fetch and hook it into systemjs
    const systemjsFetch = function() {
      System.constructor.prototype.fetch = (url) => {
        const pluginName = url;
        return new Promise((resolve) => {
          resolve(GSF_PLUGINS[pluginName]);
        });
      };
    };
    await ActiveTabHelper.executeScript(tabId, { code: `(${systemjsFetch.toString()}())` });
  }

  static async runInTab(tabId, plugin, site, resource) {
    await PluginManager.injectSystemJS(tabId);
    const pluginName = plugin.constructor.name;

    let result = {};
    try {
      const pluginDeff = `Cls${pluginName}`;
      const pluginInstanceName = `inst${pluginName}`;

      // define module content and import plugin
      const moduleContent: string = GsfProvider.Plugin.cache[pluginName];
      await ActiveTabHelper.executeScript(tabId, { code: `GSF_PLUGINS['${pluginName}']=String.raw\`${moduleContent}\`` });
      await ActiveTabHelper.executeScript(tabId, { code: `System.import('./${pluginName}', 'a')` });

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
            // get plugin class definition
            const ${pluginDeff} = System.get('${pluginName}').default;
            // console.log(GSF_PLUGINS['${pluginName}'])
            console.log(GSF_PLUGINS)
            // console.log(${pluginDeff});

            // instantiate plugin instance
            const ${pluginInstanceName} = new ${pluginDeff}(${JSON.stringify(plugin.opts)})

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
