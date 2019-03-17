import { assert } from 'chai';
import { createSandbox } from 'sinon';
import ExtractUrlPlugin from '../../../src/ts/plugins/builtin/ExtractUrlPlugin';

describe('Test Extract Url Plugin', () => {
  let sandbox;
  let stubDocument;
  let extractUrlPlugin;

  beforeEach(() => {
    sandbox = createSandbox();
    stubDocument = sandbox.stub(window.document, 'getElementsByTagName');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test media type - default options', () => {
    extractUrlPlugin = new ExtractUrlPlugin({});
    assert.isTrue(extractUrlPlugin.test({ mediaType: 'text/html' }));
    assert.isFalse(extractUrlPlugin.test({ mediaType: 'text/plain' }));
  });

  it('extract unique urls - default options', () => {
    extractUrlPlugin = new ExtractUrlPlugin({});

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
    const { urlsToAdd } = extractUrlPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 });
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract unique urls - include images', () => {
    extractUrlPlugin = new ExtractUrlPlugin({ extensionRe: '/^(html|png)$/i' });

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
    const { urlsToAdd } = extractUrlPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 });
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  // it('extract unique urls - restricted by maxDepth', () => {
});
