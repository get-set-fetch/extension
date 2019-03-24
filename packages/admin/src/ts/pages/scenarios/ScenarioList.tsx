import * as React from 'react';
import GsfClient from '../../components/GsfClient';
import { HttpMethod, IHeaderCol, IModuleDefinition, IScenario } from 'get-set-fetch-extension-commons';
import Page from '../../layout/Page';
import Table from '../../components/Table';
import ScenarioHelper from './model/ScenarioHelper';

interface IState {
  scenarios: IScenario[];
  header: IHeaderCol[];
}

export default class ScenarioList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      header: [
        {
          label: 'Name',
          render: (scenario: IScenario) => (scenario.constructor.name)
        },
        {
          label: 'Description',
          render: (scenario: IScenario) => (<span style={{ textOverflow: 'ellipsis' }}>{scenario.getDescription().substr(0, 100)}</span>)
        },
        {
          label: 'Link',
          render: (scenario: IScenario) => (<a href={scenario.getLink().href} target='_blank'>{scenario.getLink().title}</a>)
        }
      ],
      scenarios: []
    };
  }

  componentDidMount() {
    this.loadScenarios();
  }

  async loadScenarios() {
    const scenarioDefinitions: IModuleDefinition[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IModuleDefinition[];
    const scenarios = await Promise.all(
      scenarioDefinitions.map(
        scenarioDefinition => ScenarioHelper.instantiate(scenarioDefinition.id.toString())
      )
    );

    this.setState({ scenarios });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.scenarios) return null;

    return (
      <Page
        title='Available Scenarios'
        >
        <Table
          header={this.state.header}
          data={this.state.scenarios}
        />
      </Page>
    );
  }
}
