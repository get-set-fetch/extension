import React from 'react';
import PropTypes from 'prop-types';
import { setIn } from 'immutable';
import queryString from 'query-string';
import GsfClient from '../../components/GsfClient';

export default class ProjectDetail extends React.Component {
  static get propTypes() {
    return {
      siteId: PropTypes.string,
      history: PropTypes.shape({
        push: PropTypes.func,
      }),
      location: PropTypes.shape({
        search: PropTypes.string,
      }),
      match: PropTypes.shape({
        params: PropTypes.shape({
          pluginId: PropTypes.string,
        }),
      }),
    };
  }

  static get defaultProps() {
    return {
      siteId: '',
      history: {
        push: () => {},
      },
      location: {
        search: '',
      },
      match: {
        params: {
          pluginId: null,
        },
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

  async componentDidMount() {
    const { siteId } = this.props.match.params;

    if (this.props.match.params.siteId) {
      try {
        const site = await GsfClient.fetch('GET', `site/${siteId}`);
        this.setState({ site });
      }
      catch (err) {
        console.log('error loading site');
      }
    }
  }

  changeHandler(evt) {
    const val = evt.target.value;
    const prop = evt.target.id;
    this.setState({ site: setIn(this.state.site, [prop], val) });
  }

  async submitHandler(evt) {
    evt.preventDefault();

    try {
      if (this.state.site.id) {
        await GsfClient.fetch('PUT', 'site', this.state.site);
      }
      else {
        await GsfClient.fetch('POST', 'site', this.state.site);
      }
      this.props.history.push('/sites');
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
      <button id="cancel" type="button" className="btn btn-secondary" onClick={() => this.props.history.push('/sites')}>Cancel</button>
    </form>
    );
  }
}
