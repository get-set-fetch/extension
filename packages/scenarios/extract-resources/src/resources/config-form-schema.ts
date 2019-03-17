export default {
  type: 'object',
  required: ['extensionRe', 'maxDepth'],
  properties: {
    description: {
      type: 'string',
      title: 'Description',
      default: 'Extract Resources scenario is used for extracting various resources from the corresponding sites.'
    },
    link: {
      type: 'string',
      title: 'GetSetFetch',
      default: 'http://www.getsetfetch.org/plugins'
    },
    extensionRe: {
      type: 'string',
      subType: 'regexp',
      title: 'Extensions',
      default: '/^(gif|png|jpg|jpeg)$/i'
    },
    maxDepth: {
      type: 'string',
      title: 'Maximum crawl depth',
      default: '1'
    }
  }
};