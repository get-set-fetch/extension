import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper, ScenarioHelper } from 'get-set-fetch-extension-test-utils';

describe('Scenario List', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load scenario list
    await browserHelper.goto('/scenarios');
  });

  after(async () => {
    await browserHelper.close();
  });

  function getTableScenarios() {
    return page.evaluate(() => Array.from(document.querySelectorAll('table.table-main tbody tr')).map(
      row => ({
        name: (row.children[0] as HTMLTableCellElement).innerText,
        description: (row.children[1] as HTMLTableCellElement).innerText,
        homepage: (row.children[2] as HTMLTableCellElement).innerText,
        status: (row.children[3] as HTMLTableCellElement).innerText,
      }),
    ));
  }

  it('Test Scenario Builtin List', async () => {
    // wait for main table to render
    await page.waitFor('table.table-main');

    // check builtin scenarios presence in scenario list
    const expectedScenarios = [
      {
        description: 'extracts text and binary content from dynamic (javascript) pages based on CSS selectors',
        homepage: 'https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/scrape-dynamic-content',
        name: 'get-set-fetch-scenario-scrape-dynamic-content',
        status: 'Built-in',
      },
      {
        name: 'get-set-fetch-scenario-scrape-static-content',
        description: 'extracts text and binary content from static html pages based on CSS selectors',
        homepage: 'https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/scrape-static-content',
        status: 'Built-in',
      },
      {
        name: 'extract-html-headings',
        description: 'Extract Html Headings description',
        homepage: 'https://github.com/authora/extract-html-headings',
        status: 'Available',
      },
    ];

    const actualScenarios = await getTableScenarios();
    assert.sameDeepMembers(actualScenarios, expectedScenarios);
  });

  it('Test Install / Uninstall Scenario', async () => {
    // wait for main table to render
    await page.waitFor('table.table-main');

    // as single install button should be present
    const installBtnCount = await page.$$eval('input[type=button]', buttons => buttons.length);
    assert.strictEqual(installBtnCount, 1);

    // install extract-html-headings scenario
    await ScenarioHelper.installScenario(browserHelper, 'extract-html-headings');

    // check new scenario status
    let expectedScenario = {
      name: 'extract-html-headings',
      description: 'Extract Html Headings description',
      homepage: 'https://github.com/authora/extract-html-headings',
      status: 'Installed',
    };

    let actualScenarios = await getTableScenarios();
    assert.deepInclude(actualScenarios, expectedScenario);

    // uninstall extract-html-headings scenario
    await ScenarioHelper.uninstallScenario(browserHelper, 'extract-html-headings');

    // check new scenario status
    expectedScenario = {
      name: 'extract-html-headings',
      description: 'Extract Html Headings description',
      homepage: 'https://github.com/authora/extract-html-headings',
      status: 'Available',
    };

    actualScenarios = await getTableScenarios();
    assert.deepInclude(actualScenarios, expectedScenario);
  });
});
