import { assert } from 'chai';
import { resolve } from 'path';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';

describe('Test ThankYou Pages', () => {
  let browserHelper: BrowserHelper;

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath }, closeExtraPages: false });
    await browserHelper.launch();
  });

  after(async () => {
    await browserHelper.close();
  });

  it('install page', async () => {
    const tyPage = (await browserHelper.browser.pages()).find(page => /thank/.test(page.url()));
    assert.isDefined(tyPage);
    assert.equal(tyPage.url(), 'https://getsetfetch.org/extension/thank-you-install.html');
  });
});
