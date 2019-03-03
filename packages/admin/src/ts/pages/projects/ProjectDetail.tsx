import * as React from 'react';
import { setIn } from 'immutable';
import GsfClient from '../../components/GsfClient';
import {HttpMethod} from 'get-set-fetch-extension-commons';
import { History } from 'history';
import { match } from 'react-router';
import Project from './model/Project';
import Scenario from '../scenarios/model/Scenario';
import Form, { UiSchema } from 'react-jsonschema-form';
import BaseFormSchema from './schema/project-form-schema.json';
import BaseFormUISchema from './schema/project-form-ui-schema.json';
import ScenarioInstance, { EnhancedJSONSchema } from '../scenarios/model/ScenarioInstance';
import SchemaField from "../../components/react-jsonschema-form/SchemaField";
import BaseInput from "../../components/react-jsonschema-form/widgets/BaseInput";
import ScenarioDescription from "../../components/react-jsonschema-form/widgets/ScenarioDescription";
import ScenarioLink from "../../components/react-jsonschema-form/widgets/ScenarioLink";
import { NavLink } from 'react-router-dom';
import Page from '../../layout/Page';
import IScenario from '../scenarios/model/Scenario';

interface IProps {
  history: History;
  match: match<{
    projectId: string;
  }>
}

interface IState {
  project: Project;

  scenarios: IScenario[];
  scenarioInstance: ScenarioInstance;

  // schemas defining project props without plugable scenario props
  baseProjectSchema: EnhancedJSONSchema;
  baseProjectUISchema: UiSchema;

  // schemas defining project props combined with plugable scenario props
  mergedSchema: EnhancedJSONSchema;
  mergedUISchema: UiSchema;

  // reference to form element
  formRef: any;
}

declare const System: any;

export default class ProjectDetail extends React.Component<IProps, IState> {
  static defaultProps = {
    projectId: null
  }

  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenarios: [],
      scenarioInstance: null,

      baseProjectSchema: BaseFormSchema as EnhancedJSONSchema,
      baseProjectUISchema: BaseFormUISchema,

      mergedSchema: BaseFormSchema as EnhancedJSONSchema,
      mergedUISchema: BaseFormUISchema,

      formRef: null,
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);

    // using SystemJS, fetch scenarios from IndexedDB
    System.constructor.prototype.fetch = (url:string, init:RequestInit) => {
      const scenarioId = parseInt(/.+(\d+)$/.exec(url)[1], 10);
      return new Promise(resolve => {
        const scenario = this.state.scenarios.find((scenario:IScenario) => scenario.id === scenarioId)
        resolve(scenario.code);
      })
    }
  }

  async componentDidMount() {
    // load project
    const { projectId } = this.props.match.params;
    const data:object = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
    const project:Project = new Project(data);

    // load available scenarios, wait for state to be updated as systemjs import is based on it
    const scenarios:IScenario[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenario[];
    await new Promise(resolve => {
      this.setState({scenarios}, () => resolve())
    })

    // compute new baseProjectSchema for scenario dropdown
    const scenarioIdProp = Object.assign({}, this.state.baseProjectSchema.properties.scenarioId);
    scenarioIdProp.enum = scenarios.map(scenario => scenario.id);
    scenarioIdProp.enumNames = scenarios.map(scenario => scenario.name);
    const baseProjectSchema = setIn(this.state.baseProjectSchema, ["properties", "scenarioId"], scenarioIdProp);

    // modify schemas based on available scenarios data
    let mergedSchema = setIn(this.state.baseProjectSchema, ["properties", "scenarioId"], scenarioIdProp);
    let mergedUISchema = this.state.baseProjectUISchema;

    // if a scenario is already selected, instantiate and further update the merged schemas
    if (project.scenarioId) {
      const scenarioInstance:ScenarioInstance = await this.loadScenario(project.scenarioId);
      mergedSchema = setIn(mergedSchema, ["properties", "scenarioProps"], scenarioInstance.getConfigFormSchema().default);
      mergedUISchema = setIn(mergedUISchema, ["scenarioProps"], scenarioInstance.getConfigFormUISchema().default);
    }

    // update state
    this.setState({ project, baseProjectSchema, mergedSchema, mergedUISchema });
  }

  async loadScenario(scenarioId: string) {
    const ScenarioModule  = await System.import(`./${scenarioId}`);
    const ScenarioCls = ScenarioModule.default;
    const scenarioInstance:ScenarioInstance = new ScenarioCls();
    scenarioInstance.id = scenarioId;
    return scenarioInstance;
  }

  async changeHandler({formData}) {
    const newScenarioId = formData.scenarioId;
    const currentScenarioId = this.state.scenarioInstance ? this.state.scenarioInstance.id : null;
    const scenarioChanged = newScenarioId !== currentScenarioId;

    // scenario option changed
    if (scenarioChanged) {
      // no scenario selected
      if (!newScenarioId) {
        this.setState({
          project: new Project(formData),
          scenarioInstance: null,
          mergedSchema: this.state.baseProjectSchema,
          mergedUISchema: this.state.baseProjectUISchema
        });
      }
       // new scenario selected
      else {
        const scenarioInstance:ScenarioInstance = await this.loadScenario(newScenarioId);
        const mergedSchema = setIn(this.state.baseProjectSchema, ["properties", "scenarioProps"], scenarioInstance.getConfigFormSchema().default);
        const mergedUISchema = setIn(this.state.baseProjectUISchema, ["scenarioProps"], scenarioInstance.getConfigFormUISchema().default);

        this.setState({
          project: new Project(formData),
          scenarioInstance,
          mergedSchema,
          mergedUISchema
        });
      }
    }
    // base property other than scenarioId has changed
    else {
      this.setState({
        project: new Project(formData),
      });
    }
  }

  async submitHandler() {
    // validate form
    const { errors } = this.state.formRef.validate(this.state.formRef.state.formData);
    console.log(errors)
    // only proceed to saving if no validation errors are present
    if (errors.length !== 0) return;

    // add plugable pluginDefinitions to current project
    const pluginDefinitions = this.state.scenarioInstance.getPluginDefinitions(this.state.project.scenarioProps);

    const finalProject = setIn(this.state.project, ["pluginDefinitions"], pluginDefinitions);

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
      console.log('error saving project');
    }
  }

  validate(formData, errors) {
    // errors.fieldA.addError('fieldA invalid');
    return errors;
  }

  render() {
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.name ? this.state.project.name : "New Project"}
      >
        <Form
          className="form-main"
          ref={(form) => {
            if (!this.state.formRef) {
              this.setState({formRef: form})
            }
          }}
          fields={{ SchemaField }}
          widgets={{ BaseInput, ScenarioDescription, ScenarioLink }}

          schema={this.state.mergedSchema}
          uiSchema={this.state.mergedUISchema}

          liveValidate={true}
          validate={this.validate}
          showErrorList={false}

          formData={this.state.project.toJS()}
          onChange={this.changeHandler}
        >
          <div className="form-group row">
            <div className="col-sm-2"/>
            <div className="col-sm-5">
              <a id="save" className="btn btn-secondary" href="#" role="button" onClick={this.submitHandler}>Save</a>
              <NavLink id="cancel" to="/projects" className="btn btn-light ml-4">Cancel</NavLink>
            </div>
          </div>
        </Form>
      </Page>
    )
  }
}
