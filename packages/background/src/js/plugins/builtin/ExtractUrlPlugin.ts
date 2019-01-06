import SchemaHelper from '../../schema/SchemaHelper';

/**
 * Plugin responsible for extracting new resources from a resource document.
 */

declare const document;
export default class ExtractUrlPlugin {

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-url-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ExtractUrlPlugin',
      type: 'object',
      properties: {
        contentTypeRe: {
          type: 'string',
          subType: 'regexp',
          default: '/html/i'
        },
        extensionRe: {
          type: 'string',
          subType: 'regexp',
          default: '/^(html|htm|php)$/i'
        },
        allowNoExtension: {
          type: 'boolean',
          default: true
        },
        maxDepth: {
          type: 'number',
          default: '-1'
        },
        runInTab: {
          type: 'boolean',
          default: true
        }
      }
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
    contentTypeRe: RegExp,
    extensionRe: RegExp,
    allowNoExtension: boolean,
    maxDepth: number,
    runInTab: boolean
  };

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(ExtractUrlPlugin.OPTS_SCHEMA, opts);
  }

  test() {
    return this.opts.contentTypeRe.test(document.contentType);
  }

  apply(site, resource) {
    // don't extract new resources if the max depth has been reached
    const maxDepthReached = this.opts.maxDepth === resource.depth;
    return ({ urlsToAdd: maxDepthReached ? [] : this.extractResourceUrls(site, resource) });
  }

  /*
  scan for resources in <a href />, <img src />
  */
  extractResourceUrls(site, resource) {
    const doc = window.document;
    const currentUrl = new URL(resource.url);

    const anchors = doc.getElementsByTagName('a');
    const anchorHrefs = Array.from(new Set(Object.keys(anchors).map(key => anchors[key].href)));

    const imgs = doc.getElementsByTagName('img');
    const imgSrcs = Array.from(new Set(Object.keys(imgs).map(key => imgs[key].src)));

    const partialUrls = anchorHrefs.concat(imgSrcs);
    const validUrls = new Set();

    partialUrls.forEach((partialUrl) => {
      const resourceUrl = new URL(partialUrl, currentUrl);
      // this.createResourceUrl(currentUrl, partialUrl);
      if (this.isValidResourceUrl(currentUrl, resourceUrl)) {
        validUrls.add(resourceUrl.toString());
      }
    });

    return Array.from(validUrls);
  }

  createResourceUrl(currentUrl, partialUrl) {
    let resourceUrl = null;
    // absolute path starting with "/" or http://, https://
    if (partialUrl.indexOf('/') === 0 || partialUrl.match(/^(http:\/\/|https:\/\/)/i)) {
      resourceUrl = new URL(partialUrl);
    }
    else {
      // relative path
      resourceUrl = new URL(ExtractUrlPlugin.absoluteUrl(currentUrl.pathname, partialUrl));
    }

    // create complete url without hash, page#1, page#2 should point to the same resource
    // resourceUrl.hash = undefined;
    // include "//" after protocol
    // resourceUrl.slashes = true;

    resourceUrl.protocol = resourceUrl.protocol && resourceUrl.protocol.length > 0 ? resourceUrl.protocol : currentUrl.protocol;
    resourceUrl.host = resourceUrl.host && resourceUrl.host.length > 0 ? resourceUrl.host : currentUrl.host;
    resourceUrl.hostname = resourceUrl.hostname && resourceUrl.hostname.length > 0 ? resourceUrl.hostname : currentUrl.hostname;
    resourceUrl.port = resourceUrl.port && resourceUrl.port.length > 0 ? resourceUrl.port : currentUrl.port;

    return resourceUrl;
  }

  isValidResourceUrl(currentUrl, resourceUrl) {
    // check valid protocol
    if (resourceUrl.protocol.match(/^(http:|https:)$/) === null) {
      return false;
    }

    // check if internal
    if (resourceUrl.hostname !== currentUrl.hostname) {
      return false;
    }

    // check valid pathname
    if (resourceUrl.pathname === null) {
      return false;
    }

    // check extension (valid one or not an extension at all)
    const extIdx = resourceUrl.pathname.lastIndexOf('.');
    if (extIdx !== -1) {
      const extVal = resourceUrl.pathname.substr(extIdx + 1);

      // . represents extension and not part of path, if extension make sure it's the correct one
      return extVal.match(this.opts.extensionRe) !== null;
    }

    // resource has no extension, return valid resource only if no extension flag allows it
    return this.opts.allowNoExtension;
  }
}
