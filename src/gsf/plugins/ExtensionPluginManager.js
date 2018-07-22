import PluginManager from 'get-set-fetch/lib/plugins/PluginManager';
import SelectResourcePlugin from 'get-set-fetch/lib/plugins/select/SelectResourcePlugin';
import UpdateResourcePlugin from 'get-set-fetch/lib/plugins/save/UpdateResourcePlugin';
import InsertResourcePlugin from 'get-set-fetch/lib/plugins/save/InsertResourcePlugin';
import ExtensionExtractUrlPlugin from './process/ExtensionExtractUrlPlugin';
import BrowserPlugin from './process/BrowserPlugin';
import ExtensionFetchPlugin from './fetch/ExtensionFetchPlugin';

import IdbUserPlugin from '../storage/IdbUserPlugin';

class ExtensionPluginManager extends PluginManager {
  static get DEFAULT_PLUGINS() {
    return [
      new SelectResourcePlugin(), // select: resource to crawl
      new ExtensionFetchPlugin(), // fetch: open resource in new tab
      new ExtensionExtractUrlPlugin(), // process: extract internal urls for further crawling
      new UpdateResourcePlugin(), // save: update current resource with the processed content
      new InsertResourcePlugin(), // save: insert newly founded resources after parsing the current resource content
    ];
  }

  static registerOptionals() {
    this.register(new BrowserPlugin());
  }

  static async instantiateUserPlugins(nameOrIds) {
    const plugins = [];
    for (let i = 0; i < nameOrIds.length; i += 1) {
      const userPlugin = await IdbUserPlugin.get(nameOrIds[i]);
      const plugin = new BrowserPlugin({ name: userPlugin.name, code: userPlugin.code });
      plugins.push(plugin);
    }

    return plugins;
  }
}

module.exports = ExtensionPluginManager;
