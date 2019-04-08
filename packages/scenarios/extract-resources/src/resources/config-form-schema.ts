export default {
  type: 'object',
  required: ['extensionRe', 'maxDepth'],
  properties: {
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