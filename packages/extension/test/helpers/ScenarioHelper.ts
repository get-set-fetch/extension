import queryString from 'query-string';
import { Page } from 'puppeteer';
import BrowserHelper from './BrowserHelper';

export default class ScenarioHelper {

  static async installScenario(page: Page, scenarioName: string) {
    // load scenario list
    const queryParams = queryString.stringify({ redirectPath: '/scenarios' });
    await page.goto(`chrome-extension://${BrowserHelper.extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);

    // wait for main table to render
    await page.waitFor('table.table-main');

    // install scenario
    await page.waitFor(`#install-${scenarioName}`);
    await page.click(`#install-${scenarioName}`);
    await page.waitFor(`#uninstall-${scenarioName}`);
  }

  static async uninstallScenario(page: Page, scenarioName: string) {
    // load scenario list
    const queryParams = queryString.stringify({ redirectPath: '/scenarios' });
    await page.goto(`chrome-extension://${BrowserHelper.extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);

    // wait for main table to render
    await page.waitFor('table.table-main');

    // uninstall scenario
    await page.waitFor(`#uninstall-${scenarioName}`);
    await page.click(`#uninstall-${scenarioName}`);
    await page.waitFor(`#install-${scenarioName}`);
  }

}