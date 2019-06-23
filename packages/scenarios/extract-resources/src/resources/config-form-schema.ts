export default {
  type: 'object',
  required: [ 'resourcePathnameRe' ],
  properties: {
    resourcePathnameRe: {
      type: 'string',
      subType: 'regexp',
      title: 'Resource regexp filter',
      description: 'Filter which resources you want to save.',
      default: '/(gif|png|jpg|jpeg)$/i',
    },
  },
};
