import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'load more article list, static initial article list with "load more" button, article details on separate page, single content selector',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html',
      scenario: 'get-set-fetch-scenario-scrape-dynamic-content',
      plugins: [
        {
          name: 'DynamicNavigationPlugin',
          opts: {
            selectors: 'a.more # content',
            maxResources: -1,
          },
        },
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            maxDepth: -1,
            maxResources: -1,
            selectors: '.articles a # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1\np.brief',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ 'Article List' ], 'p.brief': [ ] },
        actions: [],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ ], 'p.brief': [ ] },
        actions: [ 'Load more articles#1' ],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [], 'p.brief': [] },
        actions: [ 'Load more articles#2' ],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/articleA.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ 'Article A' ], 'p.brief': [ 'Article A brief content' ] },
        actions: [],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/articleB.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ 'Article B' ], 'p.brief': [ 'Article B brief content' ] },
        actions: [],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/articleC.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ 'Article C' ], 'p.brief': [ 'Article C brief content' ] },
        actions: [],
      },
      {
        url: 'https://www.sitea.com/dynamic/articles/articleD.html',
        mediaType: 'text/html',
        meta: {},
        content: { h1: [ 'Article D' ], 'p.brief': [ 'Article D brief content' ] },
        actions: [],
      },
    ],
    expectedCsv: [
      'url,actions.0,content.h1.0,content.p.brief.0',
      '"https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html","","Article List",""',
      '"https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html","Load more articles#1","",""',
      '"https://www.sitea.com/dynamic/articles/dynamic-page-article-list-detail-different-urls.html","Load more articles#2","",""',
      '"https://www.sitea.com/dynamic/articles/articleB.html","","Article B","Article B brief content"',
      '"https://www.sitea.com/dynamic/articles/articleA.html","","Article A","Article A brief content"',
      '"https://www.sitea.com/dynamic/articles/articleC.html","","Article C","Article C brief content"',
      '"https://www.sitea.com/dynamic/articles/articleD.html","","Article D","Article D brief content"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'simple product list, product detail is loaded below the list, single content selector, maxResources = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/dynamic/products/dynamic-page-product-list-detail-same-dom.html',
      scenario: 'get-set-fetch-scenario-extract-dynamic-content',
      plugins: [
        {
          name: 'DynamicNavigationPlugin',
          opts: {
            selectors: 'li a # content',
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
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [], 'p.description': [] },
      },
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [ 'productA#1' ],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [ 'productA' ], 'p.description': [ 'descriptionA' ] },
      },
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [ 'productB#1' ],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [ 'productB' ], 'p.description': [ 'descriptionB' ] },
      },
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [ 'productC#1' ],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [ 'productC' ], 'p.description': [ 'descriptionC' ] },
      },
    ],
    expectedCsv: [
      'url,actions.0,content.p.description.0,content.p.title.0',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","","",""',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","productA#1","descriptionA","productA"',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","productB#1","descriptionB","productB"',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","productC#1","descriptionC","productC"',
    ],
    csvLineSeparator: '\n',
  },
  {
    title: 'simple product list, product detail is loaded below the list, single content selector, maxResources = 2',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/dynamic/products/dynamic-page-product-list-detail-same-dom.html',
      scenario: 'get-set-fetch-scenario-extract-dynamic-content',
      plugins: [
        {
          name: 'DynamicNavigationPlugin',
          opts: {
            selectors: 'li a # content',
            maxResources: 3,
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
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [], 'p.description': [] },
      },
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [ 'productA#1' ],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [ 'productA' ], 'p.description': [ 'descriptionA' ] },
      },
      {
        url: 'https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html',
        actions: [ 'productB#1' ],
        mediaType: 'text/html',
        meta: {},
        content: { 'p.title': [ 'productB' ], 'p.description': [ 'descriptionB' ] },
      },
    ],
    expectedCsv: [
      'url,actions.0,content.p.description.0,content.p.title.0',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","","",""',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","productA#1","descriptionA","productA"',
      '"https://www.sitea.com/dynamic-page-product-list-detail-same-dom.html","productB#1","descriptionB","productB"',
    ],
    csvLineSeparator: '\n',
  },

  // advanced product list with cancel simple product list, product detail is loaded below the list, single content selector, maxResources = 2
  // simple product list with preloader, settimeout

];

crawlProjectBaseSuite('Extract Dynamic Content', [ crawlDefinitions[0] ], false);
