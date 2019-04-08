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

// serve get-set-fetch/extension README.md containing list of available scenarios
const githubSite = connect();
githubSite.use(serveStatic('./test/resources/sites/raw.githubusercontent.com', { index: ['README.md'] }));
app.use(vhost('raw.githubusercontent.com', githubSite));

// serve scenario npm content from registry.npmjs.org used for dynamically importing a scenario
const scenarioSite = connect();
scenarioSite.use(serveStatic('./test/resources/sites/registry.npmjs.org'));
app.use(vhost('registry.npmjs.org', scenarioSite));

// serve the content over http, port number above 1024 in order to avoid root access
http.createServer(app).listen(8080);

// server the content over https, port number above 1024 in order to avoid root access
const tlsOpts = CertGenerator.generate();
https.createServer(tlsOpts, app).listen(8443);