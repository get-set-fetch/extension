import * as React from 'react';
import { setIn } from 'immutable';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import { History } from 'history';
import { match } from 'react-router';
import Project from './model/Project';
import Scenario from '../scenarios/model/Scenario';
import Form from 'react-jsonschema-form';
import BaseConfigFormSchema from './schema/base-config-form-schema.json';
import ScenarioInstance from '../scenarios/model/ScenarioInstance';

interface IProps {
  projectId: string;
  history: History;
  match: match<{
    projectId: string;
  }>
}

interface IState {
  project: Project;
  scenarios: Scenario[];
  scenarioInstance: ScenarioInstance;
}

declare var System: any;

export default class ProjectDetail extends React.Component<IProps, IState> {
  static defaultProps = {
    projectId: null
  }

  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenarios: [],
      scenarioInstance: null
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  async componentDidMount() {
    // load project
    const { projectId } = this.props.match.params;
    const data:object = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
    const project:Project = new Project(data);

    // load available scenarios
    const scenarios:Scenario[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as Scenario[];

    // update configFormSchema for scenario dropdown
    BaseConfigFormSchema.properties.scenarioId.enum = scenarios.map(scenario => scenario.id);
    BaseConfigFormSchema.properties.scenarioId.enumNames = scenarios.map(scenario => scenario.name);

    // update state
    this.setState({ project, scenarios });


    System.constructor.prototype.fetch = (url:string, init:RequestInit) => {
      console.log(url)
      const scenarioId = parseInt(/.+(\d+)$/.exec(url)[1], 10);
      console.log("custom project fetch: " + scenarioId);
      return new Promise(resolve => {
        const scenario = this.state.scenarios.find((scenario:Scenario) => scenario.id === scenarioId)
        resolve(scenario.code);
      })
    }
  }

  async changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id;
    this.setState({ project: setIn(this.state.project, [prop], val) });

    if (prop === "scenarioId") {
      const scenarioId = val;
      const ScenarioModule  = await System.import(`./${scenarioId}`);
      const ScenarioCls = ScenarioModule.default;
      const scenarioInstance:ScenarioInstance = new ScenarioCls();
      this.setState({ scenarioInstance });
    }
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      if (this.state.project.id) {
        await GsfClient.fetch(HttpMethod.PUT, 'project', this.state.project);
      }
      else {
        await GsfClient.fetch(HttpMethod.POST, 'project', this.state.project);
      }
      this.props.history.push('/projects');
    }
    catch (err) {
      console.log('error saving project');
    }
  }

  getCombinedFormSchema() {
    const scenarioFormSchema = this.state.scenarioInstance ? this.state.scenarioInstance.getConfigFormSchema() : {};
    const combinedSchema = Object.assign({}, scenarioFormSchema, BaseConfigFormSchema);
    return combinedSchema;
  }

  render() {
    if (!this.state.project) return null;
    return (
      <Form
        schema={this.getCombinedFormSchema()}
      />
    )
  }
}
