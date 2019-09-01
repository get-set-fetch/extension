import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';


describe('Test Extension Popup', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Admin Links', async () => {
    // open extension popup
    await page.goto(`chrome-extension://${browserHelper.extension.id}/popup/popup.html`, browserHelper.gotoOpts);

    // detect links
    const ctx = await page.mainFrame().executionContext();
    const detectedlinks = await ctx.evaluate(() => {
      const links = [];
      const aElms = document.querySelectorAll('a');

      aElms.forEach(aElm => {
        links.push({
          text: aElm.innerHTML,
          href: aElm.href,
        });
      });

      return links;
    });

    // check if links are rendered correctly
    const expectedLinks = [
      { text: 'New Site', href: `chrome-extension://${browserHelper.extension.id}/popup/popup.html#` },
      { text: 'Admin Area', href: `chrome-extension://${browserHelper.extension.id}/admin/admin.html` },
    ];
    assert.sameDeepMembers(detectedlinks, expectedLinks);
  });
});
