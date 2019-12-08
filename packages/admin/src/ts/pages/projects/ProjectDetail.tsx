/* eslint-disable no-console */
/* eslint-disable no-shadow */
import * as React from 'react';
import { setIn, getIn, removeIn } from 'immutable';
import { HttpMethod, IEnhancedJSONSchema, IScenario, IProjectStorage } from 'get-set-fetch-extension-commons';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';
import { IProjectConfigHash } from 'get-set-fetch-extension-commons/lib/project';
import GsfClient from '../../components/GsfClient';
import ScenarioHelper from '../scenarios/model/ScenarioHelper';
import Project from './model/Project';
import BaseFormSchema from './schema/project-form-schema.json';
import Page from '../../layout/Page';
import GsfForm from '../../components/uniforms/GsfForm';
import GsfBridge from '../../components/uniforms/bridge/GsfBridge';
import SchemaBridgeHelper from '../../components/uniforms/bridge/GsfBridgeHelper';
import Modal from '../../components/Modal';

interface IState {
  scenarioPkgs: IScenarioPackage[];

  project: Project;
  scenario: IScenario;

  // schema defining project props without plugable scenario props
  baseProjectSchema: IEnhancedJSONSchema;
  bridge: GsfBridge;

  configHash: string;
  configHashStatus: string;
}

export default class ProjectDetail extends React.Component<RouteComponentProps<{projectId: string}>, IState> {
  static defaultProps = {
    projectId: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      scenarioPkgs: [],

      project: null,
      scenario: null,

      baseProjectSchema: BaseFormSchema as IEnhancedJSONSchema,
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
    // load project
    const { projectId } = this.props.match.params;
    const projectStorage: Partial<IProjectStorage> = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
    const project: Project = new Project(projectStorage);

    // load available scenarios
    const scenarioPkgs: IScenarioPackage[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenarioPackage[];

    // compute new baseProjectSchema for scenario dropdown
    const scenarioNameProp = Object.assign({}, this.state.baseProjectSchema.properties.scenarioOpts.properties.name);
    scenarioNameProp.enum = scenarioPkgs.map(pkg => pkg.name);
    scenarioNameProp.ui = Object.assign(scenarioNameProp.ui, { enumNames: scenarioPkgs.map(pkg => pkg.name) });
    const baseProjectSchema = setIn(this.state.baseProjectSchema, [ 'properties', 'scenarioOpts', 'properties', 'name' ], scenarioNameProp);

    this.setState(
      { scenarioPkgs, baseProjectSchema },
      () => this.scenarioChangeHandler(project),
    );
  }

  async scenarioChangeHandler(project: Project) {
    const scenario: IScenario = project.scenarioOpts.name ? await ScenarioHelper.instantiate(project.scenarioOpts.name) : null;

    const mergedSchema = this.getMergedSchema(scenario);

    let newProject = project;
    if (scenario) {
      const scenarioPkg = this.state.scenarioPkgs.find(scenarioPkg => scenarioPkg.name === project.scenarioOpts.name);
      newProject = setIn(newProject, [ 'scenarioOpts', 'name' ], scenarioPkg.package.name);
      newProject = setIn(newProject, [ 'scenarioOpts', 'description' ], scenarioPkg.package.description);
      newProject = setIn(newProject, [ 'scenarioOpts', 'homepage' ], scenarioPkg.package.homepage);
    }

    const bridge = SchemaBridgeHelper.createBridge(mergedSchema);

    this.setState({
      project: newProject,
      scenario,
      bridge,
    });
  }

  lazyLoadChangeHandler(project, enabled: boolean) {
    const { schema } = this.state.bridge as any;
    schema.properties.lazyOpts.properties.delay.ui.hidden = enabled;
    const bridge = SchemaBridgeHelper.createBridge(schema);

    this.setState({ bridge, project });
  }

  getMergedSchema(scenario: IScenario): IEnhancedJSONSchema {
    // no scenario selected, remove scenario related props
    if (!scenario) {
      let mergedSchema = removeIn(this.state.baseProjectSchema, [ 'properties', 'scenarioOpts', 'properties', 'homepage' ]);
      mergedSchema = removeIn(mergedSchema, [ 'properties', 'scenarioOpts', 'properties', 'description' ]);
      return mergedSchema;
    }

    // scenario selected, populate scenario related props from scenario schema
    const scenarioSchema = scenario.getConfigFormSchema();
    let orderedSchema = getIn(this.state.baseProjectSchema, [ 'properties', 'scenarioOpts' ], {});

    Object.keys(scenarioSchema.properties)
      .filter(scenarioKey => ![ 'name', 'description', 'homepage' ].includes(scenarioKey))
      .forEach(scenarioKey => {
        orderedSchema = setIn(orderedSchema, [ 'properties', scenarioKey ], scenarioSchema.properties[scenarioKey]);
      });

    orderedSchema.required = scenarioSchema.required;

    // merge scenario schema into the base one
    const mergedSchema = setIn(
      this.state.baseProjectSchema,
      [ 'properties', 'scenarioOpts' ],
      orderedSchema,
    );

    return mergedSchema;
  }


  async changeHandler(key, value) {
    const project = setIn(this.state.project, key.split('.'), value);

    switch (key) {
      case 'scenarioOpts.name':
        this.scenarioChangeHandler(project);
        break;
      case 'lazyOpts.enabled':
        this.lazyLoadChangeHandler(project, value);
        break;
      default:
        this.setState({ project });
    }
  }

  configHashChangeHandler(evt: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({ configHash: evt.target.value }, this.openConfigHashModal);
  }

  configHashPasteHandler(evt: React.ClipboardEvent<HTMLTextAreaElement>) {
    this.setState({ configHash: evt.clipboardData.getData('text') });
  }

  updatePluginDefOpts(pluginDefinitions, pluginName, pluginOpts) {
    const pluginDef = pluginDefinitions.find(pluginDef => pluginDef.name === pluginName);
    if (pluginDef) {
      pluginDef.opts = Object.assign(pluginDef.opts || {}, pluginOpts);
    }
  }

  async submitHandler() {
    // add plugable pluginDefinitions to current project
    const pluginDefinitions = this.state.scenario.getPluginDefinitions(this.state.project.scenarioOpts);
    this.updatePluginDefOpts(pluginDefinitions, 'SelectResourcePlugin', {
      delay: this.state.project.crawlOpts.delay,
    });
    this.updatePluginDefOpts(pluginDefinitions, 'ExtractUrlsPlugin', {
      maxDepth: this.state.project.crawlOpts.maxDepth,
      hostnameRe: this.state.project.crawlOpts.hostnameRe,
      pathnameRe: this.state.project.crawlOpts.pathnameRe,
    });
    this.updatePluginDefOpts(pluginDefinitions, 'InsertResourcesPlugin', {
      maxResources: this.state.project.crawlOpts.maxResources,
    });

    const finalProject = setIn(this.state.project, [ 'pluginDefinitions' ], pluginDefinitions);

    // remove temp scenarioOpts used just for frontend, on load they'll be derived from scenarioOpts.name
    delete finalProject.scenarioOpts.description;
    delete finalProject.scenarioOpts.homepage;

    try {
      if (this.state.project.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'project', finalProject);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'project', finalProject);
      }
      this.props.history.push('/projects');
    }
    catch (err) {
      console.error('error saving project');
    }
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
    const projectConfigHash: IProjectConfigHash = { hash: this.state.configHash };
    const projectStorage: IProjectStorage = await GsfClient.fetch(HttpMethod.POST, 'project/config', projectConfigHash) as IProjectStorage;

    if (!projectStorage) {
      this.setState({ configHashStatus: 'Could not decode config hash.' }, this.openConfigHashModal);
      return;
    }

    // make sure scenarioOpts.name is installed
    if (projectStorage.scenarioOpts.name) {
      const scenarioPkgName = projectStorage.scenarioOpts.name;
      const scenarioPkg = this.state.scenarioPkgs.find(pkg => pkg.name === scenarioPkgName);

      // scenario not found, user needs to install the scenario package first
      if (!scenarioPkg) {
        this.setState({ configHashStatus: `Could not find scenario "${scenarioPkgName}", please install it first.` }, this.openConfigHashModal);
        return;
      }
    }

    // construct the project with the linked scenario
    const project: Project = new Project(projectStorage);
    this.scenarioChangeHandler(project);

    // close the popup
    Modal.instance.hide();
  }

  validate(formData, errors) {
    return errors;
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
          model={this.state.project.toJS()}
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
