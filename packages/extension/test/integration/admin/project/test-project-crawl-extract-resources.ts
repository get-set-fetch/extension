import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1, extract images',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-extract-resources',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links\nimg # follow images',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {},
      },
      { url: 'https://www.sitea.com/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {} },
      { url: 'https://www.sitea.com/pageB.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {} },
      {
        url: 'https://www.sitea.com/img/imgA-150.png',
        actions: [],
        mediaType: 'image/png',
        content: {},
        meta: { width: 150, height: 150, name: 'imgA-150.png' },
      },
      {
        url: 'https://www.sitea.com/img/imgB-850.png',
        actions: [],
        mediaType: 'image/png',
        content: {},
        meta: { width: 850, height: 850, name: 'imgB-850.png' },
      },
    ],
    expectedCsv: [
      'url,mediaType',
      '"https://www.sitea.com/index.html","text/html"',
      '"https://www.sitea.com/pageA.html","text/html"',
      '"https://www.sitea.com/pageB.html","text/html"',
      '"https://www.sitea.com/img/imgA-150.png","image/png"',
      '"https://www.sitea.com/img/imgB-850.png","image/png"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'default maxDepth = -1, extract pdfs',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-extract-resources',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links\na[href$=".pdf"] # follow pdf links',
          },
        },
      ],
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', actions: [], mediaType: 'text/html', content: {}, meta: {} },
      { url: 'https://www.sitea.com/pageA.html', actions: [], mediaType: 'text/html', content: {}, meta: {} },
      { url: 'https://www.sitea.com/pageB.html', actions: [], mediaType: 'text/html', content: {}, meta: {} },
      { url: 'https://www.sitea.com/pdf/pdfA-150.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {} },
      { url: 'https://www.sitea.com/pdf/pdfB-850.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {} },
    ],
    expectedCsv: [
      'url,mediaType',
      '"https://www.sitea.com/index.html","text/html"',
      '"https://www.sitea.com/pageA.html","text/html"',
      '"https://www.sitea.com/pageB.html","text/html"',
      '"https://www.sitea.com/pdf/pdfA-150.pdf","application/pdf"',
      '"https://www.sitea.com/pdf/pdfB-850.pdf","application/pdf"',
    ],
    csvLineSeparator: '\n',
  },

];

crawlProjectBaseSuite('Extract Resources', crawlDefinitions);
