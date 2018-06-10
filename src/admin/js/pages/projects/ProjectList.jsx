import React from 'react';
import GsfClient from '../../components/GsfClient';

export default class ProjectList extends React.Component {
  constructor() {
    super();
    this.state = {
      sites: null,
    };
  }
  async componentDidMount() {
    console.log('did mount');
    const sites = await GsfClient.fetch({ method: 'GET', resource: 'sites' });
    console.log(sites);
    this.setState({ sites });
    console.log(sites);
  }
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <p>Project List</p>
    );
  }
}
