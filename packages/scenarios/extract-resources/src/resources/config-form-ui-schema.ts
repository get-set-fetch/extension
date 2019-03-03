export default {
  'ui:order': ['description', 'link', 'extensions', 'maxDepth'],
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
  'extensions': {
    'ui:help': 'File extensions you want to save'
  }
};