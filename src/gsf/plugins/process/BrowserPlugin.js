import BasePlugin from 'get-set-fetch/lib/plugins/base/BasePlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

/* eslint-disable class-methods-use-this */
class BrowserPlugin extends BasePlugin {
  getPhase() {
    return BasePlugin.PHASE.PROCESS;
  }

  test() {
    return true;
  }

  async apply(site, resource) {
    let result = {};
    try {
      await ActiveTabHelper.executeScript(site.tabId, { code: this.opts.code });

      // test if plugin is aplicable
      const isAplicable = await ActiveTabHelper.executeScript(site.tabId, { code: `${this.opts.name}.test()` });
      if (!isAplicable) return null;

      // apply plugin, the result will be merged at a higher level into the current resource
      result = await ActiveTabHelper.executeScript(site.tabId, { code: `${this.opts.name}.apply()` });
    }
    catch (err) {
      console.log(err);
      throw err;
    }

    return result;
  }
}


module.exports = BrowserPlugin;
