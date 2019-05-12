import * as React from 'react';
import { NavLink } from 'react-router-dom';
import gsfLogo from '../../images/gsf-logo.png';

export default class Navigation extends React.Component {
  render() {
    return ([
      <div key="logo" className='row'>
        <div className='col text-right mr-2'>
          <img src={gsfLogo} alt='get-set-fetch'/>
        </div>
      </div>,

      <div key="menu" className='row'>
        <div className='col'>
          <nav className='nav flex-column text-right ml-4'>
            <br/>

            <NavLink to='/projects' className='nav-link'>Projects</NavLink>
            <NavLink to='/sites' className='nav-link'>Sites</NavLink>
            <NavLink to='/scenarios' className='nav-link'>Scenarios</NavLink>
            <NavLink to='/plugins' className='nav-link'>Plugins</NavLink>
            <NavLink to='/logs' className='nav-link'>Logs</NavLink>
            <NavLink to='/settings' className='nav-link'>Settings</NavLink>
            <br/>

            <NavLink to='/help' className='nav-link'>Help</NavLink>
            <a className='nav-link' href='#'>Blog/Posts</a>
            <a className='nav-link' href='#'>Github</a>
          </nav>
        </div>
      </div>,
    ]);
  }
}
