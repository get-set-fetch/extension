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

  static async instantiatePlugins(pluginsDefs: IPluginDefinition[]): Promise<BasePlugin[]> {
    return Promise.all(
      pluginsDefs.map(async pluginsDef => ModuleRuntimeManager.instantiatePlugin(pluginsDef.name, pluginsDef.opts)),
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

  static async runPluginInDom(tabId, pluginInstance, site, resource) {
    const pluginName = pluginInstance.constructor.name;
    const pluginInfo = ModuleRuntimeManager.cache.get(pluginName);

    const codeWithoutExport = pluginInfo.code.replace(/^export .+$/gm, '');
    Log.debug(`injecting in browser tab ${pluginName}`);

    const pluginDef = `${pluginName}`;
    const pluginInstanceName = `inst${pluginName}`;

    /*
      async run the plugin and sends the result as message once completed
      use a block declaration in order not to polute the global namespace
      avoiding conflicts, thus redeclaration errors
      */
    const code = `
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
            (globalThis.browser || globalThis.chrome).runtime.sendMessage({resolved: true, result});
          }
          catch(err) {
            (globalThis.browser || globalThis.chrome).runtime.sendMessage({resolved: false, err: JSON.stringify(err, Object.getOwnPropertyNames(err))});
          }
        })();
      }
    `;

    return ActiveTabHelper.executeAsyncScript(tabId, code, Log);
  }
}
