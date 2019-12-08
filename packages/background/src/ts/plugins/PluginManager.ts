import { IModuleInfo, IPlugin } from 'get-set-fetch-extension-commons';
import GsfProvider from '../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';
import BaseModuleManager from './BaseModuleManager';
import ScenarioManager from '../scenarios/ScenarioManager';
import IdbPlugin from '../storage/IdbPlugin';

const Log = Logger.getLogger('PluginManager');

class PluginManager extends BaseModuleManager {
  static cache: Map<string, IModuleInfo> = new Map();

  static get DEFAULT_PLUGINS(): string[] {
    return [ 'SelectResourcePlugin', 'FetchPlugin', 'ExtractUrlsPlugin', 'LazyLoadPlugin', 'UpdateResourcePlugin', 'InsertResourcesPlugin' ];
  }

  static persistPlugins(plugins: IdbPlugin[]) {
    return Promise.all(
      plugins.map(async plugin => {
        const storedPlugin = await GsfProvider.Plugin.get(plugin.name);
        if (!storedPlugin) {
          Log.info(`Saving plugin ${plugin.name} to database`);
          await plugin.save();
          Log.info(`Saving plugin ${plugin.name} to database DONE`);
        }
      }),
    );
  }

  static async discoverLocalPlugins() {
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

    return pluginKeys.map(pluginKey => {
      const ClassDef = PluginManager.cache.get(pluginKey).module.default;

      const pluginInstance = new (ClassDef)();

      // for each plugin, based on its instance, return its name and default options
      return {
        name: pluginInstance.constructor.name,
        opts: pluginInstance.opts || {},
        schema: pluginInstance.OPTS_SCHEMA,
      };
    });
  }

  static async register(name: string) {
    // scenario already registered
    if (PluginManager.cache.get(name)) return;

    const plugin = await GsfProvider.Plugin.get(name);
    if (!plugin) {
      Log.error(`could not find plugin ${name}`);
      throw new Error(`could not find plugin ${name}`);
    }

    // builtin plugin, not linked to a scenario
    let moduleInfo: IModuleInfo;
    if (!plugin.scenarioId) {
      const pluginBlob = new Blob([ plugin.code ], { type: 'text/javascript' });
      const pluginUrl = URL.createObjectURL(pluginBlob);
      const pluginModule = await import(pluginUrl);

      moduleInfo = {
        code: plugin.code,
        module: pluginModule,
        url: pluginUrl,
      };
    }
    // plugin linked to a scenario
    else {
      moduleInfo = await ScenarioManager.resolveEmbeddedPlugin(plugin);
    }

    PluginManager.cache.set(name, moduleInfo);
  }

  static async instantiate(pluginDefinitions): Promise<IPlugin[]> {
    return Promise.all(
      pluginDefinitions.map(async pluginDef => {
        Log.info(`Instantiating plugin ${pluginDef.name}`);

        if (!PluginManager.cache.get(pluginDef.name)) {
          await PluginManager.register(pluginDef.name);
        }

        const ClassDef = PluginManager.cache.get(pluginDef.name).module.default;
        const pluginInstance = new (ClassDef)(pluginDef.opts);

        return pluginInstance;
      }),
    );

    /*
    to do: handle missing plugin definitions
    // could not found corresponding plugin definition
    Log.warn(`pluginDefinition for ${pluginDefinition.name} not found`);
    return null;
    */
  }

  static async runInTab(tabId, pluginInstance, site, resource) {
    const pluginName = pluginInstance.constructor.name;
    const pluginInfo = PluginManager.cache.get(pluginName);

    const codeWithoutExport = pluginInfo.code.replace(/^export .+$/gm, '');
    Log.debug(`injecting in browser tab: ${codeWithoutExport}`);

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

      /*
      async run the plugin and sends the result as message once completed
      use a block declaration in order not to polute the global namespace
      avoiding conflicts, thus redeclaration errors
      */
      await ActiveTabHelper.executeScript(tabId, { code: `
        {
          ${codeWithoutExport}

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
        }
      ` });

      result = await message;
    }
    catch (err) {
      Log.error(err);
      throw err;
    }

    return result;
  }
}

export default PluginManager;
