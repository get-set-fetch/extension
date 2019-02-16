import * as React from 'react';
import { match } from 'react-router';
import ScenarioInstance from '../scenarios/model/ScenarioInstance';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import Project from './model/Project';
import IScenario from '../scenarios/model/Scenario';
import { NavLink } from 'react-router-dom';
import DownloadHelper from '../../utils/DownloadHelper';
import Resource from '../sites/model/Resource';
import Site from '../sites/model/Site';

interface IProps {
  match: match<{
    projectId: string;
  }>
}

interface IState {
  project:Project;
  scenario:IScenario;
  scenarioInstance: ScenarioInstance;
  results: object[];
}

declare const System: any;

export default class ProjectResults extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      project: null,
      scenario: null,
      scenarioInstance: null,
      results: null
    }

    this.exportCSV = this.exportCSV.bind(this);

    // using SystemJS, fetch scenario from IndexedDB, only one scenario linked to project, no parametrization
    System.constructor.prototype.fetch = () => {
      return new Promise(resolve => {
        resolve(this.state.scenario.code);
      })
    }
  }

  async componentDidMount() {
      const { projectId } = this.props.match.params;

      // load project
      const projectData = projectId ? await GsfClient.fetch(HttpMethod.GET, `project/${projectId}`) : {};
      const project:Project = new Project(projectData);

      // project not found, nothing more to do
      if (!project.id) return;

      // load scenario, wait for state to be updated as systemjs import is based on it
      const scenario:IScenario = (await GsfClient.fetch(HttpMethod.GET, `scenario/${project.scenarioId}`)) as IScenario;
      await new Promise(resolve => {
        this.setState({scenario}, () => resolve())
      })

      // instantiate scenario
      const scenarioInstance = await this.loadScenario(project.scenarioId);

      // load results
      const results = await this.loadResourcesInfo(project);

      this.setState({project, scenarioInstance, results});
  }

  async loadScenario(scenarioId: string) {
    const ScenarioModule  = await System.import(`./${scenarioId}`);
    const ScenarioCls = ScenarioModule.default;
    const scenarioInstance:ScenarioInstance = new ScenarioCls();
    scenarioInstance.id = scenarioId;
    return scenarioInstance;
  }

  async loadResourcesInfo(project:Project):Promise<object[]> {
    let crawledResources = [];

    try {
      // get the sites linked to current project
      console.log(project)
      const sites = (await GsfClient.fetch(HttpMethod.GET, `sites/${project.id}`)) as Site[];
      console.log(sites);

      // get crawled resources for each site
      for (let i: number = 0; i < sites.length; i++) {
        const resources = (await GsfClient.fetch(HttpMethod.GET, `resources/${sites[i].id}/crawled`)) as Resource[];
        console.log(resources);
        crawledResources = crawledResources.concat(resources)
      }
    }
    catch (err) {
      console.log(err);
      console.log('error loading project resources');
    }

    console.log(crawledResources)

    // some of the crawled resources may not contain the info obj depending on the plugin used, filter those out
    crawledResources = crawledResources.filter(resource => (
      typeof resource.info === 'object' && Object.keys(resource.info).length > 0
    ));

    console.log(crawledResources)

    return crawledResources.map(resource => resource.info || {});
 }

 exportCSV(evt:React.MouseEvent) {
  DownloadHelper.exportCSV(this.loadResourcesInfo(this.state.project), evt);
}

  render() {
    // don't render till project is loaded
    if (!this.state.project) return null;

    return (
      <Page
        title={this.state.project.id ? `${this.state.project.name} results` : "Project not found"}
        actions={ this.state.project.id ?
          [
            <a
              id={`csv-${this.state.project.id}`}
              className="btn btn-block btn-secondary mr-2"
              href="#"
              target="_blank"
              download={this.state.project.name}
              onClick={this.exportCSV}
            >
              Export CSV
            </a>,
          ]
          :
          []
        }
        >
        {
          // project not found
          !this.state.project.id && (
            <div className="alert alert-danger" role="alert">
               <p>Project not found</p>
            </div>
          )
        }
        {
          // project found, render results
          this.state.project.id &&
            <Table
            header={this.state.scenarioInstance.getResultDefinition()}
            data={this.state.results}
          />
        }
      </Page>
    );
  }
}