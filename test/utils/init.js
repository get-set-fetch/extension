const path = require('path');

global.extension = {
  id: 'cpbaclenlbncmmagcfdlblmmppgmcjfg',
  path: path.resolve(__dirname, '..', '..', 'dist'),
};

// add a require wrapper for get-set-fetch module
// eslint-disable-next-line import/no-dynamic-require
global.gsfRequire = name => require(path.join(__dirname, '..', '..', name));
