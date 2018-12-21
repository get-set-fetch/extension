import queryString from 'query-string';
import ActiveTabHelper from './ActiveTabHelper';

const extensionId = 'cpbaclenlbncmmagcfdlblmmppgmcjfg';

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

    const adminUrl = `chrome-extension://${extensionId}/admin/admin.html?${queryParams}`;
    chrome.tabs.create({ url: adminUrl });
  };
}

handleNewSite();

// te iubesc !
