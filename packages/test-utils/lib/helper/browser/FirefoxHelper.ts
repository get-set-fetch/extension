import { stringify } from 'query-string';
import { Response, LaunchOptions } from 'puppeteer';
import { join } from 'path';
import BrowserHelper from './BrowserHelper';

export default class FirefoxHelper extends BrowserHelper {
  async getExtensionId(): Promise<string> {
    await this.page.goto('chrome://extensions/', this.gotoOpts);

    // eslint-disable-next-line max-len
    const devBtnHandle: any = await (this.page as any).evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode")');
    await devBtnHandle.click();

    // eslint-disable-next-line max-len
    const extIdDivHandle: any = await (this.page as any).evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("#items-list").shadowRoot.querySelector("extensions-item").shadowRoot.querySelector("#extension-id")');
    const rawExtId = await this.page.evaluate(div => div.textContent, extIdDivHandle);
    const extId = rawExtId.split(': ')[1];
    return extId;
  }

  goto(path: string): Promise<Response> {
    const queryParams = stringify({ redirectPath: path });
    return this.page.goto(`chrome-extension://${this.extension.id}/admin/admin.html?${queryParams}`, this.gotoOpts);
  }

  getLaunchOptions(): LaunchOptions {
    // about:support

    console.log(join(process.cwd(), './test/resources/firefox/znwg4dn7.CIProfile'));
    return {
      product: 'firefox',
      /*
      extraPrefsFirefox: {
        // Enable additional Firefox logging from its protocol implementation
        // 'remote.log.level': 'Trace',
      },
      */
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 20,
      args: [
        `--profile "${join(process.cwd(), './test/resources/firefox/znwg4dn7.CIProfile')}"`,
      ],
    };
  }
}
