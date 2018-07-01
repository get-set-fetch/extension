import queryString from 'query-string';
import ActiveTabHelper from '../../gsf/ActiveTabHelper';

const extensionId = 'cpbaclenlbncmmagcfdlblmmppgmcjfg';

function handleNewProject() {
  document.getElementById('newproject').onclick = async (evt) => {
    evt.preventDefault();

    const activeTab = await ActiveTabHelper.getCurrent();
    const name = await ActiveTabHelper.executeScript(activeTab.id, { code: 'document.title' });
    const url = await ActiveTabHelper.executeScript(activeTab.id, { code: 'window.location.toString()' });

    const queryParams = queryString.stringify({
      redirectPath: '/project',
      name,
      url,
    });

    const adminUrl = `chrome-extension://${extensionId}/admin/admin.html?${queryParams}`;
    chrome.tabs.create({ url: adminUrl });
  };
}

handleNewProject();

