import React from 'react';
import { setIn } from 'immutable';
import { NavLink } from 'react-router-dom';
import GsfClient from '../../components/GsfClient';

export default class ProjectDetail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      site: {},
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const key = evt.target.id;
    this.setState({ site: setIn(this.state.site, [key], val) });
  }

  async submitHandler() {
    try {
      await GsfClient.fetch('POST', 'site', this.state.site);
    }
    catch (err) {
      console.log('error saving site');
    }

    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
    <form onSubmit={this.submitHandler}>
      <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Site Name</label>
          <div className="col-sm-10">
            <input id="name" type="text" className="form-control" onChange={this.changeHandler.bind(this)}/>
          </div>
        </div>
      <div className="form-group row">
        <label htmlFor="url" className="col-sm-2 col-form-label">Site URL</label>
        <div className="col-sm-10">
          <input id="url" type="text" className="form-control" onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">Create project</button>
    </form>
    );
  }
}
