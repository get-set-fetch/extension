export default {
  'ui:order': ['description', 'link', 'extensionRe', 'maxDepth'],
  'description': {
    'ui:widget': 'ScenarioDescription',
    'ui:options': {
      label: false
    }
  },
  'link': {
    'ui:widget': 'ScenarioLink',
    'ui:options': {
      label: false
    }
  },
  'extensionRe': {
    'ui:help': 'File extensions you want to save'
  }
};