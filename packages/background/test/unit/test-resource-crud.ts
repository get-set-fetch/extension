import { assert } from 'chai';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import IdbResource from '../../src/ts/storage/IdbResource';
import IdbSite from '../../src/ts/storage/IdbSite';

const conn = { info: 'IndexedDB' };

describe(`Test Storage Resource - CRUD, using connection ${conn.info}`, () => {
  let Site: typeof IdbSite;
  let Resource: typeof IdbResource;

  const expectedResource = {
      id: null,
      siteId: null,
      url: 'http://siteA/resourceA',
      info: { propA: 'valA' },
      blob: Buffer.from('contentA'),
      mediaType: 'text/plain'
    };

  before(async () => {
      ({ Site, Resource } = await IdbStorage.init());

      await Site.delAll();
      const site = new Site({ name: 'siteA', url: 'http://siteA' });
      await site.save();
      expectedResource.siteId = site.id;
    });

  beforeEach(async () => {
      // cleanup
      await Resource.delAll();

      // save resource
      const resource = new Resource({ siteId: expectedResource.siteId, url: expectedResource.url });
      resource.info = expectedResource.info;
      resource.blob = expectedResource.blob;
      resource.mediaType = expectedResource.mediaType;
      await resource.save();
      assert.isNotNull(resource.id);
      expectedResource.id = resource.id;
    });

  after(async () => {
      await IdbStorage.close();
    });

  it('getAll', async () => {
    // add a 2nd site
    const siteB = new Site({ name: 'siteB', url: 'http://siteB' });
    await siteB.save();

    // retrieve all resources of the 1st site
    const resourcesA = await Resource.getAll(expectedResource.siteId);
    assert.strictEqual(resourcesA.length, 1);
    assert.strictEqual(resourcesA[0].url, expectedResource.url);

    // retrieve all resources of the 2nd site
    const resourcesB = await Resource.getAll(siteB.id);
    assert.strictEqual(resourcesB.length, 1);
    assert.strictEqual(resourcesB[0].url, siteB.url);
  });

  it('get', async () => {
      // get resource by id
      const resourceById = await Resource.get(expectedResource.id);
      assert.instanceOf(resourceById, Resource);
      assert.strictEqual(String(expectedResource.siteId), String(resourceById.siteId));
      assert.strictEqual(expectedResource.url, resourceById.url);
      assert.strictEqual(expectedResource.info.propA, resourceById.info.propA);
      assert.strictEqual(true, expectedResource.blob.equals(resourceById.blob));
      assert.strictEqual(expectedResource.mediaType, resourceById.mediaType);

      // get resource by url
      const resourceByUrl = await Resource.get(expectedResource.url);
      assert.instanceOf(resourceByUrl, Resource);
      assert.strictEqual(String(expectedResource.id), String(resourceByUrl.id));
      assert.strictEqual(String(expectedResource.siteId), String(resourceByUrl.siteId));
      assert.strictEqual(expectedResource.info.propA, resourceByUrl.info.propA);
      assert.strictEqual(true, expectedResource.blob.equals(resourceById.blob));
      assert.strictEqual(expectedResource.mediaType, resourceById.mediaType);
    });

  it('update', async () => {
      // update resource
      const updateResource = await Resource.get(expectedResource.id);
      updateResource.url = 'http://siteA/resourceA_updated';
      updateResource.info = { propA: 'valA_changed' };
      updateResource.blob = 'contentA_changed';
      await updateResource.update();
      updateResource.blob = 'contentA_changed1';

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.strictEqual(String(expectedResource.siteId), String(getResource.siteId));
      assert.strictEqual(updateResource.url, getResource.url);
      assert.strictEqual(updateResource.info.propA, getResource.info.propA);
      assert.strictEqual(updateResource.mediaType, getResource.mediaType);
    });

  it('update binary content', async () => {
      // update resource
      const updateResource: IdbResource = await Resource.get(expectedResource.id);
      updateResource.blob = Buffer.alloc(2, 1);
      updateResource.mediaType = 'utf8';
      await updateResource.update();

      // get and compare
      const getResource: IdbResource  = await Resource.get(expectedResource.id);
      assert.strictEqual(true, updateResource.blob.equals(getResource.blob));
      assert.strictEqual(updateResource.mediaType, getResource.mediaType);
    });

  it('delete', async () => {
      // delete site
      const delResource: IdbResource  = await Resource.get(expectedResource.id);
      await delResource.del();

      // get and compare
      const getResource: IdbResource  = await Resource.get(expectedResource.id);
      assert.isNull(getResource);
    });
});
