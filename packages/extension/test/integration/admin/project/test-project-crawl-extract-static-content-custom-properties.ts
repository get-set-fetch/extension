import { crawlProjectBaseSuite, ICrawlDefinition } from 'get-set-fetch-extension-test-utils';

/*
regarding project.plugins we only need to define the plugin properties different from default values
only these need to be updated from UI
*/
const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'maxDepth = 0,  maxResources = -1, (h1,title) , (img,alt) , (a.pdf,href) , (i.classA,data-italics)',
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
            selectors: 'a[href$=".html"] # follow html links',
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h1,title #headlines\nimg,alt # alt image\na.pdf , href # pdf links\ni.classA , data-italics # custom attrs',
          },
        },
      ],
    },
    expectedResources: [
      {
        url: 'https://www.sitea.com/index.html',
        actions: [],
        mediaType: 'text/html',
        meta: { },
        content: {
          h1: [ 'main header 1 title' ],
          img: [ '' ],
          'a.pdf': [ '' ],
          'i.classA': [ 'italics main' ],
        },
      },
      {
        url: 'https://www.sitea.com/static/pageA.html',
        actions: [],
        mediaType: 'text/html',
        meta: { },
        content: {
          h1: [ 'pageA heading level 1 title' ],
          img: [ 'alt-imgA-150' ],
          'a.pdf': [ 'https://www.sitea.com/pdf/pdfA-150.pdf' ],
          'i.classA': [ 'italics A' ],
        },
      },
      {
        url: 'https://www.sitea.com/static/pageB.html',
        actions: [],
        mediaType: 'text/html',
        meta: { },
        content: {
          h1: [
            'pageB heading level 1 title',
            'pageB heading level 1 title',
          ],
          img: [
            'alt-imgA-150',
            'alt-imgB-850',
          ],
          'a.pdf': [
            'https://www.sitea.com/pdf/pdfA-150.pdf',
            'https://www.sitea.com/pdf/pdfB-850.pdf',
          ],
          'i.classA': [
            'italics B1',
            'italics B2',
          ],
        },
      },
    ],
    expectedCsv: [
      'url,content.a.pdf,content.h1,content.i.classA,content.img',
      '"https://www.sitea.com/index.html","","main header 1 title","italics main",""',
      '"https://www.sitea.com/static/pageA.html","https://www.sitea.com/pdf/pdfA-150.pdf","pageA heading level 1 title","italics A","alt-imgA-150"',
      '"https://www.sitea.com/static/pageB.html","https://www.sitea.com/pdf/pdfA-150.pdf","pageB heading level 1 title","italics B1","alt-imgA-150"',
      '"https://www.sitea.com/static/pageB.html","https://www.sitea.com/pdf/pdfB-850.pdf","pageB heading level 1 title","italics B2","alt-imgB-850"',
    ],
    csvLineSeparator: '\n',
  },
];

crawlProjectBaseSuite('Extract Static Content Custom Properties', crawlDefinitions);
