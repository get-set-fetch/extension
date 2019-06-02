export default {
  type: 'object',
  required: ['selectors'],
  properties: {
    selectors: {
      type: 'string',
      title: 'Html Selector(s)',
      description: 'Selectors used for selecting html nodes via document.querySelectorAll. Enter one selector per line.',
      default: 'h1\nh2\nh3',
      ui: {
        customField: 'LongTextField',
        rows: 4
      }
    }
  }
};