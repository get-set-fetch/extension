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
      { href: 'http://sitea.com/page1.html' },
      { href: 'http://sitea.com/page1.html#fragment1' },
      { href: 'http://sitea.com/page1.html#fragment2' },
      { href: 'http://sitea.com/page1.html' },
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html',
    ];
    // eslint-disable-next-line prefer-spread
    const { urlsToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract unique urls - include images', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a\nimg' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html' },
      { href: 'http://sitea.com/page1.html' },
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png' },
      { src: 'http://sitea.com/img1.png' },
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html',
      'http://sitea.com/img1.png',
    ];
    // eslint-disable-next-line prefer-spread
    const { urlsToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract based on selectors with comments, spaces or empty', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a#id1\na # some comment \n  \n' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html' },
    ]);
    stubDocument.withArgs('a#id1').returns([
      { href: 'http://sitea.com/page2.html' },
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html',
      'http://sitea.com/page2.html',
    ];
    // eslint-disable-next-line prefer-spread
    const { urlsToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract based on selectors returning empty result', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ selectors: 'a#id1' });

    stubDocument.withArgs('a#id1').returns([]);

    const expectedValidUrls = [];
    // eslint-disable-next-line prefer-spread
    const { urlsToAdd } = extractUrlsPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });
});
