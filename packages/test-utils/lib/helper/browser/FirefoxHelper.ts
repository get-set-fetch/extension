/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable import/no-extraneous-dependencies */
import child_process from 'child_process';
import pptr from 'puppeteer-core';
import webExt from 'web-ext';

import { stringify } from 'query-string';
import { Response, LaunchOptions } from 'puppeteer';
import { join } from 'path';
import BrowserHelper from './BrowserHelper';

export default class FirefoxHelper extends BrowserHelper {
  async launch() {
    const CDPPort = 51402;
    const args = [
      `--remote-debugger=localhost:${CDPPort}`,
    ];

    await webExt.cmd.run(
      {
        sourceDir: this.extension.path,
        firefox: join(process.cwd(), './node_modules/puppeteer/.local-firefox/win64-80.0a1/firefox/firefox.exe'),
        firefoxProfile: join(process.cwd(), './test/resources/firefox/profile'),
        args,
      },
      {
        shouldExitProgram: false,
      },
    );

    // Needed because `webExt.cmd.run` returns before the DevTools agent starts running.
    // Alternative would be to wrap the call to pptr.connect() with some custom retry logic
    child_process.execSync('sleep 5');

    const browserURL = `http://localhost:${CDPPort}`;
    this.browser = await pptr.connect({
      browserURL,
    });
  }

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
    return {
      product: 'firefox',
      executablePath: join(process.cwd(), './node_modules/puppeteer/.local-firefox/win64-80.0a1/firefox/firefox.exe'),

      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 20,
      args: [
        '-wait-for-browser',
      ],
      userDataDir: join(process.cwd(), './test/resources/firefox/profile'),
    };
  }
}
