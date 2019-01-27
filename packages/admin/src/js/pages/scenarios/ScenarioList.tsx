import * as React from 'react';
import GsfClient, { HttpMethod } from '../../components/GsfClient';
import Scenario from './model/Scenario';

interface IState {
  scenarios: Scenario[];
}

export default class ScenarioList extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      scenarios: null,
    };
  }

  componentDidMount() {
    this.loadScenarios();
  }

  async loadScenarios() {
    const scenarios:Scenario[] = (await GsfClient.fetch(HttpMethod.GET, 'scenarios')) as Scenario[];
    this.setState({ scenarios });
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    if (!this.state.scenarios) return null;

    return [
      <p key="title">Available scenarios</p>,
      this.state.scenarios.map(scenario => (
        <div>
          <p>{scenario.name}</p>
          <p>{scenario.description}</p>
        </div>
      ))
    ];
  }
}
