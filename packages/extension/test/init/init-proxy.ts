import { resolve } from 'path';
import serveStatic from 'serve-static';
import { ProxyServer } from 'get-set-fetch-extension-test-utils';

const serveStaticOpts: Map<string, serveStatic.ServeStaticOptions> = new Map([
  [ 'raw.githubusercontent.com', { index: [ 'README.md' ] } ],
]);

ProxyServer.create({
  rootDir: resolve(process.cwd(), 'test', 'resources', 'sites'),
  serveStaticOpts,
});
