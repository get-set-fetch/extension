import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

/*
regarding project.plugins we only need to define the plugin properties different from default values
only these need to be updated from UI
*/
const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'maxDepth = 0, maxResources = -1,  infinite scrolling loading maxOperations = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/pageC.html',
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
            selectors: 'h5 # headlines',
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
        url: 'https://www.sitea.com/static/pageC.html',
        actions: [],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 0',
          'Entry title 1',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageC.html',
        actions: [ 'scroll#1' ],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 2',
          'Entry title 3',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageC.html',
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
      'url,content.h5',
      '"https://www.sitea.com/static/pageC.html","Entry title 0"',
      '"https://www.sitea.com/static/pageC.html","Entry title 1"',
      '"https://www.sitea.com/static/pageC.html","Entry title 2"',
      '"https://www.sitea.com/static/pageC.html","Entry title 3"',
      '"https://www.sitea.com/static/pageC.html","Entry title 4"',
      '"https://www.sitea.com/static/pageC.html","Entry title 5"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0,  maxResources = -1, infinite scrolling loading maxOperations = 1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/pageC.html',
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
            selectors: 'h5 #headlines',
          },
        },
        {
          name: 'ScrollPlugin',
          opts: {
            enabled: true,
            maxOperations: 1,
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/pageC.html',
        actions: [],
        mediaType: 'text/html',
        content: { h5: [
          'Entry title 0',
          'Entry title 1',
        ] },
        meta: {},
      },
      {
        url: 'https://www.sitea.com/static/pageC.html',
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
      'url,content.h5',
      '"https://www.sitea.com/static/pageC.html","Entry title 0"',
      '"https://www.sitea.com/static/pageC.html","Entry title 1"',
      '"https://www.sitea.com/static/pageC.html","Entry title 2"',
      '"https://www.sitea.com/static/pageC.html","Entry title 3"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Static Content Infinite Scrolling', crawlDefinitions);
