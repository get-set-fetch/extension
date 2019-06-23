/* eslint-disable no-console */
/* eslint-disable no-shadow */
import * as React from 'react';
import { setIn, getIn, removeIn } from 'immutable';
import { HttpMethod, IEnhancedJSONSchema, IScenario } from 'get-set-fetch-extension-commons';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';
import GsfClient from '../../components/GsfClient';
import ScenarioHelper from '../scenarios/model/ScenarioHelper';
import Project from './model/Project';
import BaseFormSchema from './schema/project-form-schema.json';
import Page from '../../layout/Page';
import GsfForm from '../../components/uniforms/GsfForm';
import GsfBridge from '../../components/uniforms/bridge/GsfBridge';
import SchemaBridgeHelper from '../../components/uniforms/bridge/GsfBridgeHelper';

interface IState {
  scenarioPkgs: IScenarioPackage[];

  project: Project;
  scenario: IScenario;

  // schema defining project props without plugable scenario props
  baseProjectSchema: IEnhancedJSONSchema;
  bridge: GsfBridge;
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
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    // load project
    const { projectId } = this.props.match.params;
    const data: object = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
    const project: Project = new Project(data);

    // load available scenarios
    const scenarioPkgs: IScenarioPackage[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenarioPackage[];

    // compute new baseProjectSchema for scenario dropdown
    const scenarioIdProp = Object.assign({}, this.state.baseProjectSchema.properties.scenarioOpts.properties.scenarioId);
    scenarioIdProp.enum = scenarioPkgs.map(pkg => pkg.id);
    scenarioIdProp.ui = { enumNames: scenarioPkgs.map(pkg => pkg.name) };
    const baseProjectSchema = setIn(this.state.baseProjectSchema, [ 'properties', 'scenarioOpts', 'properties', 'scenarioId' ], scenarioIdProp);

    this.setState(
      { scenarioPkgs, baseProjectSchema },
      () => this.scenarioChangeHandler(project),
    );
  }

  async scenarioChangeHandler(project: Project) {
    const scenario: IScenario = project.scenarioOpts.scenarioId ? await ScenarioHelper.instantiate(project.scenarioOpts.scenarioId) : null;

    const mergedSchema = this.getMergedSchema(scenario);

    let newProject = project;
    if (scenario) {
      const scenarioPkg = this.state.scenarioPkgs.find(scenarioPkg => scenarioPkg.id === project.scenarioOpts.scenarioId);
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
      .filter(scenarioKey => ![ 'scenarioId', 'description', 'homepage' ].includes(scenarioKey))
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
    // scenario option changed
    if (key === 'scenarioOpts.scenarioId') {
      const newProject = setIn(this.state.project, key.split('.'), parseInt(value, 10));
      this.scenarioChangeHandler(newProject);
    }
    // base property other than scenarioId has changed
    else {
      this.setState({
        project: setIn(this.state.project, key.split('.'), value),
      });
    }
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
    this.updatePluginDefOpts(pluginDefinitions, 'InsertResourcePlugin', {
      maxResources: this.state.project.crawlOpts.maxResources,
    });

    const finalProject = setIn(this.state.project, [ 'pluginDefinitions' ], pluginDefinitions);

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

  validate(formData, errors) {
    return errors;
  }

  render() {
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.id ? this.state.project.name : 'New Project'}
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
