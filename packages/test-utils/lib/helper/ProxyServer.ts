/* eslint-disable no-console */
import connect from 'connect';
import serveStatic from 'serve-static';
import vhost from 'vhost';
import http, { IncomingMessage, ServerResponse } from 'http';
import https from 'https';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface IProxyServerProps {
  rootDir: string;
  httpPort?: number;
  httpsPort?: number;
  serveStaticOpts?: Map<string, serveStatic.ServeStaticOptions>;
  tlsDir: string;
}

export default class ProxyServer {
  /*
  redirect all /dir/redirect-page.html req to /dir/page.html
  some integration tests make use of this functionality to test the scraper redirect handling capabilities
  */
  static redirect(req: IncomingMessage, res: ServerResponse) {
    if (/redirect-/.test(req.url)) {
      const targetUrl = req.url.replace(/redirect-/, '');
      res.statusCode = 301;
      res.setHeader('Location', targetUrl);
      res.end();
    }
  }

  static create({
    rootDir,
    httpPort = 8080,
    httpsPort = 8443,
    serveStaticOpts = new Map<string, serveStatic.ServeStaticOptions>(),
    tlsDir,
  }:
  IProxyServerProps):void {
    const siteDirs = readdirSync(rootDir).filter(file => statSync(join(rootDir, file)).isDirectory());

    const mainApp = connect();
    siteDirs.forEach(siteDir => {
      const siteApp = connect();
      siteApp.use(serveStatic(join(rootDir, siteDir), serveStaticOpts.get(siteDir)));
      siteApp.use(ProxyServer.redirect);

      mainApp.use(vhost(siteDir, siteApp));
      mainApp.use(vhost(`www.${siteDir}`, siteApp));
      console.log(`Serving ${siteDir} from ${join(rootDir, siteDir)}`);
    });

    // serve the content over http, port number above 1024 in order to avoid root access
    http.createServer(mainApp).listen(httpPort);
    console.log(`http server started on port ${httpPort}`);

    console.log(`using existing keys from ${join(tlsDir)}`);
    /*
      curl -v -k -s --key ./web-private-key.pem --cert ./web-public-key-cert.pem https://localhost:8443/
      *   Trying 127.0.0.1...
      * TCP_NODELAY set
      * Connected to localhost (127.0.0.1) port 8443 (#0)
      * ALPN, offering h2
      * ALPN, offering http/1.1
      * successfully set certificate verify locations:
      *   CAfile: /etc/ssl/certs/ca-certificates.crt
        CApath: /etc/ssl/certs
      * TLSv1.3 (OUT), TLS handshake, Client hello (1):
      * TLSv1.3 (IN), TLS handshake, Server hello (2):
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, Unknown (8):
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, Certificate (11):
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, CERT verify (15):
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, Finished (20):
      * TLSv1.3 (OUT), TLS change cipher, Client hello (1):
      * TLSv1.3 (OUT), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (OUT), TLS handshake, Finished (20):
      * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
      * ALPN, server accepted to use http/1.1
      * Server certificate:
      *  subject: CN=web.gsf; C=RO; ST=Bucharest; L=Bucharest; O=gsf; OU=web.gsf
      *  start date: Jun  3 10:49:27 2020 GMT
      *  expire date: Jun  3 10:49:27 2021 GMT
      *  issuer: CN=ca.gsf; C=RO; ST=Bucharest; L=Bucharest; O=gsf; OU=ca.gsf
      *  SSL certificate verify result: self signed certificate in certificate chain (19), continuing anyway.
      * TLSv1.3 (OUT), TLS Unknown, Unknown (23):
      > GET / HTTP/1.1
      > Host: localhost:8443
      > User-Agent: curl/7.58.0
      > Accept: * /*
      >
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
      * TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
      * TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
      * TLSv1.3 (IN), TLS Unknown, Unknown (23):
      < HTTP/1.1 404 Not Found
      < Content-Security-Policy: default-src 'none'
      < X-Content-Type-Options: nosniff
      < Content-Type: text/html; charset=utf-8
      < Content-Length: 139
      < Date: Wed, 03 Jun 2020 10:58:31 GMT
      < Connection: keep-alive
    */
    https.createServer(
      {
        passphrase: 'password',
        pfx: readFileSync(join(tlsDir, 'web', 'web-private-key-cert.p12')),
        ca: readFileSync(join(tlsDir, 'ca', 'ca-public-key-cert.pem')),
      },
      mainApp,
    ).listen(httpsPort);

    console.log(`https server started on port ${httpsPort}`);
  }
}
