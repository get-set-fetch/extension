import React from 'react';
import PropTypes from 'prop-types';
import { setIn } from 'immutable';
import queryString from 'query-string';
import GsfClient from '../../components/GsfClient';

export default class ProjectDetail extends React.Component {
  static get propTypes() {
    return {
      history: PropTypes.shape({
        push: PropTypes.func,
      }),
      location: PropTypes.shape({
        search: PropTypes.string,
      }),
    };
  }

  static get defaultProps() {
    return {
      history: {
        push: () => {},
      },
      location: {
        search: '',
      },
    };
  }

  constructor(props) {
    super(props);

    const queryParams = queryString.parse(props.location.search);

    this.state = {
      site: {
        name: queryParams.name,
        url: queryParams.url,
      },
    };

    this.changeHandler = this.changeHandler.bind(this);
    this.submitHandler = this.submitHandler.bind(this);
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const path = evt.target.id.split('.');
    this.setState({ site: setIn(this.state.site, path, val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      await GsfClient.fetch('POST', 'site', this.state.site);
      this.props.history.push('/projects');
    }
    catch (err) {
      console.log('error saving site');
    }
  }

  render() {
    return (
    <form onSubmit={this.submitHandler}>
      <div className="form-group row">
          <label htmlFor="name" className="col-sm-2 col-form-label">Site Name</label>
          <div className="col-sm-10">
            <input
              id="name" type="text" className="form-control"
              value={this.state.site.name}
              onChange={this.changeHandler.bind(this)}/>
          </div>
        </div>
      <div className="form-group row">
        <label htmlFor="url" className="col-sm-2 col-form-label">Site URL</label>
        <div className="col-sm-10">
          <input
            id="url" type="text" className="form-control"
            value={this.state.site.url}
            onChange={this.changeHandler.bind(this)}/>
        </div>
      </div>
      <button id="save" type="submit" className="btn btn-primary">Save</button>
    </form>
    );
  }
}
