import { HttpMethod, IPluginStorage, BasePlugin, IScenario } from 'get-set-fetch-extension-commons';
import GsfClient from '../../../components/GsfClient';

export default class PluginHelper {
  static async instantiate(scenario: IScenario, pluginName: string): Promise<BasePlugin> {
    // load scenario
    const pluginStorage: IPluginStorage = (await GsfClient.fetch(HttpMethod.GET, `plugin/${pluginName}`)) as IPluginStorage;

    /*
    // if (plugin)

    // code not available, this is an embedded plugin, retrieve it directly from scenario
      {if (!pluginStorage.code) {
      pluginStorage.code = scenario.getEmbeddedPlugins[pluginName];
    }}
    */

    // import as module
    const pluginBlob = new Blob([ pluginStorage.code ], { type: 'text/javascript' });
    const pluginUrl = URL.createObjectURL(pluginBlob);
    const pluginModule = await import(pluginUrl);

    // instantiate it
    const ClassDef = pluginModule.default;
    const plugin: BasePlugin = new (ClassDef)();
    return plugin;
  }
}
