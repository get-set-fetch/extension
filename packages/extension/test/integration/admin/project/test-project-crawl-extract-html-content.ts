import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

/*
regarding project.plugins we only need to define the plugin properties different from default values
only these need to be updated from UI
*/
const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'no maxDepth limit',
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
        mediaType: 'text/html',
        info: { content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] } },
      },
      {
        url: 'https://www.sitea.com/pageA.html',
        mediaType: 'text/html',
        info: { content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] } },
      },
      {
        url: 'https://www.sitea.com/pageB.html',
        mediaType: 'text/html',
        info: { content: { h1: [ 'PageB Heading Level 1' ], 'i.classA': [ 'italics B1', 'italics B2' ] } },
      },
    ],
    expectedCsv: [ 'url,info.content.h1.0,info.content.i.classA.0,info.content.i.classA.1',
      '"https://www.sitea.com/index.html","Main Header 1","italics main",""',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","italics A",""',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 1","italics B1","italics B2"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0',
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
        mediaType: 'text/html',
        info: { content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] } },
      },
    ],
    expectedCsv: [
      'url,info.content.h1.0,info.content.i.classA.0',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 1',
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
        mediaType: 'text/html',
        info: { content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] } },
      },
      {
        url: 'https://www.sitea.com/pageA.html',
        mediaType: 'text/html',
        info: { content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] } },
      },
    ],
    expectedCsv: [
      'url,info.content.h1.0,info.content.i.classA.0',
      '"https://www.sitea.com/index.html","Main Header 1","italics main"',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","italics A"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0 with scroll lazy loading maxScrollNo = -1',
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
        mediaType: 'text/html',
        info: { content: { h5: [
          'Entry title 0',
          'Entry title 1',
          'Entry title 2',
          'Entry title 3',
          'Entry title 4',
          'Entry title 5',
        ] } },
      },
    ],
    expectedCsv: [
      'url,info.content.h5.0,info.content.h5.1,info.content.h5.2,info.content.h5.3,info.content.h5.4,info.content.h5.5',
      '"https://www.sitea.com/pageC.html","Entry title 0","Entry title 1","Entry title 2","Entry title 3","Entry title 4","Entry title 5"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'maxDepth = 0 with scroll lazy loading maxScrollNo = 1',
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
        mediaType: 'text/html',
        info: { content: { h5: [
          'Entry title 0',
          'Entry title 1',
          'Entry title 2',
          'Entry title 3',
        ] } },
      },
    ],
    expectedCsv: [
      'url,info.content.h5.0,info.content.h5.1,info.content.h5.2,info.content.h5.3',
      '"https://www.sitea.com/pageC.html","Entry title 0","Entry title 1","Entry title 2","Entry title 3"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Html Content', crawlDefinitions);
