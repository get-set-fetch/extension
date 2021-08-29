<img src="https://get-set-fetch.github.io/get-set-fetch/logo.png">


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch?ref=badge_shield)
[![dependencies Status](https://david-dm.org/get-set-fetch/extension/status.svg)](https://david-dm.org/get-set-fetch/extension)
[![Known Vulnerabilities](https://snyk.io/test/github/get-set-fetch/extension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/get-set-fetch/extension?targetFile=package.json)
[![Build Status](https://travis-ci.org/get-set-fetch/extension.svg?branch=master)](https://travis-ci.org/get-set-fetch/extension)
[![Coverage Status](https://coveralls.io/repos/github/get-set-fetch/extension/badge.svg?branch=master)](https://coveralls.io/github/get-set-fetch/extension?branch=master)

# Browser Extension
get-set, Fetch! is a browser extension for scraping sites through out a series of parametrizable scraping scenarios.

Currently supported browsers: 
[Chrome](https://chrome.google.com/webstore/detail/get-set-fetch-web-scraper/obanemoliijohdnhjjkdbekbhdjeolnk), 
[Firefox](https://addons.mozilla.org/en-US/firefox/addon/get-set-fetch-web-scraper/),
[Edge](https://microsoftedge.microsoft.com/addons/detail/getset-fetch-web-scrap/bpoeflbhbglemehjccjfockpkhddppoh).

The most common use cases are handled by builtin scenarios:
- [Scrape Static Content](https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/scrape-static-content)
  - Extracts text and binary content from static html pages based on CSS selectors.
- [Scrape Dynamic Content](https://github.com/get-set-fetch/extension/tree/master/packages/scenarios/scrape-dynamic-content)
  - Extracts text and binary content from dynamic (javascript) pages based on CSS selectors.

You can also install community based scenarios:

- [Extract Html Headings](https://github.com/a1sabau/gsf-extension-extract-html-headings) - [v0.2.0](https://registry.npmjs.org/gsf-extension-extract-html-headings/0.2.0) 
  - "Hello World" example of writing a scrape scenario.
- [Extract Article Content](https://github.com/a1sabau/gsf-extension-readability/) - [v0.2.0](https://registry.npmjs.org/gsf-extension-readability//0.2.0) 
  - Extract article content using Mozilla Readability library.


If you wrote a scraping scenario and want to share it, please update the above list and make a pull request.

The extension is structured as a monorepo with the following sub-packages:
- commons: mostly typescript definitions
- background: parses pages and stores relevant data in the builtin browser database (IndexedDB)
- popup: toolbar appearance
- admin: front-end for the background capabilities
- scrape-static-content: builtin scenario
- scrape-dynamic-content: builtin scenario
- extension: builds the extension files and runs a comprehensive suite of integration tests

You can find technical tidbits in each sub-package readme file.

A detailed documentation with a series of examples is available at [getsetfetch.org](https://getsetfetch.org/extension/getting-started.html).


