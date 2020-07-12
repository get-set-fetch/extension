/* eslint-disable max-len */
import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1, extract images',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links\nimg # follow images',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: ' ',
          },
        },
      ],
    },
    expectedResourceFields: [ 'url', 'actions', 'mediaType', 'meta', 'content', 'parent' ],
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {},
        parent: null,
      },
      { url: 'https://www.sitea.com/static/pageA.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {},
        parent: {
          linkText: 'pageA',
        } },
      { url: 'https://www.sitea.com/static/pageB.html',
        actions: [],
        mediaType: 'text/html',
        content: {},
        meta: {},
        parent: {
          linkText: 'pageB',
        } },
      { url: 'https://www.sitea.com/img/imgA-150.png',
        actions: [],
        mediaType: 'image/png',
        content: {},
        meta: { },
        parent: {
          imgAlt: 'alt-imgA-150',
        } },
      { url: 'https://www.sitea.com/img/imgB-850.png',
        actions: [],
        mediaType: 'image/png',
        content: {},
        meta: {},
        parent: {
          imgAlt: 'alt-imgB-850',
        } },
    ],
  },
  {
    title: 'default maxDepth = -1, extract pdfs, named after parent linkText',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links\na[href$=".pdf"] # follow pdf links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: ' ',
          },
        },
      ],
    },
    expectedResourceFields: [ 'url', 'actions', 'mediaType', 'meta', 'content', 'parent' ],
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: null },
      { url: 'https://www.sitea.com/static/pageA.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: { linkText: 'pageA' } },
      { url: 'https://www.sitea.com/static/pageB.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: { linkText: 'pageB' } },
      { url: 'https://www.sitea.com/pdf/pdfA-150.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {}, parent: { linkText: 'pdf A' } },
      { url: 'https://www.sitea.com/pdf/pdfB-850.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {}, parent: { linkText: 'pdf B' } },
    ],
    expectedZipEntries: [
      'pdf A.pdf',
      'pdf B.pdf',
    ],
  },
  {
    title: 'default maxDepth = -1, extract pdfs, named after parent title',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins: [
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: 'a[href$=".html"] # follow html links\na[href$=".pdf"],h1 # follow pdf links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: ' ',
          },
        },
      ],
    },
    expectedResourceFields: [ 'url', 'actions', 'mediaType', 'meta', 'content', 'parent' ],
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: null },
      { url: 'https://www.sitea.com/static/pageA.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: { linkText: 'pageA' } },
      { url: 'https://www.sitea.com/static/pageB.html', actions: [], mediaType: 'text/html', content: {}, meta: {}, parent: { linkText: 'pageB' } },
      { url: 'https://www.sitea.com/pdf/pdfA-150.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {}, parent: { linkText: 'pdf A', title: 'PageA Heading Level 1' } },
      { url: 'https://www.sitea.com/pdf/pdfB-850.pdf', actions: [], mediaType: 'application/pdf', content: {}, meta: {}, parent: { linkText: 'pdf B', title: 'PageB Heading Level 1' } },
    ],
    expectedZipEntries: [
      'PageA Heading Level 1-pdf A.pdf',
      'PageB Heading Level 1-pdf B.pdf',
    ],
  },

];

crawlProjectBaseSuite('Extract Resources', crawlDefinitions);
