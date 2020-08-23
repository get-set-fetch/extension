import { stringify } from 'query-string';
import BrowserHelper from './browser/BrowserHelper';

export default class ScenarioHelper {
  static async installScenario(browserHelper: BrowserHelper, scenarioName: string) {
    const { page } = browserHelper;
    // load scenario list
    await browserHelper.goto('/scenarios');

    // wait for main table to render
    await page.waitFor('table.table-main');

    // install scenario
    await page.waitFor(`#install-${scenarioName}`);
    await page.click(`#install-${scenarioName}`);
    await page.waitFor(`#uninstall-${scenarioName}`);
  }

  static async uninstallScenario(browserHelper: BrowserHelper, scenarioName: string) {
    const { page } = browserHelper;
    // load scenario list
    await browserHelper.goto('/scenarios');

    // wait for main table to render
    await page.waitFor('table.table-main');

    // uninstall scenario
    await page.waitFor(`#uninstall-${scenarioName}`);
    await page.click(`#uninstall-${scenarioName}`);
    await page.waitFor(`#install-${scenarioName}`);
  }
}
