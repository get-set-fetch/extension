import { assert } from 'chai';
import { Page } from 'puppeteer';
import { LogLevel } from 'get-set-fetch-extension-commons';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';


describe('Logs Page', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const expectedEntries = [
    [ 'TRACE', 'cls0', 'TRACE message' ],
    [ 'DEBUG', 'cls1', 'DEBUG message' ],
    [ 'INFO', 'cls2', 'INFO message' ],
    [ 'WARN', 'cls3', 'WARN message' ],
    [ 'ERROR', 'cls4', 'ERROR message' ],
  ];

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
    // cast related to https://github.com/Microsoft/TypeScript/issues/7576
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load log list
    await browserHelper.goto('/scenarios');
    await browserHelper.waitFor('table.table-main');
  });

  afterEach(async () => {
    await page.evaluate(() => GsfClient.fetch('DELETE', 'logs'));
  });

  after(async () => {
    await browserHelper.close();
  });

  async function logAndRetrieveEntries() {
    // do logging on all levels
    const logLevels = [ 0, 1, 2, 3, 4 ];
    // eslint-disable-next-line no-restricted-syntax
    for (const logLevel of logLevels) {
      // eslint-disable-next-line
      await page.evaluate((logLevel, cls, msg) => GsfClient.log(logLevel, cls, msg), logLevel, `cls${logLevel}`, `${LogLevel[logLevel]} message`);
    }

    // reload log page
    await browserHelper.goto('/logs');
    await browserHelper.waitFor('table.table-main');

    // extract logs
    const logEntries = await page.evaluate(() => Array.from(document.querySelectorAll('tbody tr')).map(elm => [
      elm.querySelector('th').innerText,
      (elm.querySelector('td:nth-child(3)') as HTMLElement).innerText,
      (elm.querySelector('td:nth-child(4)') as HTMLElement).innerText,
    ]));

    return logEntries;
  }

  function logAndRetrieveEntriesIt(logLevel: LogLevel) {
    return it(`Test Log Filtering on ${LogLevel[logLevel]} level`, async () => {
      await page.evaluate(logLevel => GsfClient.fetch('PUT', 'setting', { key: 'logLevel', val: logLevel }), logLevel);
      const storedFilteredEntries = await logAndRetrieveEntries();
      const expectedFilteredEntries = expectedEntries.filter(logEntry => LogLevel[logEntry[0]] >= logLevel);

      assert.sameDeepOrderedMembers(expectedFilteredEntries, storedFilteredEntries);
    });
  }

  const logLevels = [ 0, 1, 2, 3, 4 ];
  // eslint-disable-next-line no-restricted-syntax
  for (const logLevel of logLevels) {
    logAndRetrieveEntriesIt(logLevel);
  }
});
