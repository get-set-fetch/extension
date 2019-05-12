import { assert } from 'chai';
import BrowserHelper from '../../helpers/BrowserHelper';

describe('Test ThankYou Pages', () => {
  let browserHelper: BrowserHelper;

  before(async () => {
    browserHelper = await BrowserHelper.launch(false);
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
