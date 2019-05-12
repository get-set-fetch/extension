require('ts-node').register({
  project: 'test/tsconfig.test.json',
  ignore: [ '/node_modules/(?!get-set-fetch)' ],
  files: true,
  pretty: true,
  'no-cache': true,
});
