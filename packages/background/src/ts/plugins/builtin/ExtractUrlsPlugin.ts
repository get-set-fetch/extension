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
      description: 'extracts new (html or binary) resource urls from the current html page.',
      properties: {
        selectors: {
          type: 'string',
          default: 'a[href$=".html"] # follow html links',
          ui: {
            customField: 'LongTextField',
          },
          description: 'One or multiple CSS selectors separated by new line. Urls are extracted from link or image html elements. Comments can be added via #. You can also define a selector pair, ex: a[href$=".html"], h1.title. In this case, when exporting binary resources, the generated filename will be prefixed by h1.title value.',
        },
        maxDepth: {
          type: 'integer',
          default: '-1',
          title: 'Max Depth',
          description: 'Maximum depth of resources to be scraped. The starting resource has depth 0. Resources discovered from it have depth 1 and so on. A value of -1 disables this check.',
        },
        maxResources: {
          type: 'integer',
          default: '100',
          title: 'Max Resources',
          description: 'Maximum number of resources to be scraped. A value of -1 disables this check.',
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
    let resourcesToAdd: Partial<IResource>[] = this.extractResources(site, resource);

    // there's a limit of scrapped resources, enforce it
    if (this.opts.maxResources !== -1) {
      const maxAllowedResourceNo = this.opts.maxResources - site.resourcesNo;
      if (maxAllowedResourceNo > 0) {
        resourcesToAdd = resourcesToAdd.slice(0, maxAllowedResourceNo);
      }
      else {
        resourcesToAdd = [];
      }
    }

    const result = this.diffAndMergeResult({ resourcesToAdd });

    // eslint-disable-next-line no-param-reassign
    site.resourcesNo += result.resourcesToAdd.length;

    return result;
  }

  extractResources(site, resource): Partial<IResource>[] {
    const currentUrl = new URL(resource.url);

    const rawSelectors: string[] = this.opts.selectors.split('\n');
    const resources = rawSelectors.reduce(
      (resources, rawSelector) => {
        let selectorPair = rawSelector.trim();

        // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
        if (/\s#/.test(selectorPair)) {
          const selectorMatch = /(.+)(?=(\s#))/.exec(selectorPair);
          // eslint-disable-next-line prefer-destructuring
          selectorPair = selectorMatch[1];
        }

        // nothing to query against
        if (selectorPair.length === 0) {
          return resources;
        }

        /*
        sometimes the link innerText or img alt text is not enough to uniquely differentiate between child urls..
        ex: extracting pdf files from a site where on each page is a link with "Export" text
        if we are to rename the pdf files based on link innerText, all pdf files will result in the name 'export.pdf'
        to avoid this, an extra, optional title selector is added
        is responsible for linking link(s) with some other elm innerText from the page, like, for ex, h2.page-title
        */
        const [ urlSelector, titleSelector ] = selectorPair.split(',').map(elm => elm.trim());
        const selectorResources = this.extractSelectorResources(urlSelector, titleSelector);
        return resources.concat(selectorResources);
      },
      [],
    );

    resources.forEach(resource => {
      // construct resource full URL without #hhtml_fragment_identifiers
      const fullUrl = new URL(resource.url, currentUrl);
      fullUrl.hash = '';

      if (this.isValidResourceUrl(fullUrl)) {
        // eslint-disable-next-line no-param-reassign
        resource.url = fullUrl.toString();
      }
    });


    const uniqueResources = [];
    const uniqueUrls = [];
    resources.forEach(resource => {
      if (!uniqueUrls.includes(resource.url)) {
        uniqueResources.push(resource);
        uniqueUrls.push(resource.url);
      }
    });

    return uniqueResources;
  }

  extractSelectorResources(urlSelector: string, titleSelector: string): Partial<IResource>[] {
    const titles: string[] = titleSelector ? Array.from(window.document.querySelectorAll(titleSelector)).map((title: any) => title.innerText.trim()) : [];
    const resources: Partial<IResource>[] = Array.from(window.document.querySelectorAll(urlSelector)).map((elm: any, idx) => {
      let resource: Partial<IResource> = null;
      if (elm.href) {
        resource = {
          url: elm.href,
          parent: {
            linkText: elm.innerText,
          },
        };
      }

      if (elm.src) {
        resource = {
          url: elm.src,
          parent: {
            imgAlt: elm.alt,
          },
        };
      }

      if (resource && titles.length > 0) {
        resource.parent.title = titles.length > idx ? titles[idx] : titles[titles.length - 1];
      }

      return resource;
    });

    return resources.filter(resource => resource !== null);
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
