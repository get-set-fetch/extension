const puppeteer = require('puppeteer');

(
    async () => {
        const browserFetcher = puppeteer.createBrowserFetcher({ product: process.env.browser });
        const revisionInfo = await browserFetcher.download(process.env.revision);
        console.log(revisionInfo);
    }
)();
