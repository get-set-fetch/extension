import ExtractUrlPlugin from 'get-set-fetch/lib/plugins/process/ExtractUrlPlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

/* eslint-disable class-methods-use-this */
class ExtensionExtractUrlPlugin extends ExtractUrlPlugin {
  test() {
    return true;
  }

  // overide parent method as extractResourceUrls is now async
  async apply(site, resource) {
    // don't extract new resources if the max depth has been reached
    const maxDepthReached = this.opts.maxDepth && this.opts.maxDepth === resource.depth;
    return ({ urlsToAdd: maxDepthReached ? [] : await this.extractResourceUrls(site, resource) });
  }

  async extractResourceUrls(site, resource) {
    await ActiveTabHelper.executeScript(site.tabId, { file: '/gsf/execute/ExtractUrlPlugin.js' });

    let extractCode = 'const extractPlugin = new ExtractUrlPlugin();';
    extractCode += `extractPlugin.apply(null, {url: '${resource.url}', document: window.document});`;
    const result = await ActiveTabHelper.executeScript(site.tabId, { code: extractCode });
    const urlsToAdd = result.urlsToAdd ? result.urlsToAdd : [];

    return urlsToAdd;
  }
}

module.exports = ExtensionExtractUrlPlugin;
