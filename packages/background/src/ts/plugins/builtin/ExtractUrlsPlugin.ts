import { SchemaHelper, IPlugin, IResource, ISite } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for extracting new resources from a resource document.
 */

declare const document;
export default class ExtractUrlsPlugin implements IPlugin {
  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-urls-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ExtractUrlsPlugin',
      type: 'object',
      properties: {
        hostnameRe: {
          type: 'string',
          subType: 'regexp',
          default: '',
        },
        pathnameRe: {
          type: 'string',
          subType: 'regexp',
          default: '',
        },
        resourcePathnameRe: {
          type: 'string',
          subType: 'regexp',
          default: '',
        },
        maxDepth: {
          type: 'number',
          default: '-1',
        },
        runInTab: {
          type: 'boolean',
          default: true,
        },
      },
    };
  }

  static absoluteUrl(absolutePath, relativePath) {
    const absSegments = absolutePath.split('/');
    const relSegments = relativePath.split('/');

    // get to current directory by removing filename or extra slash if present
    const lastSegment = absSegments[absSegments.length - 1];
    if (lastSegment.length === 0 || lastSegment.indexOf('.') !== -1) {
      absSegments.pop();
    }

    for (let i = 0; i < relSegments.length; i += 1) {
      switch (relSegments[i]) {
        case '.':
          break;
        case '..':
          absSegments.pop();
          break;
        default:
          absSegments.push(relSegments[i]);
      }
    }
    return absSegments.join('/');
  }

  opts: {
    hostnameRe: RegExp;
    pathnameRe: RegExp;
    resourcePathnameRe: RegExp;
    maxDepth: number;
    runInTab: boolean;
  };

  constructor(opts = {}) {
    this.opts = SchemaHelper.instantiate(ExtractUrlsPlugin.OPTS_SCHEMA, opts);
  }

  test(resource: IResource) {
    // don't extract new resources if the max depth has been reached
    const maxDepthReached = this.opts.maxDepth === -1 ? false : resource.depth >= this.opts.maxDepth;

    // don't extract new resources from non-parsable pages or if the max depth has been reached
    return (/html/i).test(resource.mediaType) && !maxDepthReached;
  }

  apply(site: ISite, resource: IResource) {
    return ({ urlsToAdd: this.extractResourceUrls(site, resource) });
  }

  /*
  scan for resources in <a href />, <img src />
  */
  extractResourceUrls(site, resource): string[] {
    const doc = window.document;
    const currentUrl = new URL(resource.url);

    const anchors = doc.getElementsByTagName('a');
    const anchorHrefs = Array.from(new Set(Object.keys(anchors).map(key => anchors[key].href)));

    const imgs = doc.getElementsByTagName('img');
    const imgSrcs = Array.from(new Set(Object.keys(imgs).map(key => imgs[key].src)));

    const partialUrls = anchorHrefs.concat(imgSrcs);
    const validUrls = new Set<string>();

    partialUrls.forEach(partialUrl => {
      // construct resource full URL without #hhtml_fragment_identifiers
      const resourceUrl = new URL(partialUrl, currentUrl);
      resourceUrl.hash = '';

      if (this.isValidResourceUrl(currentUrl, resourceUrl)) {
        validUrls.add(resourceUrl.toString());
      }
    });

    return Array.from(validUrls);
  }

  isValidResourceUrl(currentUrl, resourceUrl) {
    // check valid protocol
    if (resourceUrl.protocol.match(/^(http:|https:)$/) === null) {
      return false;
    }

    // check hostname matches regexp
    if (this.opts.hostnameRe) {
      if (!this.opts.hostnameRe.test(resourceUrl.hostname)) return false;
    }
    // check hostname matches at domain level
    else if (!this.sameDomainHostnames(resourceUrl.hostname, currentUrl.hostname)) return false;

    // check valid pathname
    if (resourceUrl.pathname === null) {
      return false;
    }

    /*
    based on pathname decide if the resource is html or not
    if no extension is found, resource is probably html
    if an extension is found, test it against /htm|php/
    */
    const extensionRegExpArr = /^.*\.(.+)$/.exec(resourceUrl.pathname);
    const isHtml = extensionRegExpArr ? /htm|php/.test(extensionRegExpArr[1]) : true;

    // html resource found, filter which html pages should be queued for scraping
    if (isHtml) {
      // if no html regexp is defined ? add all urls : otherwise add only those matching the regexp
      return this.opts.pathnameRe ? this.opts.pathnameRe.test(resourceUrl.pathname) : true;
    }

    /*
    non html resource found
    if no non-html regexp is defined ? skip all urls : otherwise add only those matching the regexp
    */
    return this.opts.resourcePathnameRe ? this.opts.resourcePathnameRe.test(resourceUrl.pathname) : false;
  }

  sameDomainHostnames(hostname: string, targetHostname: string): boolean {
    const hostnameParts = hostname.split('.').reverse();
    let commonHostname = '';

    hostnameParts.forEach((hostnamePart, idx) => {
      const cummulatedHostname = hostnameParts.slice(0, idx + 1).reverse().join('.');
      if (targetHostname.endsWith(cummulatedHostname)) {
        commonHostname = cummulatedHostname;
      }
    });

    /*
    something ending in:
    - one extension (2 or more letters): .com, .info, ...
    - two extensions (2-4 letters, 2 or more letters): co.uk, com.ro
    the domain without extension has to be 4 letters or more, testing bla.com will fail
    for now this is an acceptable compromise
    */
    return /[\w-]{4,}\.[\w-]{2,}$|[\w-]+\.[\w-]{2,4}\.[\w-]{2,}$/.test(commonHostname);
  }
}
