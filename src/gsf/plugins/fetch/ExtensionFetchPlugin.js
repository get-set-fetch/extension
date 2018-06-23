import BasePlugin from 'get-set-fetch/lib/plugins/base/BasePlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

class ExtensionFetchPlugin extends BasePlugin {
  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.FETCH;
  }

  // eslint-disable-next-line class-methods-use-this
  test(resource) {
    const { protocol } = new URL(resource.url);
    return protocol === 'http:' || protocol === 'https:';
  }

  // eslint-disable-next-line
  async apply(site, resource) {
    let activeTab = await ActiveTabHelper.getCurrent();
    activeTab = await ActiveTabHelper.update(activeTab.id, { url: resource.url });

    const contentType = await ActiveTabHelper.executeScript({ code: 'document.contentType' });
    return { activeTab, contentType };
  }
}

module.exports = ExtensionFetchPlugin;
