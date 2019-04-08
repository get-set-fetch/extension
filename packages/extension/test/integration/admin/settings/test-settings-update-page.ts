import { assert } from 'chai';
import BrowserHelper from '../../../helpers/BrowserHelper';
import { Page } from 'puppeteer';

describe('Settings Update Page', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  before(async () => {
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;
  });

  beforeEach(async () => {
    // load settings list
    await browserHelper.goto('/settings');
    await page.waitFor('select#logLevel');
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Default Settings', async () => {
    // retrieve logLevel setting
    const logLevel = await page.evaluate(
      () => {
        const selectLogLevel: HTMLSelectElement = document.querySelector('select#logLevel');
        const selectedOption = selectLogLevel.options[selectLogLevel.selectedIndex];
        return {
          label: selectedOption.innerHTML,
          value: selectedOption.value
        };
      }
    );

    // compare
    const expectedLogLevel = {
      label: 'WARNING',
      value: '3'
    };
    assert.deepEqual(logLevel, expectedLogLevel);
  });

  it('Test Update Settings', async () => {
    // change logLevel setting
    await page.select('#logLevel', '0');

    // save
    await page.click('#save');

    // reload settings
    await browserHelper.goto('/settings');

    // retrieve logLevel setting
    await page.waitFor('select#logLevel');
    const logLevel = await page.evaluate(
      () => {
        const selectLogLevel: HTMLSelectElement = document.querySelector('select#logLevel');
        const selectedOption = selectLogLevel.options[selectLogLevel.selectedIndex];
        return {
          label: selectedOption.innerHTML,
          value: selectedOption.value
        };
      }
    );

    // compare
    const expectedLogLevel = {
      label: 'TRACE',
      value: '0'
    };
    assert.deepEqual(logLevel, expectedLogLevel);
  });

});
