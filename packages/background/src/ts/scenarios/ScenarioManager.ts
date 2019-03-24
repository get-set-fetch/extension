import BaseModuleManager from '../plugins/BaseModuleManager';
import GsfProvider from '../storage/GsfProvider';
import { BaseNamedEntity } from 'get-set-fetch';
import { IScenario, IModuleDefinition, IModuleInfo } from 'get-set-fetch-extension-commons';
import PluginManager from '../plugins/PluginManager';
import Logger from '../logger/Logger';
import IdbPlugin from '../storage/IdbPlugin';
import IdbScenario from '../storage/IdbScenario';

const Log = Logger.getLogger('PluginManager');
export default class ScenarioManager extends BaseModuleManager {
  static cache: Map<string, IModuleInfo> = new Map();

  static persistScenarios(scenarios: IdbScenario[]) {
    return Promise.all(
      scenarios.map(async (scenario) => {
        const storedScenario = await GsfProvider.Scenario.get(scenario.name);
        if (!storedScenario) {
          Log.info(`Saving scenario ${scenario.name} to database`);
          await scenario.save();
          Log.info(`Saving scenario ${scenario.name} to database DONE`);
        }
      })
    );
  }

  static async discoverScenarios() {
    // store scenarios
    const scenarioDefinitions: IModuleDefinition[] = await this.getModulesContent('scenarios');
    const scenarios = scenarioDefinitions.map(scenarioDef => new GsfProvider.Scenario(scenarioDef));
    await this.persistScenarios(scenarios);

    // store plugins embedded with scenarios, using map instead of foreach to enforce await
    await Promise.all(
      scenarioDefinitions.map(async (scenarioDef) => {
        Log.info(`Checking ${scenarioDef.name} for embedded plugins`);
        const scenario = await GsfProvider.Scenario.get(scenarioDef.name);
        await ScenarioManager.register(scenarioDef.name);
        const embeddedPluginNames = Object.keys(ScenarioManager.cache.get(scenarioDef.name).module.embeddedPlugins);
        const embeddedPlugins = embeddedPluginNames.map(name => new GsfProvider.Plugin({
          scenarioId: scenario.id,
          name,
          code: null
        }));
        await PluginManager.persistPlugins(embeddedPlugins);
      })
    );
  }

  static async register(name: string) {
    // scenario already registered
    if (ScenarioManager.cache.get(name)) return;

    const scenario = await GsfProvider.Scenario.get(name);
    if (!scenario) {
      throw new Error(`could not register scenario ${name}`);
    }

    const scenarioBlob = new Blob([scenario.code], { type: 'text/javascript' });
    const scenarioUrl = URL.createObjectURL(scenarioBlob);
    const scenarioModule = await import(scenarioUrl);

    ScenarioManager.cache.set(
      name,
      {
        code: scenario.code,
        module: scenarioModule,
        url: scenarioUrl
      }
    );
  }

  static async instantiate(name: string): Promise<IScenario> {
    if (!ScenarioManager.cache.get(name)) {
      await ScenarioManager.register(name);
    }

    const classDef = ScenarioManager.cache.get(name).module.default;
    const scenarioInstance = new (classDef)() as IScenario;
    return scenarioInstance;
  }

  static async resolveEmbeddedPlugin(plugin: IdbPlugin) {
    if (!plugin.scenarioId) {
      throw new Error(`could not register scenario plugin ${plugin.name} without a scenarioId link`);
    }

    const scenario: IdbScenario = await IdbScenario.get(plugin.scenarioId);

    if (!ScenarioManager.cache.get(scenario.name)) {
      await ScenarioManager.register(scenario.name);
    }

    const embeddedPlugin = ScenarioManager.cache.get(scenario.name).module.embeddedPlugins[plugin.name];
    if (!embeddedPlugin) {
      throw new Error(`could not find embedded plugin ${plugin.name} on scenario ${scenario.name}`);
    }

    return {
      module: { default: embeddedPlugin },
      url: ScenarioManager.cache.get(scenario.name).url
    };
  }
}