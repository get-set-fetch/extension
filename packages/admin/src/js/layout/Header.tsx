import * as React from 'react';
import { NavLink } from 'react-router-dom';


export default class Header extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <nav className="navbar navbar-expand-md navbar-dark bg-dark">
        <a className="navbar-brand" href="#">GSF</a>
        <button
          className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse"
          aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarCollapse">
            <ul className="navbar-nav mr-auto">
            <li className="nav-item">
                <NavLink to="/sites" className="nav-link">Sites</NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/projects" className="nav-link">Projects</NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/scenarios" className="nav-link">Scenarios</NavLink>
            </li>
            <li className="nav-item">
                <NavLink to="/plugins" className="nav-link">Plugins</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/logs" className="nav-link">Logs</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/settings" className="nav-link">Settings</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/help" className="nav-link">Help</NavLink>
            </li>
            </ul>
            <form className="form-inline mt-2 mt-md-0">
              <input className="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-success my-2 my-sm-0 disabled" type="submit">Search</button>
            </form>
        </div>
    </nav>
    );
  }
}
