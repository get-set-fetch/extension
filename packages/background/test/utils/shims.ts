import * as setGlobalVars from 'indexeddbshim';

/*
node.js does not support IndexedDB
define global browser window and register indexeddbshim under it with no window.location.origin check and in memory db
*/

global.window = global;
setGlobalVars(global.window, {
  checkOrigin: false,
  memoryDatabase: ':memory:'
});
