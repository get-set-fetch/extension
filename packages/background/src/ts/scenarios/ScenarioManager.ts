import AbstractModuleManager from '../systemjs/AbstractModuleManager';
import GsfProvider from '../storage/GsfProvider';
import { BaseNamedEntity } from 'get-set-fetch';

export default class ScenarioManager extends AbstractModuleManager {
  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.Scenario.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.Scenario.getAll();
  }

  static instantiateModule(data): BaseNamedEntity {
    return new GsfProvider.Scenario({ name: data.name,  code: data.content });
  }

  static async discoverPlugins() {
    const scenarios = await this.getModulesContent('scenarios');
    await this.persistModules(scenarios);
  }
}