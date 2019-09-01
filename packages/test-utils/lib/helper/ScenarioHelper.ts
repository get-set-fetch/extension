import { stringify } from 'query-string';
import BrowserHelper from './BrowserHelper';

export default class ScenarioHelper {
  static async installScenario(browserHelper: BrowserHelper, scenarioName: string) {
    const { page } = browserHelper;
    // load scenario list
    const queryParams = stringify({ redirectPath: '/scenarios' });
    await page.goto(`chrome-extension://${browserHelper.extension.id}/admin/admin.html?${queryParams}`, browserHelper.gotoOpts);

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
    const queryParams = stringify({ redirectPath: '/scenarios' });
    await page.goto(`chrome-extension://${browserHelper.extension.id}/admin/admin.html?${queryParams}`, browserHelper.gotoOpts);

    // wait for main table to render
    await page.waitFor('table.table-main');

    // uninstall scenario
    await page.waitFor(`#uninstall-${scenarioName}`);
    await page.click(`#uninstall-${scenarioName}`);
    await page.waitFor(`#install-${scenarioName}`);
  }
}
