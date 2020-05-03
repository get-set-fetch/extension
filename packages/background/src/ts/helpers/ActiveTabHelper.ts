import Logger from '../logger/Logger';

const Log = Logger.getLogger('IdbSite');

export default class ActiveTabHelper {
  static async executeAsyncScript(tabId: number, code, Log = null) {
    let result = {};

    try {
      // listen for incoming message
      const message = new Promise((resolve, reject) => {
        const listener = msg => {
          /*
          this is not a message sent via runInDom, ignore it,
          messages may also come from admin GsfClient, test utils CrawlHelper.waitForCrawlComplete
          */
          if (msg.resolved === undefined) return;

          chrome.runtime.onMessage.removeListener(listener);
          if (msg.resolved) {
            resolve(msg.result);
          }
          else {
            reject(msg.err);
          }
        };
        chrome.runtime.onMessage.addListener(listener);
      });

      await ActiveTabHelper.executeScript(tabId, { code });

      result = await message;
    }
    catch (err) {
      if (Log) Log.error(err);
      throw err;
    }

    return result;
  }

  static executeScript<T = any>(tabId: number, details): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.executeScript(
        tabId,
        details,
        result => {
          if (result) {
            resolve(result[0]);
          }
          else {
            reject(chrome.runtime.lastError);
          }
        },
      );
    });
  }

  static create(createProperties = {}, onRemoved: () => void = () => {}): Promise<chrome.tabs.Tab> {
    return new Promise(resolve => {
      chrome.tabs.create(
        createProperties || {},
        tab => {
          Log.info(`scrape tab ${tab.id} created`);
          // invalidate site.tabIds for all project sites, scrape will stop as there's no opened tab for it
          const onRemovedListener = tabId => {
            // only react to the opened scraping tab
            if (tabId === tab.id) {
              Log.info(`removing scrape tab ${tabId}`);
              chrome.runtime.onMessage.removeListener(onRemovedListener);
              onRemoved();
            }
          };
          chrome.tabs.onRemoved.addListener(onRemovedListener);

          /*
          make sure listners on targetcreated event with target.type() === 'page' are invoked before the page is further modified
          delay returning the newly created tab
          */
          const resolveFnc = () => resolve(tab);
          setTimeout(resolveFnc, 1000);
        },
      );
    });
  }

  static async close(tabId: number = null): Promise<void> {
    let activeTabId;

    if (!tabId) {
      activeTabId = await new Promise(resolve => {
        chrome.tabs.query({ active: true }, tabs => resolve(tabs[0].id));
      });
    }
    else {
      activeTabId = tabId;
    }

    await new Promise(resolve => {
      chrome.tabs.remove(
        activeTabId,
        () => {
          resolve();
        },
      );
    });
  }

  static update(tabId: number, updateProperties) {
    return new Promise(resolve => {
      chrome.tabs.update(
        tabId,
        updateProperties || {},
        tab => {
          // wait for the tab update to be completed, executeScript may throw errors otherwise
          const updateHandler = (updatedTabId, changeInfo, updatedTab) => {
            if (tabId === updatedTabId && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(updateHandler);
              resolve(updatedTab);
            }
          };
          chrome.tabs.onUpdated.addListener(updateHandler);
        },
      );
    });
  }
}
