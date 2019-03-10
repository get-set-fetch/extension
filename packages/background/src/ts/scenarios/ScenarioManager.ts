import AbstractModuleManager, { IModuleInfo } from '../plugins/AbstractModuleManager';
import GsfProvider from '../storage/GsfProvider';
import { BaseNamedEntity } from 'get-set-fetch';

export default class ScenarioManager extends AbstractModuleManager {
  static cache: Map<string, IModuleInfo> = new Map();

  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.Scenario.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.Scenario.getAll();
  }

  static createEntity(data): BaseNamedEntity {
    return new GsfProvider.Scenario({ name: data.name,  code: data.content });
  }

  static async discoverPlugins() {
    const scenarios = await this.getModulesContent('scenarios');
    await this.persistModules(scenarios);
  }

  static async instantiate(scenarioId: string) {
    if (!ScenarioManager.cache.get(scenarioId)) {
      const scenario = await GsfProvider.Scenario.get(scenarioId);
      const scenarioBlob = new Blob([scenario.code], { type: 'text/javascript' });
      const scenarioUrl = URL.createObjectURL(scenarioBlob);
      const scenarioModule = await import(scenarioUrl);

      ScenarioManager.cache.set(
        scenarioId,
        {
          code: scenario.code,
          module: scenarioModule,
          url: scenarioUrl
        }
      );
    }

    const classDef = ScenarioManager.cache.get(scenarioId).module.default;
    const scenarioInstance = new (classDef)();
  }
}