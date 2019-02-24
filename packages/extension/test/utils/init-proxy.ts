import connect from 'connect';
import serveStatic from 'serve-static';
import vhost from 'vhost';

const app = connect();

// serve siteA
const siteA = connect();
siteA.use(serveStatic('./test/resources/siteA'));
app.use(vhost('sitea.com', siteA));
app.use(vhost('www.sitea.com', siteA));

app.listen(3000);
console.log('proxy started on 3000');