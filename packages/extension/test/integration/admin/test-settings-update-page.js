import queryString from 'query-string';
import BrowserHelper from '../../utils/BrowserHelper';

const { assert } = require('chai');

/* eslint-disable no-shadow, max-len */
describe('Settings Update Page', () => {
  let browser = null;
  let settingsPage = null;
  let settingsFrame = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  const queryParams = queryString.stringify({ redirectPath: '/settings' });


  before(async () => {
    browser = await BrowserHelper.launch();

    // open settings page
    settingsPage = await browser.newPage();
    settingsFrame = settingsPage.mainFrame();
    
    await BrowserHelper.waitForDBInitialization(settingsPage);
  });

  beforeEach(async () => {
    // load settings list
    await settingsPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
  })

  after(async () => {
    await browser.close();
  });

  it('Test Default Settings', async () => {
    // retrieve logLevel setting
    const logLevel = await settingsPage.evaluate(
      () => {
        const selectLogLevel = document.querySelector('select#logLevel');
        const selectedOption = selectLogLevel.options[selectLogLevel.selectedIndex];
        return {
          label: selectedOption.innerHTML,
          value: selectedOption.value
        }
      }
    );

    // compare
    const expectedLogLevel = {
      label: "WARNING",
      value: "3"
    }
    assert.deepEqual(logLevel, expectedLogLevel);
  });

  it('Test Update Settings', async () => {
    // change logLevel setting
    await settingsPage.waitFor('select#logLevel');
    await settingsPage.select('#logLevel', '0')

    // save
    await settingsPage.click('#save');

    // reload settings
    await settingsPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // retrieve logLevel setting
    await settingsPage.waitFor('select#logLevel');
    const logLevel = await settingsPage.evaluate(
      () => {
        const selectLogLevel = document.querySelector('select#logLevel');
        const selectedOption = selectLogLevel.options[selectLogLevel.selectedIndex];
        return {
          label: selectedOption.innerHTML,
          value: selectedOption.value
        }
      }
    );

    // compare
    const expectedLogLevel = {
      label: "TRACE",
      value: "0"
    }
    assert.deepEqual(logLevel, expectedLogLevel);
  });

});
