const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(
    async () => {
        const browserFetcher = puppeteer.createBrowserFetcher({ product: process.env.browser });
        const revisionInfo = await browserFetcher.download(process.env.revision);

        const browser = process.env.browser === 'firefox' ? 'firefox' : 'chromium';
        const revisionPath = path.join(process.cwd(), 'node_modules', 'puppeteer');
        const revisionFile = `${browser}-revision.json`;

        fs.writeFileSync(
            path.join(revisionPath, revisionFile),
            JSON.stringify(revisionInfo)
        );
        console.log(revisionInfo);
    }
)();
