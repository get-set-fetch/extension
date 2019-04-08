import { assert } from 'chai';
import BrowserHelper from '../../helpers/BrowserHelper';
import { Page } from 'puppeteer';

describe('Test Extension Popup, ', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  before(async () => {
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Admin Links', async () => {
    // open extension popup
    await page.goto(`chrome-extension://${extension.id}/popup/popup.html`, BrowserHelper.gotoOpts);

    // detect links
    const ctx = await page.mainFrame().executionContext();
    const detectedlinks = await ctx.evaluate(() => {
      const links = [];
      const aElms = document.querySelectorAll('a');

      aElms.forEach((aElm) => {
        links.push({
          text: aElm.innerHTML,
          href: aElm.href
        });
      });

      return links;
    });

    // check if links are rendered correctly
    const expectedLinks = [
      { text: 'New Site', href: `chrome-extension://${extension.id}/popup/popup.html#` },
      { text: 'Admin Area', href: `chrome-extension://${extension.id}/admin/admin.html` }
    ];
    assert.sameDeepMembers(detectedlinks, expectedLinks);
  });
});
