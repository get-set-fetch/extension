<img src="https://get-set-fetch.github.io/get-set-fetch/logo.png">


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch?ref=badge_shield)
[![dependencies Status](https://david-dm.org/get-set-fetch/extension/status.svg)](https://david-dm.org/get-set-fetch/extension)
[![Known Vulnerabilities](https://snyk.io/test/github/get-set-fetch/extension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/get-set-fetch/extension?targetFile=package.json)
[![Build Status](https://travis-ci.org/get-set-fetch/extension.svg?branch=master)](https://travis-ci.org/get-set-fetch/extension)
[![Coverage Status](https://coveralls.io/repos/github/get-set-fetch/extension/badge.svg?branch=master)](https://coveralls.io/github/get-set-fetch/extension?branch=master)

# Browser Extension
get-set, Fetch! is a Chrome extension for scraping sites through out a series of parametrizable scraping scenarios.
The most common use cases are handled by builtin scenarios:
- extract-html-content:
- extract-resources

You can also install community based scenarios:
- extract-html-headings: a "hello world" example of writing a scenario

If you wrote a scraping scenario and want to share it, update the above list and make a pull request.

The extension is structured as a monorepo with the following sub-packages:
- commons: mostly typescript definitions
- background: parses pages and stores relevant data in the builtin browser database (IndexedDB)
- popup: toolbar appearance
- admin: front-end for the background capabilities
- extract-html-content-scenario: builtin scenario
- extract-resources-scenario: builtin scenario
- extension: builds the extension files and runs a comprehensive suite of integration tests

In time, a more detailed documentation with lots of examples will be available at https://getsetfetch.org

You can find technical tidbits in each sub-package readme file.

# Short-Term Roadmap
## v.0.1.1
  - add crawl delay as a SelectResourcePlugin option
  - add crawl maxResources as a SelectResourcePlugin option
  - add resourceFilter options as an InsertResourcePlugin option  

## v.0.1.2
  - create a scraping template format starting from { scenarioName, scenarioOpts, ... }
  - load templates from arbitrary URIs
  - use templates to simplify the creation of scrape projects by automatically populating most of the scraping parameters
  - add template based, getting-started examples

# Medium-Term Roadmap
- add column filter capability when exporting resources as csv
- add granularity to ExtractUrlsPlugin maxDepth option in order to accommodate both internal and external links relative to the site being scraped
- add import / export database capabilities
- add log export capability
