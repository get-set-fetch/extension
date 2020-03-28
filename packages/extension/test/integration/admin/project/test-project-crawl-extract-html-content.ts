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
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h1\ni.classA',
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
        url: 'https://www.sitea.com/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/pageB.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageB Heading Level 1' ], 'i.classA': [ 'italics B1', 'italics B2' ] },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.h1.0,content.i.classA.0,content.i.classA.1',
      '"https://www.sitea.com/index.html","Main Header 1","italics main",""',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","italics A",""',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 1","italics B1","italics B2"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'maxDepth = 0, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h1\ni.classA',
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
      'url,content.h1.0,content.i.classA.0',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
    ],
    csvLineSeparator: '\n',
  },

  {
    title: 'maxDepth = 1, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h1\ni.classA',
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
        url: 'https://www.sitea.com/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h1.0,content.i.classA.0',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","italics A"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = -1, maxResources = 2',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h1\ni.classA',
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
        url: 'https://www.sitea.com/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h1.0,content.i.classA.0',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","italics A"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0, maxResources = -1,  scroll lazy loading maxScrollNo = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/pageC.html',
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h5',
          },
        },
        {
          name: 'ScrollPlugin',
          opts: {
            enabled: true,
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/pageC.html',
        actions: [],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 0',
          'Entry title 1',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/pageC.html',
        actions: [ 'scroll#1' ],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 2',
          'Entry title 3',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/pageC.html',
        actions: [ 'scroll#2' ],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 4',
          'Entry title 5',

        ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h5.0,content.h5.1',
      '"https://www.sitea.com/pageC.html","Entry title 0","Entry title 1"',
      '"https://www.sitea.com/pageC.html","Entry title 2","Entry title 3"',
      '"https://www.sitea.com/pageC.html","Entry title 4","Entry title 5"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0,  maxResources = -1, scroll lazy loading maxScrollNo = 1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/pageC.html',
      scenario: 'get-set-fetch-scenario-extract-html-content',
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
            selectors: 'h5',
          },
        },
        {
          name: 'ScrollPlugin',
          opts: {
            enabled: true,
            maxScrollNo: 1,
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/pageC.html',
        actions: [],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 0',
          'Entry title 1',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/pageC.html',
        actions: [ 'scroll#1' ],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 2',
          'Entry title 3',
        ] },
        meta: {},
      },
    ],
    expectedCsv: [
      'url,content.h5.0,content.h5.1',
      '"https://www.sitea.com/pageC.html","Entry title 0","Entry title 1"',
      '"https://www.sitea.com/pageC.html","Entry title 2","Entry title 3"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Html Content', crawlDefinitions);
