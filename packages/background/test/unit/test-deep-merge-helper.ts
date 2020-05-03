/* eslint-disable no-useless-escape */
import { assert } from 'chai';
import deepmerge from '../../src/ts/helpers/DeepMergeHelper';

describe('Test DeepMergeHelper', () => {
  it('deep merge objects', async () => {
    assert.deepEqual(
      deepmerge({}, { propA: 'valA' }),
      { propA: 'valA' },
    );

    assert.deepEqual(
      deepmerge({ propA: 'valA' }, { propA: 'valB' }),
      { propA: 'valB' },
    );

    assert.deepEqual(
      deepmerge({ propA: 'valA' }, { propB: 'valB' }),
      { propA: 'valA', propB: 'valB' },
    );
  });

  it('deep merge arr', async () => {
    assert.deepEqual(
      deepmerge({}, { propA: [ 'valA1' ] }),
      { propA: [ 'valA1' ] },
    );

    assert.deepEqual(
      deepmerge({ propA: [ 'valA1' ] }, { propA: [ 'valA2' ] }),
      { propA: [ 'valA1', 'valA2' ] },
    );

    assert.deepEqual(
      deepmerge({ propA: [ 'valA1' ] }, { propA: [ 'valA1', 'valA2' ] }),
      { propA: [ 'valA1', 'valA2' ] },
    );
  });

  it('deep merge nested arr', async () => {
    assert.deepEqual(
      deepmerge({ propArr: [ [ 'valA1', 'valB1' ] ] }, { propArr: [ [ 'valA1', 'valB2' ] ] }),
      { propArr: [ [ 'valA1', 'valB1' ], [ 'valA1', 'valB2' ] ] },
    );

    assert.deepEqual(
      deepmerge({ propArr: [ [ 'valA1', 'valB1' ], [ 'valA1', 'valB2' ] ] }, { propArr: [ [ 'valA1', 'valB2' ], [ 'valA1', 'valB3' ] ] }),
      { propArr: [ [ 'valA1', 'valB1' ], [ 'valA1', 'valB2' ], [ 'valA1', 'valB3' ] ] },
    );
  });
});
