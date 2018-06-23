import ExtractUrlPlugin from 'get-set-fetch/lib/plugins/process/ExtractUrlPlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

class ExtensionExtractUrlPlugin extends ExtractUrlPlugin {
  // eslint-disable-next-line class-methods-use-this
  async apply(site, resource) {
    await ActiveTabHelper.executeScript({ file: '/gsf/execute/ExtractUrlPlugin.js' });

    let extractCode = 'const extractPlugin = new ExtractUrlPlugin();';
    extractCode += `extractPlugin.apply(null, {url: '${resource.url}', document: window.document});`;
    const result = await ActiveTabHelper.executeScript({ code: extractCode });
    const urlsToAdd = result.urlsToAdd ? result.urlsToAdd : [];
    return { urlsToAdd };
  }
}

module.exports = ExtensionExtractUrlPlugin;
