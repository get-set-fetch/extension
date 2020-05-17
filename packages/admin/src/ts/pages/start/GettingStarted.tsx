import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Page from '../../layout/Page';

export default class GettingStarted extends React.Component {
  render() {
    return (
      <Page title="Getting Started">
        <div className="p-4">
          <h5 className="inner">Create a new scraping project</h5>
          <hr/>
          <p>
            Start by creating a <NavLink to='/project/' className='inner-nav-link'>new scraping project</NavLink>.
            At a very minimum enter its name, start url and select a scraping scenario.
            There are two builtin scenarios: extract binary resources and extract html content.
            You can install additional 3rd party scenarios from the <NavLink to='/scenarios' className='inner-nav-link'>scenario list page</NavLink>.
            See <NavLink to='/examples' className='inner-nav-link'>examples</NavLink> to get an idea on what types of content can be scraped.
          </p>
          <p>
            You can see the newly created project in the <NavLink to='/projects' className='inner-nav-link'>project list page</NavLink>.
            Clicking &quot;scrape&quot; from the action column will start the scraping process.
            Urls to be scraped will sequentially open in an additional tab with a delay defined at project creation.
          </p>
          <p>
            You can end the scrapping process at any time by closing the responsible browser tab.
            Next time you start scraping, the process will resume from where it was interrupted.
          </p>

          <h5 className="inner">Export scraped data</h5>
          <hr/>
          <p>
            From the <NavLink to='/projects/' className='inner-nav-link'>project list page</NavLink>, actions column, click &quot;results&quot;.
            All resources scraped so far will be displayed in a tabular form.
          </p>
          <p>
            Depending on the selected scraping scenario, you can export the data as either csv or zip.
          </p>

          <h5 className="inner">Troubleshooting</h5>
          <hr/>
          <p>
            Look for warning or error entries in the <NavLink to='/logs' className='inner-nav-link'>logs page</NavLink>.
            <br/>
            You can adjust the log level from the <NavLink to='/settings' className='inner-nav-link'>settings page</NavLink>.
          </p>
          <p>
            If you find a bug, please <a href="https://github.com/get-set-fetch/extension/issues/new" target="_blank"
              rel="noopener noreferrer" className='inner-nav-link'>open an issue</a> and
            attach in the comment any relevant log entries.
          </p>

          <h5 className="inner">Help</h5>
          <hr/>
          <p>
            The official documentation is available
            at: <a href="https://getsetfetch.org/extension" target="_blank" rel="noopener noreferrer" className='inner-nav-link'>
            https://getsetfetch.org/extension</a>.
            <br/>
            In time, a more detailed documentation with lots of examples will be available :)
          </p>
          <p>
            You can find the source code (MIT license) and technical tidbits on the github page
            : <a href="https://github.com/get-set-fetch/extension" target="_blank" rel="noopener noreferrer" className='inner-nav-link'>
            https://github.com/get-set-fetch/extension</a>
            <br/>
            If you find this extension useful,
            please <a href="https://github.com/get-set-fetch/extension" target="_blank" rel="noopener noreferrer" className='inner-nav-link'>
            star it</a>.
          </p>

        </div>
      </Page>
    );
  }
}
