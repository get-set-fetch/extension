/* eslint-disable no-console */
/* eslint-disable no-shadow */
import * as React from 'react';
import { setIn, getIn } from 'immutable';
import { HttpMethod, IEnhancedJSONSchema,
  IProjectStorage, IScenarioStorage, IProjectConfigHash, SchemaHelper } from 'get-set-fetch-extension-commons';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import GsfClient from '../../components/GsfClient';
import ProjectBaseSchema from './schema/project-base-schema.json';
import Page from '../../layout/Page';
import GsfForm from '../../components/uniforms/GsfForm';
import GsfBridge from '../../components/uniforms/bridge/GsfBridge';
import SchemaBridgeHelper from '../../components/uniforms/bridge/GsfBridgeHelper';
import Modal from '../../components/Modal';
import { IProjectUIStorage, convertToProjectUIStorage, convertToProjectStorage } from './model/UIProject';

interface IState {
  scenarios: IScenarioStorage[];
  project: IProjectUIStorage;

  bridge: GsfBridge;

  configHash: string;
  configHashStatus: string;
}

export default class ProjectDetail extends React.Component<RouteComponentProps<{projectIdOrHash: string}>, IState> {
  static defaultProps = {
    projectIdOrHash: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      scenarios: null,
      project: null,
      bridge: null,

      configHash: null,
      configHashStatus: null,
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.configHashChangeHandler = this.configHashChangeHandler.bind(this);
    this.configHashPasteHandler = this.configHashPasteHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);

    this.loadConfigFromHash = this.loadConfigFromHash.bind(this);
  }

  async componentDidMount() {
    // load available scenarios, sort asc with builtin first
    const scenarios: IScenarioStorage[] = await GsfClient.fetch<IScenarioStorage[]>(HttpMethod.GET, 'scenarios');
    scenarios.sort((scenarioA, scenarioB) => {
      const fullNameA = `${scenarioA.builtin ? 0 : 1} ${scenarioA.name}`;
      const fullNameB = `${scenarioB.builtin ? 0 : 1} ${scenarioB.name}`;
      return fullNameA.localeCompare(fullNameB);
    });

    // load project
    let projectStorage: Partial<IProjectStorage>;
    const { projectIdOrHash } = this.props.match.params;

    // project hash is available
    // eslint-disable-next-line no-restricted-globals
    if (projectIdOrHash && isNaN(projectIdOrHash as any)) {
      projectStorage = await GsfClient.fetch<IProjectStorage>(HttpMethod.POST, 'project/config', { hash: decodeURIComponent(projectIdOrHash) });
    }
    // project id is available
    else {
      projectStorage = (
        projectIdOrHash
          ? await GsfClient.fetch<IProjectStorage>(HttpMethod.GET, `project/${projectIdOrHash}`)
          : {}
      );
    }

    const project: IProjectUIStorage = convertToProjectUIStorage(projectStorage);

    // update scenarioPkg name schema responsible for scenario select, one time operation, can be done directly on ProjectBaseSchema
    const scenarioNameSchema = ProjectBaseSchema.properties.scenarioPkg.properties.name;
    scenarioNameSchema.enum = scenarios.map(pkg => pkg.name);

    const scenarioNames = scenarios.map(scenario => (scenario.builtin ? `${scenario.name} (builtin)` : scenario.name));
    scenarioNameSchema.ui = Object.assign(scenarioNameSchema.ui, { enumNames: scenarioNames });

    this.setState(
      { scenarios },
      () => this.schemaUpdateHandler(project),
    );
  }

  async schemaUpdateHandler(project: IProjectUIStorage) {
    const scenarioName: string = project.scenarioPkg.name;
    const projectSchema: IEnhancedJSONSchema = JSON.parse(JSON.stringify(ProjectBaseSchema));

    let newProject = project;
    if (scenarioName) {
      // add all scenario info to project model
      const scenario = this.state.scenarios.find(scenario => scenario.name === scenarioName);
      newProject = setIn(newProject, [ 'scenarioPkg' ], scenario.package);

      // add plugin definitions schema to project schema
      const pluginSchemas = await GsfClient.fetch<IEnhancedJSONSchema[]>(HttpMethod.GET, `scenario/${scenarioName}/pluginSchemas`);
      const filteredPluginSchemas = this.getFilteredPluginSchemas(pluginSchemas);
      projectSchema.properties.plugins.required = [];
      filteredPluginSchemas.forEach((pluginSchema: IEnhancedJSONSchema) => {
        projectSchema.properties.plugins.properties[pluginSchema.$id] = Object.assign({ properties: {} }, pluginSchema);
        projectSchema.properties.plugins.required.push(pluginSchema.$id);
      });

      // add plugin definitions values to project model
      filteredPluginSchemas.forEach((pluginSchema: IEnhancedJSONSchema) => {
        const defaultValues = SchemaHelper.instantiate(pluginSchema, {});
        const mergedValues = Object.assign(defaultValues, getIn(newProject, [ 'plugins', pluginSchema.$id ], {}));
        newProject = setIn(newProject, [ 'plugins', pluginSchema.$id ], mergedValues);
      });
    }

    const bridge = SchemaBridgeHelper.createBridge(projectSchema, project);

    this.setState({
      project: newProject,
      bridge,
    });
  }

  getFilteredPluginSchemas(pluginSchemas: IEnhancedJSONSchema[]) {
    return pluginSchemas.map(pluginSchema => {
      const filteredPluginSchema = JSON.parse(JSON.stringify(pluginSchema)) as IEnhancedJSONSchema;
      if (filteredPluginSchema.properties) {
        let filteredRequiredProps: string[] = filteredPluginSchema.required ? filteredPluginSchema.required : [];
        filteredPluginSchema.properties = Object.keys(pluginSchema.properties).reduce(
          (acc, key) => {
            if (pluginSchema.properties[key].const === true) {
              filteredRequiredProps = filteredRequiredProps.filter(requiredProp => requiredProp !== key);
              return acc;
            }
            return Object.assign(acc, { [key]: pluginSchema.properties[key] });
          },
          {},
        );
        filteredPluginSchema.required = filteredRequiredProps;
      }
      return filteredPluginSchema;
    });
  }

  changeHandler(fieldId, value) {
    const castValue = GsfBridge.castFieldValue(fieldId, value, (this.state.bridge as any).schema);

    /*
    a schema update is required by:
    - selecting a scenario: need to load corresponding plugin schemas
    - enabling/disabling a plugin: need to add / remove plugin properties from its corresponding schema
    (if a plugin is enabled === false, its only rendered property is the enabled flag)
    */
    if (fieldId === 'scenarioPkg.name' || fieldId.split('.').pop() === 'enabled') {
      this.schemaUpdateHandler(setIn(this.state.project, fieldId.split('.'), castValue));
    }
    else {
      this.setState({ project: setIn(this.state.project, fieldId.split('.'), castValue) });
    }
  }

  configHashChangeHandler(evt: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({ configHash: evt.target.value }, this.openConfigHashModal);
  }

  configHashPasteHandler(evt: React.ClipboardEvent<HTMLTextAreaElement>) {
    this.setState({ configHash: evt.clipboardData.getData('text') });
  }

  async openConfigHashModal() {
    Modal.instance.show(
      'Configuration Hash',
      [
        <textarea
          key="textarea"
          id="configHashArea"
          rows={4}
          style={{ width: '100%' }}
          onChange={this.configHashChangeHandler}
          onPaste={this.configHashPasteHandler}
          value={this.state.configHash ? this.state.configHash : ''}
        />,
        <p key="help" style={{ marginBottom: 0 }}>Enter a project configuration hash to load its values.</p>,
        this.state.configHashStatus ? <p key="help" className="text-danger" style={{ marginBottom: 0 }}>{this.state.configHashStatus}</p> : null,
      ],
      [
        {
          title: 'Load Configuration',
          value: 'loadConfig',
          clickHandler: this.loadConfigFromHash,
          close: false,
        },
        {
          title: 'Close',
          value: 'close',
        },
      ],
    );
  }

  async loadConfigFromHash() {
    const configHash: IProjectConfigHash = { hash: this.state.configHash };
    const projectStorage: IProjectStorage = await GsfClient.fetch<IProjectStorage>(HttpMethod.POST, 'project/config', configHash);
    const project: IProjectUIStorage = convertToProjectUIStorage(projectStorage);

    if (!project) {
      this.setState({ configHashStatus: 'Could not decode config hash.' }, this.openConfigHashModal);
      return;
    }

    // make sure scenarioOpts.name is installed
    if (project.scenarioPkg.name) {
      const scenarioName = project.scenarioPkg.name;
      const scenario = this.state.scenarios.find(pkg => pkg.name === scenarioName);

      // scenario not found, user needs to install the scenario package first
      if (!scenario) {
        this.setState({ configHashStatus: `Could not find scenario "${scenarioName}", please install it first.` }, this.openConfigHashModal);
        return;
      }
    }

    // construct the project with the linked scenario
    this.schemaUpdateHandler(project);

    // close the popup
    Modal.instance.hide();
  }

  validate(formData, errors) {
    return errors;
  }

  async submitHandler() {
    const projectStorage = convertToProjectStorage(this.state.project);

    try {
      if (projectStorage.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'project', projectStorage);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'project', projectStorage);
      }
      this.props.history.push('/projects');
    }
    catch (err) {
      console.error('error saving project');
    }
  }

  render() {
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.id ? this.state.project.name : 'New Project'}
        actions={[
          <input
            key={'configHash'}
            id={'configHash'}
            type='button'
            className='btn btn-secondary float-right'
            value='Config Hash'
            onClick={() => this.setState({ configHashStatus: null, configHash: null }, this.openConfigHashModal)}
          />,
        ]}
      >
        <GsfForm
          schema={this.state.bridge}
          model={this.state.project}
          onChange={this.changeHandler}
          onSubmit={this.submitHandler}
          validate="onChangeAfterSubmit"
          showInlineError={true}
          validator={{ clean: true }}
        >
          <div className="form-group">
            <input id="save" className="btn btn-secondary" type="submit" value="Save"/>
            <NavLink id="cancel" to="/projects" className="btn btn-light ml-4">Cancel</NavLink>
          </div>
        </GsfForm>

      </Page>
    );
  }
}
