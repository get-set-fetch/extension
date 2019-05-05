import genSuite, { ICrawlDefinition } from './test-project-crawl-base-suite';

const crawlDefinitions: ICrawlDefinition[] = [
  {
    title: 'default maxDepth = -1',
    project: {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://www.sitea.com/index.html'
    },
    scenarioProps: {
      name: 'extract-html-headings'
    },
    expectedResources: [
      { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', info: { content: ['Main Header 1'] } },
      { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', info: { content: ['PageA Heading Level 1', 'PageA Heading Level 2'] } },
      { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', info: { content: ['PageB Heading Level 1', 'PageB Heading Level 3'] } }
    ],
    expectedCsv: `url,info.content
      "https://www.sitea.com/index.html",["Main Header 1"]
      "https://www.sitea.com/pageA.html",["PageA Heading Level 1","PageA Heading Level 2"]
      "https://www.sitea.com/pageB.html",["PageB Heading Level 1","PageB Heading Level 3"]`
  }
];

genSuite('Extract Html Headings', crawlDefinitions);