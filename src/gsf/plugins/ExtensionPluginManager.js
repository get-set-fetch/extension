import PluginManager from 'get-set-fetch/lib/plugins/PluginManager';
import SelectResourcePlugin from 'get-set-fetch/lib/plugins/select/SelectResourcePlugin';
import UpdateResourcePlugin from 'get-set-fetch/lib/plugins/save/UpdateResourcePlugin';
import InsertResourcePlugin from 'get-set-fetch/lib/plugins/save/InsertResourcePlugin';
import ExtensionExtractUrlPlugin from './process/ExtensionExtractUrlPlugin';
import ExtensionFetchPlugin from './fetch/ExtensionFetchPlugin';

class ExtensionPluginManager extends PluginManager {
  static get DEFAULT_PLUGINS() {
    return [
      new SelectResourcePlugin(), // select: resource to crawl
      new ExtensionFetchPlugin(), // fetch: open resource in new tab
      new ExtensionExtractUrlPlugin(), // process: extract internal urls for further crawling
      // new ExtractUrlPlugin(), // process: extract internal urls for further crawling
      new UpdateResourcePlugin(), // save: update current resource with the fetched content
      new InsertResourcePlugin(), // save: insert newly founded resources after parsing the current resource content
    ];
  }
}

module.exports = ExtensionPluginManager;
