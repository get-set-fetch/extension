import { assert } from 'chai';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';

describe('Test ThankYou Pages', () => {
  let browserHelper: BrowserHelper;

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
  });

  after(async () => {
    await browserHelper.close();
  });

  it('install page', async () => {
    const tyPage = (await browserHelper.browser.pages()).find(page => /thank/.test(page.url()));
    assert.isDefined(tyPage);
    assert.equal(tyPage.url(), 'https://getsetfetch.org/thank-you-install.html');
  });
});
