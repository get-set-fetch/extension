const path = require('path');
const puppeteer = require('puppeteer');
const { assert } = require('chai');

const extension = {
  id: 'cpbaclenlbncmmagcfdlblmmppgmcjfg',
  path: path.resolve(__dirname, '..', '..', '..', 'dist'),
};

describe('Test Popup, ', () => {
  let browser = null;
  let page = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  before(async () => {
    // launch chrome
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
      ],
    });

    // open new page
    page = await browser.newPage();
  });

  it('Test Default Popup', async () => {
    // open extension popup
    await page.goto(`chrome-extension://${extension.id}/popup/popup.html`, gotoOpts);

    // detect links
    const ctx = await page.mainFrame().executionContext();
    const detectedlinks = await ctx.evaluate(() => {
      const links = [];
      const aElms = document.querySelectorAll('a');

      aElms.forEach((aElm) => {
        links.push({
          text: aElm.innerHTML,
          href: aElm.href,
        });
      });

      return links;
    });

    // check if links are rendered correctly
    const expectedLinks = [
      { text: 'New Project', href: `chrome-extension://${extension.id}/admin/admin.html?path=%2Fproject` },
      { text: 'Admin Area', href: `chrome-extension://${extension.id}/admin/admin.html` },
    ];
    assert.sameDeepMembers(detectedlinks, expectedLinks);
  });
});
