import queryString from 'query-string';
import ActiveTabHelper from './ActiveTabHelper';

function handleNewSite() {
  document.getElementById('newsite').onclick = async (evt) => {
    evt.preventDefault();

    const activeTab = await ActiveTabHelper.getCurrent();
    const name = await ActiveTabHelper.executeScript(activeTab.id, { code: 'document.title' });
    const url = await ActiveTabHelper.executeScript(activeTab.id, { code: 'window.location.toString()' });

    const queryParams = queryString.stringify({
      redirectPath: '/site',
      name,
      url,
    });

    const adminUrl = `admin/admin.html?${queryParams}`;
    chrome.tabs.create({ url: adminUrl });
  };
}

handleNewSite();

// te iubesc !
