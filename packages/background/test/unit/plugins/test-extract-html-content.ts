import { assert } from 'chai';
import { createSandbox } from 'sinon';
import ExtractHtmlContentPlugin from '../../../src/ts/plugins/builtin/ExtractHtmlContentPlugin';
import IdbSite from '../../../src/ts/storage/IdbSite';

describe('Test Extract Html Content Plugin', () => {
  let sandbox;
  let stubQuerySelectorAll;
  let extractHtmlContentPlugin: ExtractHtmlContentPlugin;
  let site: IdbSite;

  before(() => {
    site = new IdbSite();
    site.resourcesNo = 0;
  });

  beforeEach(() => {
    sandbox = createSandbox();
    stubQuerySelectorAll = sandbox.stub(window.document, 'querySelectorAll');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('extract html content, single selector', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1' });

    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valB' },
    ]);

    const expectedContent = {
      h1: [ 'h1 valA', 'h1 valB' ],
    };

    const { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content. missing values', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1\nh2' });

    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valB' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
    ]);

    const expectedContent = {
      h1: [ 'h1 valA', 'h1 valB' ],
      h2: [ '', '' ],
    };

    const { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content - multiple selectors, duplicate values', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1\nh2' });

    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valA' },
      { innerText: 'h1 valC' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valA' },
      { innerText: 'h2 valB' },
      { innerText: 'h2 valC' },
    ]);

    const expectedContent = {
      h1: [ 'h1 valA', 'h1 valA', 'h1 valC' ],
      h2: [ 'h2 valA', 'h2 valB', 'h2 valC' ],
    };

    const { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content - multiple selectors, different result length', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1\nh2\nh3' });

    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valB' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valA' },
      { innerText: 'h2 valB' },
    ]);

    stubQuerySelectorAll.withArgs('h3').returns([
    ]);

    const expectedContent = {
      h1: [ 'h1 valA', 'h1 valB' ],
      h2: [ 'h2 valA', 'h2 valB' ],
      h3: [ '', '' ],
    };

    const { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content - multiple selectors, different result length, common base', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin(
      { selectors: '[class|= "top"] h1 \n [class |= "top"] h2\n [class  |= "top"] h3' },
    );

    stubQuerySelectorAll.withArgs('[class|="top"]').returns([
      { querySelectorAll: selector => (selector === 'h3' ? [] : [ { innerText: `${selector} valA` } ]) },
      { querySelectorAll: selector => (selector === 'h2' ? [] : [ { innerText: `${selector} valB` } ]) },
      { querySelectorAll: selector => (selector === 'h1' ? [] : [ { innerText: `${selector} valC` } ]) },
    ]);

    const expectedContent = {
      '[class|="top"] h1': [ 'h1 valA', 'h1 valB', '' ],
      '[class|="top"] h2': [ 'h2 valA', '', 'h2 valC' ],
      '[class|="top"] h3': [ '', 'h3 valB', 'h3 valC' ],
    };

    const { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content - multiple selectors, different result length, cumulative apply', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1\nh2\nh3' });

    // 1st apply
    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valA' },
      { innerText: 'h2 valB' },
      { innerText: 'h2 valC' },
    ]);

    stubQuerySelectorAll.withArgs('h3').returns([
      { innerText: 'h3 valA' },
      { innerText: 'h3 valB' },
    ]);

    let expectedContent = {
      h1: [ 'h1 valA', 'h1 valA', 'h1 valA' ],
      h2: [ 'h2 valA', 'h2 valB', 'h2 valC' ],
      h3: [ 'h3 valA', 'h3 valB', 'h3 valB' ],
    };

    let { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);

    // 2nd apply
    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valD' },
    ]);

    // also add duplicate values for selector arr content
    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valA' },
      { innerText: 'h2 valB' },
      { innerText: 'h2 valC' },
      { innerText: 'h2 valD' },
      { innerText: 'h2 valD' },
    ]);

    stubQuerySelectorAll.withArgs('h3').returns([
      { innerText: 'h3 valA' },
      { innerText: 'h3 valB' },
      { innerText: 'h3 valD' },
    ]);

    expectedContent = {
      h1: [ 'h1 valD', 'h1 valD' ],
      h2: [ 'h2 valD', 'h2 valD' ],
      h3: [ 'h3 valD', 'h3 valD' ],
    };

    ({ content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any));
    assert.deepEqual(content, expectedContent);
  });

  it('extract html content - multiple selectors, different result length, cumulative apply, partial overlap', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin({ selectors: 'h1\nh2\nh3' });

    // 1st apply
    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valA' },
      { innerText: 'h1 valB' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valA' },
      { innerText: 'h2 valB' },
    ]);

    stubQuerySelectorAll.withArgs('h3').returns([
    ]);

    let expectedContent = {
      h1: [ 'h1 valA', 'h1 valB' ],
      h2: [ 'h2 valA', 'h2 valB' ],
      h3: [ '', '' ],
    };

    let { content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any);
    assert.deepEqual(content, expectedContent);

    // 2nd apply
    stubQuerySelectorAll.withArgs('h1').returns([
      { innerText: 'h1 valB' },
      { innerText: 'h1 valC' },
    ]);

    stubQuerySelectorAll.withArgs('h2').returns([
      { innerText: 'h2 valB' },
      { innerText: 'h2 valC' },
    ]);

    stubQuerySelectorAll.withArgs('h3').returns([
      { innerText: 'h3 valC' },
    ]);

    expectedContent = {
      h1: [ 'h1 valC' ],
      h2: [ 'h2 valC' ],
      h3: [ 'h3 valC' ],
    };

    ({ content } = extractHtmlContentPlugin.apply(site, { url: 'http://sitea.com/index.html', depth: 1 } as any));
    assert.deepEqual(content, expectedContent);
  });

  it('extract valid selector base', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin();

    assert.strictEqual(
      extractHtmlContentPlugin.getSelectorBase([
        { selector: 'div.row h1', prop: 'innerText' },
        { selector: 'div.row h2', prop: 'innerText' },
        { selector: 'div.row h3', prop: 'innerText' },
      ]),
      'div.row',
    );

    assert.strictEqual(
      extractHtmlContentPlugin.getSelectorBase([
        { selector: 'div.row a.red h1', prop: 'innerText' },
        { selector: 'div.row a.red h2', prop: 'innerText' },
        { selector: 'div.row a.red h3', prop: 'innerText' },
      ]),
      'div.row a.red',
    );
  });

  it('extract null selector base', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin();

    const cssBase = extractHtmlContentPlugin.getSelectorBase([
      { selector: 'div.rowA h1', prop: 'innerText' },
      { selector: 'div.rowA h2', prop: 'innerText' },
      { selector: 'div.rowB h3', prop: 'innerText' },
    ]);
    assert.isNull(cssBase);
  });

  it('trimSelector', () => {
    extractHtmlContentPlugin = new ExtractHtmlContentPlugin();
    assert.strictEqual(extractHtmlContentPlugin.trimSelector(' div.classA '), 'div.classA');
    assert.strictEqual(extractHtmlContentPlugin.trimSelector(' div.classA div.classB '), 'div.classA div.classB');
    assert.strictEqual(extractHtmlContentPlugin.trimSelector(' [class|= "top"] h1 '), '[class|="top"] h1');
    assert.strictEqual(extractHtmlContentPlugin.trimSelector(' [class  |="top"] h1 '), '[class|="top"] h1');
    assert.strictEqual(extractHtmlContentPlugin.trimSelector(' [class  |=  "top"] h1 '), '[class|="top"] h1');
  });
});
