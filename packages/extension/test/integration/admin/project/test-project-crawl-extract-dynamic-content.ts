import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'simple list',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/dynamic-page-simple-list.html',
      scenario: 'extract-dynamic-content',
      plugins: [
        {
          name: 'DynamicNavigationPlugin',
          opts: {
            selectors: 'li a',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'p.title\np.description',
          },
        },
      ],
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', content: [ 'Main Header 1' ], meta: {} },
      { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', content: [ 'PageA Heading Level 1', 'PageA Heading Level 2' ], meta: {} },
      { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', content: [ 'PageB Heading Level 1', 'PageB Heading Level 3' ], meta: {} },
    ],
    expectedCsv: [
      'url,content.0,content.1',
      '"https://www.sitea.com/index.html","Main Header 1",""',
      '"https://www.sitea.com/pageA.html","PageA Heading Level 1","PageA Heading Level 2"',
      '"https://www.sitea.com/pageB.html","PageB Heading Level 1","PageB Heading Level 3"',
    ],
    csvLineSeparator: '\n',
  },
];

// crawlProjectBaseSuite('Extract Dynamic Content', crawlDefinitions, false);
