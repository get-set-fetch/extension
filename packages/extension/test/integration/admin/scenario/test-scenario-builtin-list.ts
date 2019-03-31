import queryString from 'query-string';
import { assert } from 'chai';
import { NavigationOptions } from 'puppeteer';
import BrowserHelper from '../../../utils/BrowserHelper';

/* eslint-disable no-shadow, max-len */
describe('Scenario Builtin List', () => {
  let browser = null;
  let scenarioPage = null;

  const gotoOpts: NavigationOptions = {
    timeout: 10 * 1000,
    waitUntil: ['load']
  };

  const queryParams = queryString.stringify({ redirectPath: '/scenarios' });

  const expectedScenario = {
    name: 'ExtractResources',
    url: 'http://siteA.com'
  };

  before(async () => {
    browser = await BrowserHelper.launch();
    scenarioPage = await browser.newPage();

    await BrowserHelper.waitForDBInitialization(scenarioPage);
  });

  beforeEach(async () => {
    // load scenario list
    await scenarioPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
  });

  after(async () => {
    // await browser.close();
  });

  it('Test Scenario Builtin List', async () => {
    // wait for main table to render
    await scenarioPage.waitFor('table.table-main');

    // check builtin scenarios presence in scenario list
    const expectedScenarios = [
      {
        name: 'get-set-fetch-scenario-extract-resources',
        description: 'Extract Resources scenario is used for extracting various resources from the corresponding sites.',
        homepage: 'https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/extract-resources'
      },
      {
        name: 'extract-html-headings',
        description: 'Extract Html Headings description',
        homepage: 'https://github.com/authora/extract-html-headings'
      }
    ];

    const actualScenarios = await scenarioPage.evaluate(() => {
      return Array.from(document.querySelectorAll('table.table-main tbody tr')).map(
        (row) => ({
          name: (row.children[0] as HTMLTableCellElement).innerText,
          description: (row.children[1] as HTMLTableCellElement).innerText,
          homepage: (row.children[2] as HTMLTableCellElement).innerText
        })
      );
    });

    assert.sameDeepMembers(actualScenarios, expectedScenarios);
  });

});