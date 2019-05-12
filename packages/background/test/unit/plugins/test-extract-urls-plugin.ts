import { assert } from 'chai';
import { createSandbox } from 'sinon';
import ExtractUrlsPlugin from '../../../src/ts/plugins/builtin/ExtractUrlsPlugin';

describe('Test Extract Urls Plugin', () => {
  let sandbox;
  let stubDocument;
  let extractUrlsPlugin;

  beforeEach(() => {
    sandbox = createSandbox();
    stubDocument = sandbox.stub(window.document, 'getElementsByTagName');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test media type - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});
    assert.isTrue(extractUrlsPlugin.test({ mediaType: 'text/html' }));
    assert.isFalse(extractUrlsPlugin.test({ mediaType: 'text/plain' }));
  });

  it('extract unique urls - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html' },
      { href: 'http://sitea.com/page1.html#fragment1' },
      { href: 'http://sitea.com/page1.html#fragment2' },
      { href: 'http://sitea.com/page1.html' }
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png' },
      { src: 'http://sitea.com/img1.png' }
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html'
    ];
    const { urlsToAdd } = extractUrlsPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 });
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract unique urls - include images', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ extensionRe: '/^(html|png)$/i' });

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html' },
      { href: 'http://sitea.com/page1.html' }
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png' },
      { src: 'http://sitea.com/img1.png' }
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html',
       'http://sitea.com/img1.png'
    ];
    const { urlsToAdd } = extractUrlsPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 });
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  // it('extract unique urls - restricted by maxDepth', () => {
});
