export default {
  type: 'object',
  required: ['extensions', 'maxDepth'],
  properties: {
    description: {
      type: 'string',
      title: 'Description',
      default: 'Extract Resources scenario is used for extracting various resources from the corresponding sites.'
    },
    link: {
      type: 'string',
      title: 'HomePage',
      default: 'http://www.aaa'
    },
    extensions: {
      type: 'string',
      title: 'Extensions',
      default: 'gif, jpg, png'
    },
    maxDepth: {
      type: 'string',
      title: 'Maximum crawl depth',
      default: '1'
    }
  }
};