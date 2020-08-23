import { assert } from 'chai';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';

describe('Install', () => {
  let browserHelper: BrowserHelper;

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
  });

  after(async () => {
    await browserHelper.close();
  });

  it('ThankYou Page', async () => {
    const tyPage = (await browserHelper.browser.pages()).find(page => /thank/.test(page.url()));
    assert.isDefined(tyPage);
    assert.equal(tyPage.url(), 'https://getsetfetch.org/thank-you-install.html');
  });
});
