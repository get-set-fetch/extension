import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'no maxDepth limit',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      crawlOpts: {
        maxDepth: -1,
      },
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA',
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
      crawlOpts: {
        maxDepth: 0,
      },
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA',
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
      crawlOpts: {
        maxDepth: 1,
      },
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA',
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
];

crawlProjectBaseSuite('Extract Html Content', crawlDefinitions);
