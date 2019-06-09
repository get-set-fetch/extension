import genSuite, { ICrawlDefinition } from './test-project-crawl-base-suite';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'no maxDepth limit',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      crawlOpts: {
        maxDepth: -1
      }
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA',
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['Main Header 1'], 'i.classA': ['italics main'] } }
      },
      {
        url: 'https://www.sitea.com/pageA.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['PageA Heading Level 1'], 'i.classA': ['italics A'] } }
      },
      {
        url: 'https://www.sitea.com/pageB.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['PageB Heading Level 1'], 'i.classA': ['italics B1', 'italics B2'] } }
      }
    ],
    expectedCsv: `url,info.content
      "https://www.sitea.com/index.html",{"h1":["Main Header 1"],"i.classA":["italics main"]}
      "https://www.sitea.com/pageA.html",{"h1":["PageA Heading Level 1"],"i.classA":["italics A"]}
      "https://www.sitea.com/pageB.html",{"h1":["PageB Heading Level 1"],"i.classA":["italics B1","italics B2"]}`
  },
  {
    title: 'maxDepth = 0',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      crawlOpts: {
        maxDepth: 0
      }
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA'
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['Main Header 1'], 'i.classA': ['italics main'] } }
      }
    ],
    expectedCsv: `url,info.content
      "https://www.sitea.com/index.html",{"h1":["Main Header 1"],"i.classA":["italics main"]}`
  },
  {
    title: 'maxDepth = 1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      crawlOpts: {
        maxDepth: 1
      }
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-html-content',
      selectors: 'h1\ni.classA'
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['Main Header 1'], 'i.classA': ['italics main'] } }
      },
      {
        url: 'https://www.sitea.com/pageA.html',
        mediaType: 'text/html',
        info: { content: { 'h1': ['PageA Heading Level 1'], 'i.classA': ['italics A'] } }
      }
    ],
    expectedCsv: `url,info.content
      "https://www.sitea.com/index.html",{"h1":["Main Header 1"],"i.classA":["italics main"]}
      "https://www.sitea.com/pageA.html",{"h1":["PageA Heading Level 1"],"i.classA":["italics A"]}`
  }
];

genSuite('Extract Html Content', crawlDefinitions);