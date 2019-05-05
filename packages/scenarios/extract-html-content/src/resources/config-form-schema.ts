export default {
  type: 'object',
  required: ['selectors', 'maxDepth'],
  properties: {
    selectors: {
      type: 'string',
      title: 'Html Selector(s)',
      default: 'h1\nh2\nh3'
    },
    maxDepth: {
      type: 'string',
      title: 'Maximum crawl depth',
      default: '1'
    }
  }
};