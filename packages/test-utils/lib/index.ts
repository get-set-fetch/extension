import BrowserHelper, { clearQuerySelector, IBrowserProps } from './helper/browser/BrowserHelper';
import ChromeHelper from './helper/browser/ChromeHelper';
import FirefoxHelper from './helper/browser/FirefoxHelper';

import FileHelper from './helper/FileHelper';
import ScenarioHelper from './helper/ScenarioHelper';
import ProxyServer from './helper/ProxyServer';
import TgzHelper from './helper/TgzHelper';

import CertGenerator, { ITlsOptions } from './helper/CertGenerator';

import crawlProjectBaseSuite, { ICrawlDefinition } from './test/crawl-project-base-suite';

export function getBrowserHelper(props: IBrowserProps): BrowserHelper {
  return process.env.browser === 'firefox' ? new FirefoxHelper(props) : new ChromeHelper(props);
}

export {
  ChromeHelper as BrowserHelper,
  FileHelper,
  clearQuerySelector,
  ProxyServer,
  TgzHelper,
  CertGenerator, ITlsOptions,
  ScenarioHelper,
  crawlProjectBaseSuite,
  ICrawlDefinition,
};
