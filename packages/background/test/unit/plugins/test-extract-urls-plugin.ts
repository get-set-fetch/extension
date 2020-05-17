import { assert } from 'chai';
import { createSandbox } from 'sinon';
import ExtractUrlsPlugin from '../../../src/ts/plugins/builtin/ExtractUrlsPlugin';
import IdbSite from '../../../src/ts/storage/IdbSite';

describe('Test Extract Urls Plugin', () => {
  let sandbox;
  let stubDocument;
  let extractUrlsPlugin: ExtractUrlsPlugin;
  let site: IdbSite;

  before(() => {
    site = new IdbSite();
    site.resourcesNo = 0;
  });

  beforeEach(() => {
    sandbox = createSandbox();
    stubDocument = sandbox.stub(window.document, 'querySelectorAll');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test media type - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});
    assert.isFalse(extractUrlsPlugin.test(site, { mediaType: 'text/html', depth: 0 } as any));
    assert.isTrue(extractUrlsPlugin.test(site, { mediaType: 'text/html', depth: 0, crawlInProgress: true } as any));
    assert.isFalse(extractUrlsPlugin.test(site, { mediaType: 'text/plain', depth: 0 } as any));
  });

  it('extract unique urls - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin();

    stubDocument.withArgs('a[href$=".html"]').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html#fragment1', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html#fragment2', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
    ]);

    const expectedValidUrls = [
      {
        url: 'http://sitea.com/page1.html',
        parent: {
          linkText: 'page1',
        },
      },
    ];
    // eslint-disable-next-line prefer-spread
    const { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });

  it('extract unique urls - include images', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a\nimg' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
    ]);

    const expectedValidUrls = [
      {
        url: 'http://sitea.com/page1.html',
        parent: {
          linkText: 'page1',
        },
      },
      {
        url: 'http://sitea.com/img1.png',
        parent: {
          imgAlt: 'img1',
        },
      },
    ];
    // eslint-disable-next-line prefer-spread
    const { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });

  it('extract unique urls - include title selector', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a,h1.title' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'export' },
      { href: 'http://sitea.com/page2.html', innerText: 'export' },
    ]);

    stubDocument.withArgs('h1.title').returns([
      { innerText: 'page1 title' },
      { innerText: 'page2 title' },
    ]);

    const expectedValidUrls = [
      {
        url: 'http://sitea.com/page1.html',
        parent: {
          linkText: 'export',
          title: 'page1 title',
        },
      },
      {
        url: 'http://sitea.com/page2.html',
        parent: {
          linkText: 'export',
          title: 'page2 title',
        },
      },
    ];
    // eslint-disable-next-line prefer-spread
    const { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });

  it('extract based on selectors with comments, spaces or empty', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a#id1\na # some comment \n  \n' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
    ]);
    stubDocument.withArgs('a#id1').returns([
      { href: 'http://sitea.com/page2.html', innerText: 'page2' },
    ]);

    const expectedValidUrls = [
      {
        url: 'http://sitea.com/page1.html',
        parent: {
          linkText: 'page1',
        },
      },
      {
        url: 'http://sitea.com/page2.html',
        parent: {
          linkText: 'page2',
        },
      },
    ];
    // eslint-disable-next-line prefer-spread
    const { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });

  it('extract based on selectors returning empty result', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a#id1' });

    stubDocument.withArgs('a#id1').returns([]);

    const expectedValidUrls = [];
    // eslint-disable-next-line prefer-spread
    const { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });

  it('extract unique urls, cumulative apply', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a\nimg' });

    // 1st apply
    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
    ]);

    let expectedValidUrls = [
      {
        url: 'http://sitea.com/page1.html',
        parent: {
          linkText: 'page1',
        },
      },
      {
        url: 'http://sitea.com/img1.png',
        parent: {
          imgAlt: 'img1',
        },
      },
    ];


    let { resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);

    // 2nd apply
    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
      { href: 'http://sitea.com/page1.html', innerText: 'page1' },
      { href: 'http://sitea.com/page2.html', innerText: 'page2' },
      { href: 'http://sitea.com/page2.html', innerText: 'page2' },
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
      { src: 'http://sitea.com/img1.png', alt: 'img1' },
      { src: 'http://sitea.com/img2.png', alt: 'img2' },
      { src: 'http://sitea.com/img2.png', alt: 'img2' },
    ]);

    expectedValidUrls = [
      {
        url: 'http://sitea.com/page2.html',
        parent: {
          linkText: 'page2',
        },
      },
      {
        url: 'http://sitea.com/img2.png',
        parent: {
          imgAlt: 'img2',
        },
      },
    ];

    ({ resourcesToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any));
    assert.sameDeepMembers(resourcesToAdd, expectedValidUrls);
  });
});
