// eslint-disable-next-line max-len
import { IModuleRuntime, IModuleStorage, BasePlugin, IPluginDefinition, IScenario, IPluginStorage, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import Logger from '../logger/Logger';
import GsfProvider from '../storage/GsfProvider';
import ActiveTabHelper from '../helpers/ActiveTabHelper';
import IdbScenario from '../storage/IdbScenario';

const Log = Logger.getLogger('ModuleRuntimeManager');

export default class ModuleRuntimeManager {
  static cache: Map<string, IModuleRuntime> = new Map();

  static async registerScenario(name: string) {
    // scenario already registered
    if (ModuleRuntimeManager.cache.get(name)) return;

    const scenario = await GsfProvider.Scenario.get(name);
    if (!scenario) {
      throw new Error(`could not register scenario ${name}`);
    }

    await ModuleRuntimeManager.register(scenario);
  }

  static async registerPlugin(name: string) {
    // plugin already registered
    if (ModuleRuntimeManager.cache.get(name)) return;

    const plugin = await GsfProvider.Plugin.get(name);
    if (!plugin) {
      throw new Error(`could not register plugin ${name}`);
    }

    await (plugin.scenarioId ? ModuleRuntimeManager.registerEmbeddedPlugin(plugin) : ModuleRuntimeManager.register(plugin));
  }

  static async register(moduleStorage: IModuleStorage) {
    const blob = new Blob([ moduleStorage.code ], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const mdl = await import(url);

    ModuleRuntimeManager.cache.set(
      moduleStorage.name,
      {
        code: moduleStorage.code,
        module: mdl,
        url,
      },
    );
  }

  static async registerEmbeddedPlugin(plugin: IPluginStorage) {
    const scenario: IdbScenario = await IdbScenario.get(plugin.scenarioId);

    if (!ModuleRuntimeManager.cache.get(scenario.name)) {
      await ModuleRuntimeManager.registerScenario(scenario.name);
    }

    const embeddedPlugin = ModuleRuntimeManager.cache.get(scenario.name).module.embeddedPlugins[plugin.name];
    if (!embeddedPlugin) {
      throw new Error(`could not find embedded plugin ${plugin.name} on scenario ${scenario.name}`);
    }

    ModuleRuntimeManager.cache.set(
      plugin.name,
      {
        code: scenario.code,
        module: { default: embeddedPlugin },
        url: ModuleRuntimeManager.cache.get(scenario.name).url,
      },
    );
  }

  static async instantiatePlugins(plugins: IPluginDefinition[]): Promise<BasePlugin[]> {
    return Promise.all(
      plugins.map(async plugin => ModuleRuntimeManager.instantiatePlugin(plugin.name, plugin.opts)),
    );
  }

  static async instantiatePlugin(name: string, opts: any = {}): Promise<BasePlugin> {
    Log.info(`Instantiating plugin ${name}`);

    if (!ModuleRuntimeManager.cache.get(name)) {
      await ModuleRuntimeManager.registerPlugin(name);
    }

    const ClassDef = ModuleRuntimeManager.cache.get(name).module.default;
    const pluginInstance = new (ClassDef)(opts);
    return pluginInstance;
  }

  static async getPluginSchemas(scenarioName: string): Promise<IEnhancedJSONSchema[]> {
    const scenario: IScenario = await ModuleRuntimeManager.instantiateScenario(scenarioName);
    return Promise.all(
      scenario.getPluginNames().map(async pluginName => {
        const plugin: BasePlugin = await ModuleRuntimeManager.instantiatePlugin(pluginName);
        return Object.assign(plugin.getOptsSchema(), { $id: pluginName });
      }),
    );
  }

  static async instantiateScenario(name: string): Promise<IScenario> {
    if (!ModuleRuntimeManager.cache.get(name)) {
      await ModuleRuntimeManager.registerScenario(name);
    }

    const ClassDef = ModuleRuntimeManager.cache.get(name).module.default;
    const scenarioInstance = new (ClassDef)() as IScenario;
    return scenarioInstance;
  }

  static async runInTab(tabId, pluginInstance, site, resource) {
    const pluginName = pluginInstance.constructor.name;
    const pluginInfo = ModuleRuntimeManager.cache.get(pluginName);

    const codeWithoutExport = pluginInfo.code.replace(/^export .+$/gm, '');
    Log.debug(`injecting in browser tab ${pluginName}: ${codeWithoutExport}`);

    let result = {};
    try {
      const pluginDef = `${pluginName}`;
      const pluginInstanceName = `inst${pluginName}`;

      // listen for incoming message
      const message = new Promise((resolve, reject) => {
        const listener = msg => {
          /*
          this is not a message sent via runInTab, ignore it,
          messages may also come from admin GsfClient, test utils CrawlHelper.waitForCrawlComplete
          */
          if (msg.resolved === undefined) return;

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
          (async function() {
            try {
              // instantiate plugin instance, one time only, multiple plugin invocations will retain the previous plugin state
              if (!window.${pluginInstanceName}) {
                ${codeWithoutExport}
                window.${pluginInstanceName} = new ${pluginDef}(${JSON.stringify(pluginInstance.opts)})
              }

              // execute plugin
              let result = null;
              const isApplicable = window.${pluginInstanceName}.test(${JSON.stringify(site)}, ${JSON.stringify(resource)});
              if (isApplicable) {
                result = await window.${pluginInstanceName}.apply(${JSON.stringify(site)}, ${JSON.stringify(resource)});
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
