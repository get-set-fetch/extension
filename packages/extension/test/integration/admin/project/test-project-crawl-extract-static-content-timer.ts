import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'continuously updated DOM, DOM stability can\'t be achieved',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/static/timer.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'FetchPlugin',
          opts: {
            stabilityTimeout: 500,
            maxStabilityWaitingTime: 1000,
          },
        },
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
            selectors: 'h1.title # headlines',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/static/timer.html',
        actions: [],
        mediaType: 'text/html',
        content: { 'h1.title': [ 'Timer Title' ] },
        meta: {},
      },
    ],
    expectedCsv: [ 'url,content.h1.title',
      '"https://www.sitea.com/static/timer.html","Timer Title"'
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Static Content', crawlDefinitions);
