import { assert } from 'chai';
import { createSandbox } from 'sinon';
import ExtractUrlsPlugin from '../../../src/ts/plugins/builtin/ExtractUrlsPlugin';

describe('Test Extract Urls Plugin', () => {
  let sandbox;
  let stubDocument;
  let extractUrlsPlugin: ExtractUrlsPlugin;

  beforeEach(() => {
    sandbox = createSandbox();
    stubDocument = sandbox.stub(window.document, 'getElementsByTagName');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test media type - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});
    assert.isTrue(extractUrlsPlugin.test({ mediaType: 'text/html' } as any));
    assert.isFalse(extractUrlsPlugin.test({ mediaType: 'text/plain' } as any));
  });

  it('extract unique urls - default options', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});

    stubDocument.withArgs('a').returns([
      { href: 'http://sitea.com/page1.html' },
      { href: 'http://sitea.com/page1.html#fragment1' },
      { href: 'http://sitea.com/page1.html#fragment2' },
      { href: 'http://sitea.com/page1.html' },
    ]);

    stubDocument.withArgs('img').returns([
      { src: 'http://sitea.com/img1.png' },
      { src: 'http://sitea.com/img1.png' },
    ]);

    const expectedValidUrls = [
      'http://sitea.com/page1.html',
    ];
    // eslint-disable-next-line prefer-spread
    const { urlsToAdd } = extractUrlsPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('extract unique urls - include images', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({ resourcePathnameRe: '/(jpg|png)$/i' });

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
    const { urlsToAdd } = extractUrlsPlugin.apply(null, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.sameMembers(urlsToAdd, expectedValidUrls);
  });

  it('compare hostnames', () => {
    extractUrlsPlugin = new ExtractUrlsPlugin({});

    // same hostnames, some domain
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('domainA.com', 'domainA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('domA.com', 'domA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('sub1.domainA.com', 'sub1.domainA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('sub1.sub2.domainA.com', 'sub1.sub2.domainA.com'));

    // different hostnames, same domain
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('subA.domainA.com', 'subB.domainA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('subA1.subA2.domainA.com', 'subB1.subB2.domainA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('subA.domainA.com', 'domainA.com'));
    assert.isTrue(extractUrlsPlugin.sameDomainHostnames('subA1.subA2.domainA.com', 'domainA.com'));

    // different hostnames, different domains
    assert.isFalse(extractUrlsPlugin.sameDomainHostnames('domainA.com', 'domainB.com'));
    assert.isFalse(extractUrlsPlugin.sameDomainHostnames('domA.com', 'domB.com'));
    assert.isFalse(extractUrlsPlugin.sameDomainHostnames('sub1.domainA.com', 'sub1.domainB.com'));
    assert.isFalse(extractUrlsPlugin.sameDomainHostnames('sub1.sub2.domainA.com', 'sub1.sub2.domainB.com'));
  });

  // it('extract unique urls - restricted by maxDepth', () => {
});
