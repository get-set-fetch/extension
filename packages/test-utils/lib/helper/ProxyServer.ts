import connect from 'connect';
import serveStatic from 'serve-static';
import vhost from 'vhost';
import http from 'http';
import https from 'https';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import CertGenerator from './CertGenerator';

interface IProxyServerProps {
  rootDir: string;
  httpPort?: number;
  httpsPort?: number;
  serveStaticOpts?: Map<string, serveStatic.ServeStaticOptions>;
}

export default class ProxyServer {
  static create({
    rootDir,
    httpPort = 8080,
    httpsPort = 8443,
    serveStaticOpts = new Map<string, serveStatic.ServeStaticOptions>(),
  }:
  IProxyServerProps) {
    const siteDirs = readdirSync(rootDir).filter(file => statSync(join(rootDir, file)).isDirectory());

    const mainApp = connect();
    siteDirs.forEach(siteDir => {
      const siteApp = connect();
      siteApp.use(serveStatic(join(rootDir, siteDir), serveStaticOpts.get(siteDir)));
      mainApp.use(vhost(siteDir, siteApp));
      mainApp.use(vhost(`www.${siteDir}`, siteApp));
      console.log(`Serving ${siteDir} from ${join(rootDir, siteDir)}`);
    });

    // serve the content over http, port number above 1024 in order to avoid root access
    http.createServer(mainApp).listen(httpPort);
    console.log(`http server started on port ${httpPort}`);

    // server the content over https, port number above 1024 in order to avoid root access
    const tlsOpts = CertGenerator.generate();
    https.createServer(tlsOpts, mainApp).listen(httpsPort);
    console.log(`https server started on port ${httpsPort}`);
  }
}
