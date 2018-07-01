import ExtractUrlPlugin from 'get-set-fetch/lib/plugins/process/ExtractUrlPlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

class ExtensionExtractUrlPlugin extends ExtractUrlPlugin {
  // overide parent method as extractResourceUrls is now async
  async apply(site, resource) {
    // don't extract new resources if the max depth has been reached
    const maxDepthReached = this.opts.maxDepth && this.opts.maxDepth === resource.depth;
    return ({ urlsToAdd: maxDepthReached ? [] : await this.extractResourceUrls(site, resource) });
  }

  // eslint-disable-next-line class-methods-use-this
  async extractResourceUrls(site, resource) {
    await ActiveTabHelper.executeScript(resource.activeTab.id, { file: '/gsf/execute/ExtractUrlPlugin.js' });

    let extractCode = 'const extractPlugin = new ExtractUrlPlugin();';
    extractCode += `extractPlugin.apply(null, {url: '${resource.url}', document: window.document});`;
    const result = await ActiveTabHelper.executeScript(resource.activeTab.id, { code: extractCode });
    const urlsToAdd = result.urlsToAdd ? result.urlsToAdd : [];

    return urlsToAdd;
  }
}

module.exports = ExtensionExtractUrlPlugin;
