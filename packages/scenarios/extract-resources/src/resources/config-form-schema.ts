export default {
  type: 'object',
  required: ['extensionRe'],
  properties: {
    extensionRe: {
      type: 'string',
      subType: 'regexp',
      title: 'Extensions',
      default: '/^(gif|png|jpg|jpeg)$/i'
    }
  }
};