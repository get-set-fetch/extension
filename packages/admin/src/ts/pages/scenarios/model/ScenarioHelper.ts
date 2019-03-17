import { HttpMethod, IScenario, IScenarioDefinition } from 'get-set-fetch-extension-commons';
import GsfClient from '../../../components/GsfClient';

export default class ScenarioHelper {
  static async instantiate(scenarioId: string): Promise<IScenario> {
    // load scenario
    const scenarioDef: IScenarioDefinition = (await GsfClient.fetch(HttpMethod.GET, `scenario/${scenarioId}`)) as IScenarioDefinition;

    // import as module
    const scenarioBlob = new Blob([scenarioDef.code], { type: 'text/javascript' });
    const scenarioUrl = URL.createObjectURL(scenarioBlob);
    const scenarioModule = await import(scenarioUrl);

    // instantiate it
    const classDef = scenarioModule.default;
    const scenario: IScenario = new (classDef)();
    return scenario;
  }
}