import * as React from 'react';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import IScenario from './model/Scenario';
import Page from '../../layout/Page';
import Table, { IHeaderCol } from '../../components/Table';

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
          render: (scenario:IScenario) => (scenario.name),
        },
        {
          label: 'Description',
          render: (scenario:IScenario) => (<span style={{ textOverflow: 'ellipsis' }}>{scenario.description ? scenario.description.substr(0, 100): ""}</span>),
        },
      ],
      scenarios: [],
    };
  }

  componentDidMount() {
    this.loadScenarios();
  }

  async loadScenarios() {
    const scenarios:IScenario[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as IScenario[];
    this.setState({ scenarios });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.scenarios) return null;

    return (
      <Page
        title="Available Scenarios"
        actions={[]}
        >
        <Table
          header={this.state.header}
          data={this.state.scenarios}          
        />
      </Page>
    );
  }
}