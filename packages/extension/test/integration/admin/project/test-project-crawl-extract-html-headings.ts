import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'extract-html-headings',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            selectors: 'a[href$=".html"] # follow html links',
            maxDepth: -1,
            maxResources: -1,
          },
        },
      ],
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: [ 'Main Header 1' ],
        meta: {} },
      { url: 'https://www.sitea.com/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: [ 'PageA Heading Level 1', 'PageA Heading Level 2' ],
        meta: {} },
      { url: 'https://www.sitea.com/pageB.html',
        actions: [],
        mediaType: 'text/html',
        content: [ 'PageB Heading Level 1', 'PageB Heading Level 3' ],
        meta: {} },
    ],
    expectedCsv: [
      'url,content',
      '"https://www.sitea.com/index.html","Main Header 1"',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1"',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 2"',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 1"',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 3"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Html Headings', crawlDefinitions);
