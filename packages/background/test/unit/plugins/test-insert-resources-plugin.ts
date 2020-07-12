import { assert } from 'chai';
import { createSandbox } from 'sinon';
import BloomFilter from 'get-set-fetch/lib/filters/bloom/BloomFilter';
import IdbSite from '../../../src/ts/storage/IdbSite';
import InsertResourcesPlugin from '../../../src/ts/plugins/builtin/InsertResourcesPlugin';
import IdbStorage from '../../../src/ts/storage/IdbStorage';

describe('Test Insert Resources Plugin', () => {
  let sandbox;
  let insertResourcesPlugin: InsertResourcesPlugin;
  let site: IdbSite;

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    await IdbStorage.init();
  });

  beforeEach(() => {
    site = new IdbSite({ url: 'index.html' });
    site.resourcesNo = 0;
    assert.isNull(site.resourceFilter);

    sandbox = createSandbox();
    sandbox.stub(site, 'saveResources').returns(null);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('when creating bloom filter for a site, also add its url as the 1st resource ', async () => {
    insertResourcesPlugin = new InsertResourcesPlugin();
    await insertResourcesPlugin.apply(site, {});

    // re-create the bloom filter based on its bitset
    assert.isDefined(site.resourceFilter);
    const bloomFilter = BloomFilter.create(insertResourcesPlugin.opts.maxEntries, insertResourcesPlugin.opts.probability, site.resourceFilter);

    assert.isTrue(bloomFilter.test('index.html'));
    assert.isFalse(bloomFilter.test('other.html'));
  });

  it('multiple apply calls', async () => {
    insertResourcesPlugin = new InsertResourcesPlugin();
    await insertResourcesPlugin.apply(site, { resourcesToAdd: [
      {
        url: 'pageA.html',
        parent: {
          linkText: 'pageA',
        },
      },
      {
        url: 'pageB.html',
        parent: {
          linkText: 'pageB',
        },
      },
    ] });
    await insertResourcesPlugin.apply(site, { resourcesToAdd: [
      {
        url: 'pageA.html',
        parent: {
          linkText: 'pageA',
        },
      },
      {
        url: 'pageB.html',
        parent: {
          linkText: 'pageB',
        },
      },
      {
        url: 'pageC.html',
        parent: {
          linkText: 'pageC',
        },
      },
    ] });

    // re-create the bloom filter based on its bitset
    assert.isDefined(site.resourceFilter);
    const bloomFilter = BloomFilter.create(insertResourcesPlugin.opts.maxEntries, insertResourcesPlugin.opts.probability, site.resourceFilter);

    assert.isTrue(bloomFilter.test('index.html'));
    assert.isTrue(bloomFilter.test('pageA.html'));
    assert.isTrue(bloomFilter.test('pageB.html'));
    assert.isTrue(bloomFilter.test('pageC.html'));
    assert.isFalse(bloomFilter.test('http://sitea.com/other.html'));
  });
});
