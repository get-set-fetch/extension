import { assert } from 'chai';
import IdbStorage from '../../src/js/storage/IdbStorage';

const conn = { info: 'IndexedDB' };

describe(`Test Storage Resource - CRUD, using connection ${conn.info}`, () => {
  let Site = null;
  let Resource = null;
  const expectedResource = {
      id: null,
      siteId: null,
      url: 'http://siteA/resourceA',
      info: { propA: 'valA' },
      content: Buffer.from('contentA'),
      contentType: 'text/plain'
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
      resource.content = expectedResource.content;
      resource.contentType = expectedResource.contentType;
      await resource.save();
      assert.isNotNull(resource.id);
      expectedResource.id = resource.id;
    });

  after(async () => {
      await IdbStorage.close();
    });

  it('get', async () => {
      // get resource by id
      const resourceById = await Resource.get(expectedResource.id);
      assert.instanceOf(resourceById, Resource);
      assert.strictEqual(String(expectedResource.siteId), String(resourceById.siteId));
      assert.strictEqual(expectedResource.url, resourceById.url);
      assert.strictEqual(expectedResource.info.propA, resourceById.info.propA);
      assert.strictEqual(true, expectedResource.content.equals(resourceById.content));
      assert.strictEqual(expectedResource.contentType, resourceById.contentType);

      // get resource by url
      const resourceByUrl = await Resource.get(expectedResource.url);
      assert.instanceOf(resourceByUrl, Resource);
      assert.strictEqual(String(expectedResource.id), String(resourceByUrl.id));
      assert.strictEqual(String(expectedResource.siteId), String(resourceByUrl.siteId));
      assert.strictEqual(expectedResource.info.propA, resourceByUrl.info.propA);
      assert.strictEqual(true, expectedResource.content.equals(resourceById.content));
      assert.strictEqual(expectedResource.contentType, resourceById.contentType);
    });

  it('update', async () => {
      // update resource
      const updateResource = await Resource.get(expectedResource.id);
      updateResource.url = 'http://siteA/resourceA_updated';
      updateResource.info = { propA: 'valA_changed' };
      updateResource.content = 'contentA_changed';
      await updateResource.update();
      updateResource.content = 'contentA_changed1';

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.strictEqual(String(expectedResource.siteId), String(getResource.siteId));
      assert.strictEqual(updateResource.url, getResource.url);
      assert.strictEqual(updateResource.info.propA, getResource.info.propA);
      assert.strictEqual(updateResource.contentType, getResource.contentType);
    });

  it('update binary content', async () => {
      // update resource
      const updateResource = await Resource.get(expectedResource.id);
      updateResource.content = Buffer.alloc(2, 1);
      updateResource.contentType = 'utf8';
      await updateResource.update();

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.strictEqual(true, updateResource.content.equals(getResource.content));
      assert.strictEqual(updateResource.contentType, getResource.contentType);
    });

  it('delete', async () => {
      // delete site
      const delResource = await Resource.get(expectedResource.id);
      await delResource.del();

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.isNull(getResource);
    });
});
