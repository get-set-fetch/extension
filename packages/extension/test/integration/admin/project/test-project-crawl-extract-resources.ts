import genSuite, { ICrawlDefinition } from './test-project-crawl-base-suite';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html',
      crawlOpts: {
        maxDepth: -1
      }
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-resources',
      extensionRe: '/^(html|htm|php|png)$/i',
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', info: {} },
      { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', info: {} },
      { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', info: {} },
      { url: 'https://www.sitea.com/img/imgA-150.png', mediaType: 'image/png', info: { width: 150, height: 150, name: 'imgA-150.png' } },
      { url: 'https://www.sitea.com/img/imgB-850.png', mediaType: 'image/png', info: { width: 850, height: 850, name: 'imgB-850.png' } }
    ],
    expectedCsv: `url,mediaType
      "https://www.sitea.com/index.html","text/html"
      "https://www.sitea.com/pageA.html","text/html"
      "https://www.sitea.com/img/imgA-150.png","image/png"
      "https://www.sitea.com/pageB.html","text/html"
      "https://www.sitea.com/img/imgB-850.png","image/png"`
  }
];

genSuite('Extract Resources', crawlDefinitions);