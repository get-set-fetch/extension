import { assert } from 'chai';
import { BasePlugin } from 'get-set-fetch-extension-commons/lib/plugin';


describe('Test Base Plugin', () => {
  class SimplePlugin extends BasePlugin {
    getOptsSchema() { return {} }
    test() { return true }
    apply() { }
  }

  let plugin: SimplePlugin;

  before(() => {
    plugin = new SimplePlugin();
  });

  it('diff, result contains scalar array', () => {
    const result1 = { entries: ['entry1', 'entry2'] };
    const result2 = { entries: ['entry1', 'entry2'] };
    const result3 = { entries: ['entry1', 'entry2', 'entry3'] };

    let resultDiff: any;
    resultDiff = plugin.diffAndMergeResult(result1)
    assert.deepEqual(resultDiff, result1);

    resultDiff = plugin.diffAndMergeResult(result2)
    assert.deepEqual(resultDiff, { entries: [] });

    resultDiff = plugin.diffAndMergeResult(result3)
    assert.deepEqual(resultDiff, { entries: ['entry3'] });
  });

  it('diff, result contains nested scalar array', () => {
    const result1 = { info: { 'h1': ['h1a', 'h1b'] } }
    const result2 = { info: { 'h1': ['h1a', 'h1b'] } }
    const result3 = { info: { 'h1': ['h1a', 'h1b', 'h1c'], 'h2': ['h2a'] } }

    let resultDiff: any;
    resultDiff = plugin.diffAndMergeResult(result1)
    assert.deepEqual(resultDiff, result1);

    resultDiff = plugin.diffAndMergeResult(result2)
    assert.deepEqual(resultDiff, { info: { 'h1': [] } });

    resultDiff = plugin.diffAndMergeResult(result3)
    assert.deepEqual(resultDiff, { info: { 'h1': ['h1c'], 'h2': ['h2a'] } });
  });

  it('diff, result contains obj array', () => {
    const result1 = { entries: [{ title: 'entry1' }, { title: 'entry2' }] };
    const result2 = { entries: [{ title: 'entry1' }, { title: 'entry2' }] };
    const result3 = { entries: [{ title: 'entry1' }, { title: 'entry2' }, { title: 'entry3' }] };

    let resultDiff: any;
    resultDiff = plugin.diffAndMergeResult(result1)
    assert.deepEqual(resultDiff, result1);

    resultDiff = plugin.diffAndMergeResult(result2)
    assert.deepEqual(resultDiff, { entries: [] });

    resultDiff = plugin.diffAndMergeResult(result3)
    assert.deepEqual(resultDiff, { entries: [{ title: 'entry3' }] });
  });


});
