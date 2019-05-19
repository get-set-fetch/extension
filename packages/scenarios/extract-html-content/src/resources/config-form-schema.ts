export default {
  type: 'object',
  required: ['selectors'],
  properties: {
    selectors: {
      type: 'string',
      title: 'Html Selector(s)',
      default: 'h1\nh2\nh3'
    }
  }
};