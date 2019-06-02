export default {
  type: 'object',
  required: ['extensionRe'],
  properties: {
    extensionRe: {
      type: 'string',
      subType: 'regexp',
      title: 'Extensions',
      description: 'File extensions you want to save.',
      default: '/^(gif|png|jpg|jpeg)$/i'
    }
  }
};