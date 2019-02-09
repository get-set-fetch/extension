import { assert } from 'chai';
import SchemaHelper from '../../src/js/schema/SchemaHelper';

describe('Test Schema Helper', () => {
  it('parse normal string', async () => {
    const schema = {
      type: 'string',
      default: 'valA'
    };

    let inst = SchemaHelper.instantiate(schema, undefined);
    assert.strictEqual(inst, 'valA');

    inst = SchemaHelper.instantiate(schema, 'valB');
    assert.strictEqual(inst, 'valB');
  });

  it('parse regexp string', async () => {
    const schema = {
      type: 'string',
      subType: 'regexp',
      default: '/valA/i'
    };

    let inst = SchemaHelper.instantiate(schema, undefined);
    assert.strictEqual(inst.toString(), /valA/i.toString());

    inst = SchemaHelper.instantiate(schema, '/valB/');
    assert.strictEqual(inst.toString(), /valB/.toString());
  });

  it('parse number', async () => {
    const schema = {
      type: 'number',
      default: '2'
    };

    let inst = SchemaHelper.instantiate(schema, undefined);
    assert.strictEqual(inst, 2);

    inst = SchemaHelper.instantiate(schema, '5');
    assert.strictEqual(inst, 5);
  });

  it('parse boolean', async () => {
    const schema = {
      type: 'boolean',
      default: true
    };

    let inst = SchemaHelper.instantiate(schema, undefined);
    assert.strictEqual(inst, true);

    inst = SchemaHelper.instantiate(schema, 'false');
    assert.strictEqual(inst, false);
  });

  it('parse object', async () => {
    const schema = {
      type: 'object',
      properties: {
        propA: {
          type: 'string'
        },
        propB: {
          type: 'string'
        }
      }
    };

    const data = { propA: 'valA', propB: 'valB' };
    const inst = SchemaHelper.instantiate(schema, data);
    assert.deepOwnInclude(inst, data);
  });
});
