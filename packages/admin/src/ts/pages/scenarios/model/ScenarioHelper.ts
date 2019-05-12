import { HttpMethod, IScenario } from 'get-set-fetch-extension-commons';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';
import GsfClient from '../../../components/GsfClient';

export default class ScenarioHelper {
  static async instantiate(scenarioId: number): Promise<IScenario> {
    // load scenario
    const scenarioPkg: IScenarioPackage = (await GsfClient.fetch(HttpMethod.GET, `scenario/${scenarioId}`)) as IScenarioPackage;

    // import as module
    const scenarioBlob = new Blob([ scenarioPkg.code ], { type: 'text/javascript' });
    const scenarioUrl = URL.createObjectURL(scenarioBlob);
    const scenarioModule = await import(scenarioUrl);

    // instantiate it
    const ClassDef = scenarioModule.default;
    const scenario: IScenario = new (ClassDef)();
    return scenario;
  }
}
