import BasePlugin from 'get-set-fetch/lib/plugins/base/BasePlugin';

/* eslint-disable class-methods-use-this */
class MockPlugin extends BasePlugin {
  constructor(opts) {
    super(opts || {});
  }

  getPhase() {
    return BasePlugin.PHASE.PROCESS;
  }

  test() {
    return true;
  }

  apply() {
  }
}

module.exports = MockPlugin;
