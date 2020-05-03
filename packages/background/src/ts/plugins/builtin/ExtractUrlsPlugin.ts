import { IResource, ISite, BasePlugin, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import IdbSite from '../../storage/IdbSite';

/**
 * Plugin responsible for extracting new resources from a resource document.
 */
export default class ExtractUrlsPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Extract Urls Plugin',
      description: 'responsible for extracting new resources(html pages or binary content) urls from the current html page.',
      properties: {
        selectors: {
          type: 'string',
          default: 'a[href$=".html"] # follow html links',
          ui: {
            customField: 'LongTextField',
          },
          description: 'Html selectors.',
        },
        maxDepth: {
          type: 'integer',
          default: '-1',
          description: 'Maximum depth of resources to be scraped.',
        },
        maxResources: {
          type: 'integer',
          default: '100',
          description: 'Maximum number of resources to be scraped.',
        },
        domRead: {
          type: 'boolean',
          const: true,
        },
      },
      required: [ 'selectors', 'maxDepth', 'maxResources' ],
    };
  }

  opts: {
    selectors: string;
    maxResources: number;
    maxDepth: number;
    domRead: boolean;
  };

  test(site: ISite & IdbSite, resource: IResource) {
    // only extract new urls of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    // don't extract new resources if max depth or max resources threshold has been reached
    const validMaxDepth = this.opts.maxDepth === -1 ? true : resource.depth < this.opts.maxDepth;
    const validMaxResources = this.opts.maxResources === -1 ? true : site.resourcesNo < this.opts.maxResources;

    // don't extract new resources from non-parsable pages
    const validMediaType = (/html/i).test(resource.mediaType);

    return validMaxDepth && validMaxResources && validMediaType;
  }

  apply(site: ISite & IdbSite, resource: IResource) {
    let urlsToAdd = this.extractResourceUrls(site, resource);

    // there's a limit of scrapped resources, enforce it
    if (this.opts.maxResources !== -1) {
      const maxAllowedResourceNo = this.opts.maxResources - site.resourcesNo;
      if (maxAllowedResourceNo > 0) {
        urlsToAdd = urlsToAdd.slice(0, maxAllowedResourceNo);
      }
      else {
        urlsToAdd = [];
      }
    }

    const result = this.diffAndMergeResult({ urlsToAdd });

    // eslint-disable-next-line no-param-reassign
    site.resourcesNo += result.urlsToAdd.length;

    return result;
  }

  extractResourceUrls(site, resource): string[] {
    const currentUrl = new URL(resource.url);

    const rawSelectors: string[] = this.opts.selectors.split('\n');
    const urls = rawSelectors.reduce(
      (urls, rawSelector) => {
        let selector = rawSelector.trim();

        // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
        if (/\s#/.test(selector)) {
          const selectorMatch = /(.+)(?=(\s#))/.exec(selector);
          // eslint-disable-next-line prefer-destructuring
          selector = selectorMatch[1];
        }

        // nothing to query against
        if (selector.length === 0) {
          return urls;
        }

        const selectorUrls = this.extractSelectorUrls(selector);
        return urls.concat(selectorUrls);
      },
      [],
    );
    const uniqueUrls = Array.from(new Set(urls));

    const validUrls = new Set<string>();
    uniqueUrls.forEach(partialUrl => {
      // construct resource full URL without #hhtml_fragment_identifiers
      const resourceUrl = new URL(partialUrl, currentUrl);
      resourceUrl.hash = '';

      if (this.isValidResourceUrl(resourceUrl)) {
        validUrls.add(resourceUrl.toString());
      }
    });

    return Array.from(validUrls);
  }

  extractSelectorUrls(selector: string) {
    const urls = Array.from(window.document.querySelectorAll(selector)).map((elm: any) => {
      if (elm.href) return elm.href;
      if (elm.src) return elm.src;
      return null;
    });

    return urls.filter(url => url !== null);
  }

  isValidResourceUrl(resourceUrl) {
    // check valid protocol
    if (resourceUrl.protocol.match(/^(http:|https:)$/) === null) {
      return false;
    }

    // check valid pathname
    if (resourceUrl.pathname === null) {
      return false;
    }

    return true;
  }
}
