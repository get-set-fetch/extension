import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

/*
regarding project.plugins we only need to define the plugin properties different from default values
only these need to be updated from UI
*/
const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'selectorBase not found',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/pageD.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: 0,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'td:nth-child(1) span # 1st column\ntd:nth-child(2) span # 2nd column',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/pageD.html',
        actions: [],
        mediaType: 'text/html',
        content: {
          'td:nth-child(1) span': [ 'valA1', 'valA2' ],
          'td:nth-child(2) span': [ 'valB1', 'valB3' ],
        },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.td:nth-child(1) span,content.td:nth-child(2) span',
      '"https://www.sitea.com/static/pageD.html","valA1","valB1"',
      '"https://www.sitea.com/static/pageD.html","valA2","valB3"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'selectorBase present, returns a single element',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/pageD.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: 0,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'table.main td:nth-child(1) span # 1st column\ntable.main td:nth-child(2) span # 2nd column',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/pageD.html',
        actions: [],
        mediaType: 'text/html',
        content: {
          'table.main td:nth-child(1) span': [ 'valA1', 'valA2' ],
          'table.main td:nth-child(2) span': [ 'valB1', 'valB3' ],
        },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.table.main td:nth-child(1) span,content.table.main td:nth-child(2) span',
      '"https://www.sitea.com/static/pageD.html","valA1","valB1"',
      '"https://www.sitea.com/static/pageD.html","valA2","valB3"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'selectorBase present, returns multiple elements',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/pageD.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: 0,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'table.main tr td:nth-child(1) span # 1st column\ntable.main tr td:nth-child(2) span # 2nd column',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/pageD.html',
        actions: [],
        mediaType: 'text/html',
        content: {
          'table.main tr td:nth-child(1) span': [ 'valA1', 'valA2', '' ],
          'table.main tr td:nth-child(2) span': [ 'valB1', '', 'valB3' ],
        },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.table.main tr td:nth-child(1) span,content.table.main tr td:nth-child(2) span',
      '"https://www.sitea.com/static/pageD.html","valA1","valB1"',
      '"https://www.sitea.com/static/pageD.html","valA2",""',
      '"https://www.sitea.com/static/pageD.html","","valB3"',
    ],
    csvLineSeparator: '\n',
  },


];

crawlProjectBaseSuite('Extract Static Incomplete Content', crawlDefinitions);
