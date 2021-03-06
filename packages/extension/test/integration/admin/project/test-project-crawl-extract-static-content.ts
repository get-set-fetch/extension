import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

/*
regarding project.plugins we only need to define the plugin properties different from default values
only these need to be updated from UI
*/
const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'maxDepth = -1, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1\ni.classA # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageB.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageB Heading Level 1', 'PageB Heading Level 1' ], 'i.classA': [ 'italics B1', 'italics B2' ] },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.h1,content.i.classA',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/static/pageA.html","PageA Heading Level 1","italics A"',
      '"https://www.sitea.com/static/pageB.html","PageB Heading Level 1","italics B1"',
      '"https://www.sitea.com/static/pageB.html","PageB Heading Level 1","italics B2"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'maxDepth = 0, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
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
            selectors: 'h1\ni.classA # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h1,content.i.classA',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'maxDepth = 0, maxResources = -1, single page table',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/table.html',
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
            selectors: 'td:first-child # colA\ntd:nth-child(2) # colB',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/table.html',
        actions: [],
        mediaType: 'text/html',
        content: { 'td:first-child': [ 'a1', 'a2', 'a3' ], 'td:nth-child(2)': [ 'b1', 'b2', 'b3' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.td:first-child,content.td:nth-child(2)',
      '"https://www.sitea.com/static/table.html","a1","b1"',
      '"https://www.sitea.com/static/table.html","a2","b2"',
      '"https://www.sitea.com/static/table.html","a3","b3"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'maxDepth = 1, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: 1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1\ni.classA # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h1,content.i.classA',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/static/pageA.html","PageA Heading Level 1","italics A"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = -1, maxResources = 2',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: 1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1\ni.classA # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h1,content.i.classA',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/static/pageA.html","PageA Heading Level 1","italics A"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'redirect maxDepth = -1, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/redirect/redirect-main.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1\ni.classA # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        "url": "https://www.sitea.com/redirect/main.html",
        "actions": [],
        "mediaType": "text/html",
        "meta": {},
        "content": { "h1": ["Main Header 1"], "i.classA": ["italics main"] }
      },
      {
        "url": "https://www.sitea.com/redirect/pageA.html",
        "actions": [],
        "mediaType": "text/html",
        "meta": {},
        "content": { "h1": ["PageA Heading Level 1"], "i.classA": ["italics A"] }
      },
      {
        "url": "https://www.sitea.com/redirect/pageB.html",
        "actions": [],
        "mediaType": "text/html",
        "meta": {},
        "content": { "h1": ["PageB Heading Level 1"], "i.classA": ["italics B"] }
      }
    ],
    expectedCsv: [
      'url,content.h1,content.i.classA',
      '"https://www.sitea.com/redirect/main.html","Main Header 1","italics main"',
      '"https://www.sitea.com/redirect/pageA.html","PageA Heading Level 1","italics A"',
      '"https://www.sitea.com/redirect/pageB.html","PageB Heading Level 1","italics B"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Static Content', crawlDefinitions);
