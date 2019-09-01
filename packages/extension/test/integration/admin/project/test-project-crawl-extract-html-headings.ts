import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
    },
    scenarioOpts: {
      name: 'extract-html-headings',
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', info: { content: [ 'Main Header 1' ] } },
      { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', info: { content: [ 'PageA Heading Level 1', 'PageA Heading Level 2' ] } },
      { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', info: { content: [ 'PageB Heading Level 1', 'PageB Heading Level 3' ] } },
    ],
    expectedCsv: [
      'url,info.content.0,info.content.1',
      '"https://www.sitea.com/index.html","Main Header 1",""',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","PageA Heading Level 2"',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 1","PageB Heading Level 3"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Html Headings', crawlDefinitions);
