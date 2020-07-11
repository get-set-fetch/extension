/* eslint-disable no-param-reassign */
import { assert } from 'chai';
import { Page } from 'puppeteer';
import { resolve } from 'path';
import { LogLevel, ILog } from 'get-set-fetch-extension-commons';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';

describe('Storage', () => {
  let browserHelper: BrowserHelper;
  let page: Page;
  const targetDir = resolve(process.cwd(), 'test', 'tmp');

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    // cast related to https://github.com/Microsoft/TypeScript/issues/7576
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    await browserHelper.goto('/scenarios');
    await browserHelper.waitFor('table.table-main');
  });

  afterEach(async () => {
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));
  });

  after(async () => {
    // await browserHelper.close();
  });

  it('Clear > Populate > Export > Clear > Import Logs', async () => {
    // 0. Clear
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));

    // 1. Populate
    // do logging on WARN and higher, levels recorded by default settings
    const logLevels = [ 3, 4 ];
    // eslint-disable-next-line no-restricted-syntax
    for (const logLevel of logLevels) {
      // eslint-disable-next-line
      await page.evaluate((logLevel, cls, msg) => GsfClient.log(logLevel, cls, msg), logLevel, `cls${logLevel}`, `${LogLevel[logLevel]} message`);
    }

    // 2. Export
    // open settings page
    await browserHelper.goto('/settings');

    // check logs and initiate download
    const exportLink = 'a#export';
    await page.waitFor(exportLink);

    await page.click('#Logs');
    await page.click(exportLink);

    // wait a bit for file to be generated and saved
    await new Promise(res => setTimeout(res, 5000));

    // 3. Get expected values and clear
    const expectedLogs: ILog[] = await page.evaluate(() => GsfClient.fetch('GET', 'logs'));
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));

    // check entries have been deleted, p.no-entries only appears when store is empty
    await browserHelper.goto('/logs');
    await browserHelper.waitFor('p#no-entries');

    // 4. Import
    // open settings page
    await browserHelper.goto('/settings');

    // upload data to be imported
    const [ fileChooser ] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#importLabel'), // some button that triggers file selection
    ]);
    await fileChooser.accept([ resolve(targetDir, 'gsf-export.json') ]);

    // wait for file to be imported
    await browserHelper.waitFor('p#success', 5000);

    // compare logs
    const importedLogs: ILog[] = await page.evaluate(() => GsfClient.fetch('GET', 'logs'));
    assert.sameDeepMembers(importedLogs, expectedLogs);
  });
});
