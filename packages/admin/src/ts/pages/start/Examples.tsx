/* eslint-disable max-len */
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Page from '../../layout/Page';

export default class GettingStarted extends React.Component {
  render() {
    const projectHashes = {
      topLanguages: 'eLtI4gnarZS/boQwDMZfxep0DIGqfxaGPkHHjpVQOByILiRRYnri7evQgx5FHeh1QApO/MmOv1+Wo2/Og5G2HbimCPUI3vnBTMbaEHJpGygNDxpJElRwPUiI2rYcYrOQPkLH9wKeBfOFqY7Ix7Io0OZnfdIeGy1zF9oi/RWvOlLlVLUUUtVjZYe+xpDCllU/sIoe5Qn5Rld8tkgi8qcSTGLe4EWQHsVXReLb37ewfP/fLP+Cyk86VhWsrL8h5y8srFDY0n2D8SejTAOfVqXSIZJwStDoEagpLXXi2GnTHB4yfobm+b/bHZmPKXP2Bhx6bQzbNWa7RJ6SiEdumbNaBKfg7IJprnDYpfecwQvIy4kpdNUeKH7BzXi3g/Z9dH8CgGRfRw==',
      uefaTopScorers: 'eLtI4gnapZTBisMgFEV/5dG9sTDMprsuOv2BWQ4MNjFRWo3kmYb+fa8mTWmhDJkuBI0Pvb57T+6lu68tfbeB9i2sKBEHSH5GY3ovxeQaVSoqqrvWkSK2vsEnpCTakgwaQgGvo8FGQ9bX1sM14uwtSosZMhNj4I2UwzAUva5VUbZOpklplAu4lk9aNb2WxjLaeJGd8kecwDIgRxApmyT4N0uu5COzjY6CMeoEmLhtYNKpoMUoVtwz/w7f67eBfsHLjMhEwHjjR8Znjv9nXj7R8x8eHnH4g/CF8a/sucg9Z7SdBQLhhEhH4cczmvnjU83ktPC9O8Bg7GaLVwugWAbBFYIYEVs=',
      amazonBabyCarSeats: 'eLtI4gnanVXbbtswDP0VIQb65mQxMPQCBEVbYK8b1gx7qIuAsRlHiC0JpFwv/fpRcpImLoYufTBMSbyI5DnUQfWugVdr1D0st+oBSD0iiNKQG7uE1UoTe+U7qxzZspUdJ7mwWpFt1M5VIV44eBHJY2VpOz5Qa+2945vJpOu6MUT1cWGbiQROY+DJ8lbj7Nf829WFsSXOptllll1ffplOT0lZoU9ZvlVgULo/EIHAYSqY9bpI30D9aQJ/HcDrvxnbQ3q//xu016YKxwM2/4MsQ36ckKdYg6lwfkyBGO67Q4oTgXsO+Xcaxxz7DGtK/fJUggcpbeOskeKmfutwlo9Y2gEkvSDktvb56FmxA+ku1p0upV1qnSmQSbPHTa3NJjdtPYZUIKRNvLjsyroGwViiDP7p4XVC1eyD6XMmNcMlk92d5trXYRj68M+NJJvAi5S0woeWvW2QfspwxI5VuKUWeAWkkViEH+cmOoOCTtXnIY9EhdaYind+ebNYCeBbwoWsh7VKFBjukLBU8nJw7Glv6EgX2KtH8b62xebRk97gj7AOoqnEQa05xFNRa2jbi8tgu5A69gfyCrREUrD3Nr48jiYvjyRyiMT9enTG7DpvVv0FPj+poQ==',
      goodReadsBookNominees: 'eLtI4gnanZQ7b8IwEMe/yqksMCQpVB3KUKnMfSxILCzGuSQWiR3Z16Z8+57zABKgAoYoiX0v+/6/25tu0BFsjNk6MAnMHqcvJ2C0p4W9KWhTKI3oILGmAMoQEmV5kyoDUhCmxiouqgMqIyrdPIqqqgpTY2LLl+pCaYpIZkZJFJWwsYt8/KAuJWjrOMIwRQocP4lnJug2+MOKEgNWKSkZHGR8N7JPA0FdzWgj4m59JRQpnfrtAb8X8BgS0cNFZkKnuDwWfZ3uq0RbzwDXUEMnFsdU3cNJrH7CtqO7uaYskJnK4/F0Aq8g5nXXmyUeIglnMlUrhc4JcqW3a30hzuyfOA65nfG5QEK7Cu2KO8/n5wC85sMcXGuRenvXw3w2pPz53Oy4murpyOdZKsr9CCX/rusbFUhCmtzXVZu8fVPGPiBCUX99cj72aH7GbtJ4ecsP9uSjuFLo/i2NwDdap2sdsvbkFmMINypdmN+FiXcQcl0FF/yuHPVuM8wxIfYuhNKQorb4cMOMuW2m/AHa94RS',
      dowJonesIndices: 'eLtI4gnanZS9UsMwDMdfRceMbVq2PgILCyOLiJVExbV9tkrSt0cJhbaBoWXwne8ky/r4/3SSUxrgKUWqwNHzFGrJxbFYoLGhAC0H9R1Yejg99ShoQUuiKWoFVFGV+e5BEiDsNR/TFqbowwHaVHYo9ge4XiTXjXPDMNiau5DeMNgm7VzNfsuOojvm5hQklaLzaTDb6Wejhn2VwhgMflDRxrpLfDsSU/W0E2vm26CXgpmMqlu4MSf5/xv1x4UQr2V79XAVPUtgLmhqeowdvZwzMev5OWtHpinWL6jkl8c5dP/ByBbNQ8ib44BM4CqAm5ZLFdP0HLxuFzXSCIHj+2u0mtM8/9iQ6XQI/dx95EgF0NKYU5F76FeWo5SkxnwwwhKmNTWGOoe5gHe9ZHf910a4ltW7GxC8DblPUb02JQ==',
      imgurImages: 'eLtI4gnanZTfDoIgFIdf5ayr2kJyrS56iN7BAo1KYHC0evvAP4naVnrBhB3d+bnzfQRhssJAFcmOlGj+E0RVhqVUCKVgXNkVpEblEG/AcMYEUkPTQsoXaGXRflS6IGp7oFT4LtFZ5e179HHTe32VfdcyjsS6lXoxSFtwG5NoTlhNPulgnS3mboDNvyZuB9/9ljHkgIkykkl55E/snFuD9OcTytC+RtWvAcaszjHAh/HDItVw3Ygzl0m0HARuDNv177CpKsR1UxR49xdP9VxMwH4a5m9xNwS/',
    };


    return (
      <Page title="Examples">
        <div className="p-4 examples">
          <p className="notes">Note: The web is in constant motion :) . The CSS selectors used in the following examples (following robots.txt guidelines) may not be valid anymore.</p>

          <h5 className="inner">Single Static Page Scraping</h5>
          <hr/>
          <ul>
            <li>
              <a href="https://en.wikipedia.org/wiki/List_of_languages_by_number_of_native_speakers" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
                https://en.wikipedia.org/wiki/List_of_languages_by_number_of_native_speakers
              </a>
              <p>Top languages by population.</p>
              <p>Extract table data from a single static html page.</p>
              <p>Columns: rank, language, speakers, percentage of world population, language family.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.topLanguages)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
          </ul>


          <h5 className="inner">Single Static Page Scraping with Infinite Scrolling</h5>
          <hr/>
          <ul>
            <li>
              <a href="https://www.uefa.com/uefachampionsleague/history/rankings/players/goals_scored/" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
                https://www.uefa.com/uefachampionsleague/history/rankings/players/goals_scored/
              </a>
              <p>UEFA Champions League top scorers.</p>
              <p>Extract table data from a single static html page with infinite scrolling.</p>
              <p>Columns: player name, goals.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.uefaTopScorers)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
          </ul>

          <h5 className="inner">Multiple Static Page Scraping</h5>
          <hr/>
          <ul>
            <li>
              <a href="https://www.amazon.com/Car-Seats/b?ie=UTF8&node=1272297011" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
                https://www.amazon.com/Car-Seats/
              </a>
              <p>Amazon.com car seats products.</p>
              <p>Extract first two product pages from Amazon car seats category.</p>
              <p>Columns: title, stars, ratings, answered questions, listing price, current price, savings.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.amazonBabyCarSeats)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
            <li>
              <a href="https://www.goodreads.com/choiceawards/best-books-2019" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
              https://www.goodreads.com/choiceawards/best-books-2019
              </a>
              <p>GoodReads.com best book nominees 2019.</p>
              <p>Extract best book nominees from the first two categories.</p>
              <p>Columns: title, author(s), rating.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.goodReadsBookNominees)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
            <li>
              <a href="https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
              https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/
              </a>
              <p>Dow Jones indices.</p>
              <p>Extract excel files with Dow Jones data. Filenames are renamed to a user-friendly format based on a title selector.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.dowJonesIndices)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
          </ul>

          <h5 className="inner">Dynamic Page Scraping</h5>
          <hr/>
          <ul>
            <li>
              <a href="https://imgur.com/r/funny/wkp6pjn" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
              https://imgur.com/r/funny
              </a>
              <p>Imgur images.</p>
              <p>Extract images (not videos) from 10 reddit/r/funny posts.</p>
              <p>Filenames are renamed based on img.alt attribute.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.imgurImages)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
          </ul>

        </div>
      </Page>
    );
  }
}
