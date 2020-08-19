/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line camelcase
import child_process from 'child_process';

import pptr from 'puppeteer-core';
import webExt from 'web-ext';

import { stringify } from 'query-string';
import { Response, LaunchOptions } from 'puppeteer';
import { join } from 'path';
import BrowserHelper from './BrowserHelper';

export default class FirefoxHelper extends BrowserHelper {
  client: any; // @cliqz-oss/firefox-client

  async launchBrowser() {
    const CDPPort = 51402;
    const args = [
      `--remote-debugger=localhost:${CDPPort}`,
    ];

    await webExt.cmd.run(
      {
        sourceDir: this.extension.path,
        firefox: join(process.cwd(), './node_modules/puppeteer/.local-firefox/win64-80.0a1/firefox/firefox.exe'),
        firefoxProfile: join(process.cwd(), './test/resources/firefox/profile'),
        keepProfileChanges: true,
        pref:
          {
            'network.dns.forceResolve': 'localhost',
            'network.socket.forcePort': '443=8443;80=8080',
            'browser.tabs.remote.separateFileUriProcess': false,
            'security.sandbox.content.level': 0,
          },
        args,
      },
      {
        shouldExitProgram: false,
      },
    )
      .then(async context => {
        /*
        context.extensionRunners[0].reloadableExtensions is a Map<extPath, extId>
        but we can't use that as Firefox extension URL is based on "Internal UUID" not "Extension ID"
        use custom Firefox actors to retrieve the UUID from addon manifest url via the exposed Firefox client
        */
        this.client = context.extensionRunners[0].remoteFirefox.client;
      });


    // Needed because `webExt.cmd.run` returns before the DevTools agent starts running.
    // Alternative would be to wrap the call to pptr.connect() with some custom retry logic
    child_process.execSync('sleep 5');

    const browserURL = `http://localhost:${CDPPort}`;
    return pptr.connect({
      browserURL,
      product: 'firefox',
    });
  }

  async getExtensionId(): Promise<string> {
    const addons: any[] = await new Promise((resolve, reject) => {
      this.client.request('listAddons', (error, response) => {
        if (error) {
          reject(new Error(`Remote Firefox: listAddons() error: ${error}`));
        }
        else {
          resolve(response.addons);
        }
      });
    });

    const gsfAddon = addons.find(addon => addon.name === 'get-set, Fetch! web scraper');
    /*
    temporary addons urls are not constructed from extension id but internal UUID
    extract that from manifest url like
    moz-extension://db93ff3c-319d-4b40-a5eb-11b0c549fad0/manifest.json
    */
    const { manifestURL } = gsfAddon;
    const gsfId = /\/\/(.+)\//.exec(manifestURL)[1];

    return gsfId;
  }

  async goto(path: string): Promise<Response> {
    const queryParams = stringify({ redirectPath: path });

    /*
    workaround for
    https://github.com/puppeteer/puppeteer/issues/5504
    https://bugzilla.mozilla.org/show_bug.cgi?id=1634690

    Loading files via file:// is done in a sandbox, and as such causes a remoteness change.
    This definitely changes the browsing context id (similar when loading about:) pages.
    Note that a temporary browsing context is created first and immediately destroyed before the final one is created.
    https://bugzilla.mozilla.org/show_bug.cgi?id=1634695

    https://github.com/microsoft/playwright/pull/1110
    https://github.com/microsoft/playwright/pull/1110/commits/95beeb429b7de99de895cda410c185972969b08c
    */
    this.page.goto(`moz-extension://${this.extension.id}/admin/admin.html?${queryParams}`, this.gotoOpts);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
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
