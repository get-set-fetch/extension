/* eslint-disable max-len */
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import Page from '../../layout/Page';

export default class GettingStarted extends React.Component {
  render() {
    const projectHashes = {
      topLanguages: 'eLtI4gnarZS/boQwDMZfxep0DIGqfxaGPkHHjpVQOByILiRRYnri7evQgx5FHeh1QApO/MmOv1+Wo2/Og5G2HbimCPUI3vnBTMbaEHJpGygNDxpJElRwPUiI2rYcYrOQPkLH9wKeBfOFqY7Ix7Io0OZnfdIeGy1zF9oi/RWvOlLlVLUUUtVjZYe+xpDCllU/sIoe5Qn5Rld8tkgi8qcSTGLe4EWQHsVXReLb37ewfP/fLP+Cyk86VhWsrL8h5y8srFDY0n2D8SejTAOfVqXSIZJwStDoEagpLXXi2GnTHB4yfobm+b/bHZmPKXP2Bhx6bQzbNWa7RJ6SiEdumbNaBKfg7IJprnDYpfecwQvIy4kpdNUeKH7BzXi3g/Z9dH8CgGRfRw==',
      uefaTopScorers: 'eLtI4gnapZTBisMgFEV/5dG9sTDMprsuOv2BWQ4MNjFRWo3kmYb+fa8mTWmhDJkuBI0Pvb57T+6lu68tfbeB9i2sKBEHSH5GY3ovxeQaVSoqqrvWkSK2vsEnpCTakgwaQgGvo8FGQ9bX1sM14uwtSosZMhNj4I2UwzAUva5VUbZOpklplAu4lk9aNb2WxjLaeJGd8kecwDIgRxApmyT4N0uu5COzjY6CMeoEmLhtYNKpoMUoVtwz/w7f67eBfsHLjMhEwHjjR8Znjv9nXj7R8x8eHnH4g/CF8a/sucg9Z7SdBQLhhEhH4cczmvnjU83ktPC9O8Bg7GaLVwugWAbBFYIYEVs=',
      amazonBabyCarSeats: 'eLtI4gnanVXfS8MwEP5XggPf0rmBTAURN/BJRNx8G4ysvc2wNil32er86/3S1WknIttDyd3lfuSS77vuXe8L8+GdGpr5Vo0MqzEZOB1yo2lYLSxLUKHyqmSfrWEp0YuoBftCNalSZJGYBVKgpedtsqfWWwil3HS7VVUlpnZPUl90UVjXhbvzO0u3r5OHq3PnM7rt9Qf9/vXgotdrk3JJQQu+RWSQ/tqAwKYkDcwGm+pvUJ9M4MsDeJ3E2D8IcciBFkFaAP/Fj1MQn9lNIhocKuqLMdYRKwOTSQEg0RnBluv4nhgIX8+bW7eaOtOB2T3Re3iEjm0HsX76Fo36/0yGI2kjpXGd5iATG/J4rhDXqUMzHbMhxglGawm+IH7B4KJKlE2MtugwooAREReZujqZSbntPol9dBQDL24pTV5ZzRYA45ppBl3FyCSlvLIZYAdv46QipkxhqkskSBNYsk1p516Lw9ynq3Fgu6LnqEfRLZEgtxLrqdrrMHYnzmPsDPe428CEXjPjwn7HhOxnNfwV0Mi+kuz0syPmynFz5BOX4Yaz',
      goodReadsBookNominees: 'eLtI4gnanZTBToQwEIZfZaIXTSwIxoMcTHwAPZl48dKFQpuFlrSjzb690y4sAm7iciAp07/Taef/epLuhEPYGbN3YGrI77OnFRjDaeEkBW06pYVwUFvTAUoBtbI0id5AyVE0xioqagRKIvauSFPvfdIYU1m6VJeUpktLaVQpuOe2cmnIz2IpbKjjF4aNQOboqwMzbJyggeW9YORSVCWbbLwZ2YeFoTYxegaBpetnSMwsvSJii8cr9Z0M3TgUGiUrpWqrm+wWnoEXsWPH0B2ckeYrKb0VNRVl/LrjB2iV3rtPHZJx7bywH9ScXlhKQrGQaloefRQXzEjMlyA+/sn3v8nLrsNG7wrb8MzFTTH8xCrj3MsXShIDT3gcvdFGo/QYmbSvAjkdw/Vcz29p0FtyoW6uLqD4Mmp/AD/ITDw=',
      dowJonesIndices: 'eLtI4gnanZSxUsMwDIZfRceMHFqOpRsrIxt3XXyx0hhc22crTXh75DSQS+jQdsidnN+RJeX/PNsp9PAWPGWw3tiSas3F1CzQUJODxjrZ21tuYf7UaNYKpCUqWTNoMVUaYwMcQEMn9WCTLHnjvqEJ6ahZ/QHXMse8q6ouqxynMlQdjtUUV8KPOLAyocfPciCK0GVOVjvUJ0oyzyW0B2LM8jSFMPwVJEg6Eoqn2dY4m/5uwF9W9ruW6Oenq5hZY7JgaMHAP4TugUIlyc9kcJo7Ouu/QO8amzJj3Vpn5K4QkQYo0l62nRQNMSRGnUMjPiDsZcaREuhJeYSyK8o/QrbsCNqNZBlcHnMsONyuMdxegvta7C4dey5+fLH3bFRM0igm4i55kcclnJejXrfaH8oNuYGPBK/eK3gf1fxwA6u3sfkDFY1FBQ==',
      imgurImages: 'eLtI4gnanZTfDoIgFIdf5ayr2kJyrS56iN7BAo1KYHC0evvAP4naVnrBhB3d+bnzfQRhssJAFcmOlGj+E0RVhqVUCKVgXNkVpEblEG/AcMYEUkPTQsoXaGXRflS6IGp7oFT4LtFZ5e179HHTe32VfdcyjsS6lXoxSFtwG5NoTlhNPulgnS3mboDNvyZuB9/9ljHkgIkykkl55E/snFuD9OcTytC+RtWvAcaszjHAh/HDItVw3Ygzl0m0HARuDNv177CpKsR1UxR49xdP9VxMwH4a5m9xNwS/',
    };


    return (
      <Page title="Examples">
        <div className="p-4 examples">
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
              <a href="https://www.goodreads.com/choiceawards/best-fiction-books-2019" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
              https://www.goodreads.com/choiceawards/best-fiction-books-2019
              </a>
              <p>GoodReads.com best book nominees 2019.</p>
              <p>Extract best book nominees from the first two categories.</p>
              <p>Columns: title, author(s), rating.</p>
              <NavLink to={`/project/${encodeURIComponent(projectHashes.goodReadsBookNominees)}`}>
                <input type="button" className="btn-secondary mr-2" value="Create project" style={{ marginTop: '0.5rem' }} />
              </NavLink>
            </li>
            <li>
              <a href="https://us.spindices.com/indices/equity/dow-jones-industrial-average" target="_blank" rel="noopener noreferrer" className="inner-nav-link">
              https://us.spindices.com/indices/equity/dow-jones-industrial-average
              </a>
              <p>Dow Jones indices.</p>
              <p>Extract excel files with Dow Jones data. Filenames are renamed to a user-friendly format based on a title selector.</p>
              <p>Example of waiting for additional content to load in page (charts with export button) before scraping.</p>
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

          <p>Note: The examples above follow robots.txt guidelines.</p>

        </div>
      </Page>
    );
  }
}
