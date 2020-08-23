/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line camelcase
import child_process from 'child_process';
import pptr from 'puppeteer-core';
import webExt from 'web-ext';

import { stringify } from 'query-string';
import { LaunchOptions, Browser } from 'puppeteer';
import { join } from 'path';
import BrowserHelper from './BrowserHelper';

export default class FirefoxHelper extends BrowserHelper {
  client; // @cliqz-oss/firefox-client
  gotoInvoked: boolean = false;

  async launchBrowser():Promise<Browser> {
    const CDPPort = 51402;
    const args = [
      `--remote-debugger=localhost:${CDPPort}`,
    ];

    await webExt.cmd.run(
      {
        sourceDir: this.extension.path,
        firefox: join(process.cwd(), './node_modules/puppeteer/.local-firefox/win64-81.0a1/firefox/firefox.exe'),
        firefoxProfile: join(process.cwd(), './test/resources/firefox/profile'),
        keepProfileChanges: true,
        pref:
          {
            // proxy for all domains used in tests
            'network.dns.forceResolve': 'localhost',
            'network.socket.forcePort': '443=8443;80=8080',

            // download to last used folder
            'browser.download.folderList': 2,

            // download folder, if path.sep === '\\' escape it again as it's parsed again upstream
            'browser.download.dir': join(process.cwd(), 'test', 'tmp').replace(/\\/g, '\\\\'),

            /*
            following flags appear not to be needed
            "browser.download.defaultFolder": join(process.cwd(), 'test', 'tmp'),
            "browser.download.downloadDir": join(process.cwd(), 'test', 'tmp'),
            "browser.download.lastDir": join(process.cwd(), 'test', 'tmp'),
            */

            // don't prompt for download
            'browser.download.manager.showWhenStarting': false,
            'browser.helperApps.alwaysAsk.force': false,
            'browser.helperApps.neverAsk.saveToDisk': 'application/zip,text/csv',
            'browser.download.manager.focusWhenStarting': false,
            'browser.download.manager.useWindow': false,
            'browser.download.manager.showAlertOnComplete': false,

            // disable updates
            'app.update.enabled': false,
            'app.update.checkInstallTime': false,
            'app.update.disabledForTesting': true,
            'app.update.auto': false,
            'app.update.mode': 0,
            'app.update.service.enabled': false,
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
    const browser = await pptr.connect({
      browserURL,
      product: 'firefox',
    });
    return browser;
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

  async goto(path: string) {
    const queryParams = stringify({ redirectPath: path });

    /*
    loading resources via file://, about: , moz-extension:// is done in a sandbox
    a temporary browsing context is created first and immediately destroyed before the final one is created

    see open issues:
    firefox : https://bugzilla.mozilla.org/show_bug.cgi?id=1634695
    puppeteer: https://github.com/puppeteer/puppeteer/issues/5504

    see related (not solving the problem) closed issues:
    playwright: https://github.com/microsoft/playwright/issues/822

    the next goto navigation from _blank to moz-extension:// never completes looking like the remote agent
    lost the connection

    the workaround is to re-connect puppeteer when the browser tab has the moz-extension:// page opened
    only needed to be done on the 1st time moz-extension:// loads
    */
    if (!this.gotoInvoked) {
      this.gotoInvoked = true;

      try {
        // switch to extension page, goto never receives any event for it
        await this.page.goto(
          `moz-extension://${this.extension.id}/admin/admin.html?${queryParams}`,
          {
            timeout: 100,
          },
        );
      }
      catch (err) {
        // eslint-disable-next-line no-console
        console.log(`timeout on temporary browsing context, this is normal, ${JSON.stringify(err)}`);
      }

      // make sure the extension page has loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // re-connect puppeteer
      await this.browser.disconnect();
      this.browser = await pptr.connect({
        browserURL: `http://localhost:${51402}`,
        product: 'firefox',
      });

      [ this.page ] = await this.browser.pages();

      return null;
    }

    return this.page.goto(`moz-extension://${this.extension.id}/admin/admin.html?${queryParams}`, this.gotoOpts);
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

  /*
  puppeteer ff can't open CDPSession invoking Page.setDownloadBehavior
  downloads folder is set via preferences using web-ext when launching
  nothing to do
  */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async setDownloadBehavior():Promise<void> {
  }
}
