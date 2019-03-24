import { JSDOM } from 'jsdom';
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

// init jsdom environment for testing plugins running in browser
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.window.document = dom.window.document;
