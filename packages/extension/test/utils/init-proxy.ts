import connect from 'connect';
import serveStatic from 'serve-static';
import vhost from 'vhost';
import http from 'http';
import https from 'https';
import CertGenerator from './CertGenerator';

const app = connect();

// serve siteA used for crawling
const siteA = connect();
siteA.use(serveStatic('./test/resources/sites/sitea.com'));
app.use(vhost('sitea.com', siteA));
app.use(vhost('www.sitea.com', siteA));


// serve the content over http
http.createServer(app).listen(80);

// server the content over https
const tlsOpts = CertGenerator.generate();
https.createServer(tlsOpts, app).listen(443);