import { assert } from 'chai';
import SchemaHelper from '../lib/schema/SchemaHelper';

describe('Test Schema Helper', () => {
  it('parse normal string', async () => {
    const schemaWithDefault = {
      type: 'string',
      default: 'valA',
    };

    let inst = SchemaHelper.instantiate(schemaWithDefault, undefined);
    assert.strictEqual(inst, 'valA');

    inst = SchemaHelper.instantiate(schemaWithDefault, 'valB');
    assert.strictEqual(inst, 'valB');

    const schemaWithConst = {
      type: 'string',
      const: 'valA',
    };

    inst = SchemaHelper.instantiate(schemaWithConst, undefined);
    assert.strictEqual(inst, 'valA');

    inst = SchemaHelper.instantiate(schemaWithConst, 'valB');
    assert.strictEqual(inst, 'valB');
  });

  it('parse regexp string', async () => {
    const schemaWithDefault = {
      type: 'string',
      format: 'regexp',
      default: '/valA/i',
    };

    let inst = SchemaHelper.instantiate(schemaWithDefault, undefined);
    assert.strictEqual(inst.toString(), /valA/i.toString());

    inst = SchemaHelper.instantiate(schemaWithDefault, '/valB/');
    assert.strictEqual(inst.toString(), /valB/.toString());

    const schemaNoDefault = {
      type: 'string',
      format: 'regexp',
    };

    inst = SchemaHelper.instantiate(schemaNoDefault, undefined);
    assert.strictEqual(inst, undefined);

    inst = SchemaHelper.instantiate(schemaNoDefault, '/valB/');
    assert.strictEqual(inst.toString(), /valB/.toString());
  });

  it('parse integer', async () => {
    const schemaWithDefault = {
      type: 'integer',
      default: '2',
    };

    let inst = SchemaHelper.instantiate(schemaWithDefault, undefined);
    assert.strictEqual(inst, 2);

    inst = SchemaHelper.instantiate(schemaWithDefault, '5');
    assert.strictEqual(inst, 5);

    inst = SchemaHelper.instantiate(schemaWithDefault, 0);
    assert.strictEqual(inst, 0);

    const schemaWithConst = {
      type: 'integer',
      const: '2',
    };

    inst = SchemaHelper.instantiate(schemaWithConst, undefined);
    assert.strictEqual(inst, 2);

    inst = SchemaHelper.instantiate(schemaWithConst, '5');
    assert.strictEqual(inst, 5);

    inst = SchemaHelper.instantiate(schemaWithConst, 0);
    assert.strictEqual(inst, 0);
  });

  it('parse number', async () => {
    const schemaWithDefault = {
      type: 'number',
      default: '2.01',
    };

    let inst = SchemaHelper.instantiate(schemaWithDefault, undefined);
    assert.strictEqual(inst, 2.01);

    inst = SchemaHelper.instantiate(schemaWithDefault, '5.01');
    assert.strictEqual(inst, 5.01);

    inst = SchemaHelper.instantiate(schemaWithDefault, 0);
    assert.strictEqual(inst, 0);

    const schemaWithConst = {
      type: 'number',
      const: '2.01',
    };

    inst = SchemaHelper.instantiate(schemaWithConst, undefined);
    assert.strictEqual(inst, 2.01);

    inst = SchemaHelper.instantiate(schemaWithConst, '5.01');
    assert.strictEqual(inst, 5.01);

    inst = SchemaHelper.instantiate(schemaWithConst, 0);
    assert.strictEqual(inst, 0);
  });

  it('parse boolean', async () => {
    const schema = {
      type: 'boolean',
      default: true,
    };

    let inst = SchemaHelper.instantiate(schema, undefined);
    assert.strictEqual(inst, true);

    inst = SchemaHelper.instantiate(schema, 'false');
    assert.strictEqual(inst, false);

    inst = SchemaHelper.instantiate(schema, false);
    assert.strictEqual(inst, false);

    inst = SchemaHelper.instantiate(schema, 'true');
    assert.strictEqual(inst, true);

    inst = SchemaHelper.instantiate(schema, true);
    assert.strictEqual(inst, true);
  });

  it('parse object', async () => {
    const schema = {
      type: 'object',
      properties: {
        propA: {
          type: 'string',
        },
        propB: {
          type: 'string',
        },
      },
    };

    const data = { propA: 'valA', propB: 'valB' };
    const inst = SchemaHelper.instantiate(schema, data);
    assert.deepOwnInclude(inst, data);
  });
});
