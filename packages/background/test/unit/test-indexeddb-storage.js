import SystemJS from 'systemjs';
import ExternalStorageTests from 'get-set-fetch/test/external/external-storage-tests';
import IdbStorage from '../../src/js/storage/IdbStorage.ts';
import ModuleHelper from '../utils/ModuleHelper.ts';
import PluginManager from '../../src/js/plugins/PluginManager.ts';
import GsfProvider from '../../src/js/storage/GsfProvider.ts';

global.System = SystemJS;
const conn = { info: 'IndexedDB' };

xdescribe('Test Suite IndexedDB Storage', () => {
  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { UserPlugin } = await IdbStorage.init();
    GsfProvider.UserPlugin = UserPlugin;
    global.GsfProvider = { UserPlugin };

    await ModuleHelper.init();
  });
});
