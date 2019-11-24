import { JSDOM } from 'jsdom';
import * as setGlobalVars from 'indexeddbshim';
import { TextDecoder } from 'util';

/*
node.js does not support IndexedDB
define global browser window and register indexeddbshim under it with no window.location.origin check and in memory db
*/
global.window = global;
setGlobalVars(global.window, {
  checkOrigin: false,
  memoryDatabase: ':memory:',
});

// init jsdom environment for testing plugins running in browser
const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
global.window.document = dom.window.document;

// "polyfill" fetch in order to have something to stub
global.window.fetch = () => Promise.resolve();

global.window.btoa = val => Buffer.from(val).toString('base64');
global.window.atob = val => Buffer.from(val, 'base64').toString();

// "polyfill" TextDecoder, nodejs prior to 11 (not yet LTS) makes TextDecoder available from utils not global
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
