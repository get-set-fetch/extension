function crawl() {
  chrome.runtime.sendMessage('crawl');
}

function addCrawlLink(container) {
  const crawlLink = document.createElement('a');
  const crawlText = document.createTextNode('Create new project');
  crawlLink.appendChild(crawlText);
  crawlLink.id = 'newproject';
  crawlLink.href = '#';
  container.appendChild(crawlLink);
  container.appendChild(document.createElement('br'));
}

function addAdminLink(container) {
  const adminLink = document.createElement('a');
  const linkText = document.createTextNode('Admin Area');
  adminLink.appendChild(linkText);
  adminLink.id = 'admin';
  adminLink.title = 'Admin Area';
  adminLink.href = chrome.runtime.getURL('admin/admin.html');
  adminLink.target = '_blank';
  container.appendChild(adminLink);
}

addCrawlLink(document.body);
addAdminLink(document.body);

document.getElementById('crawlLink').onclick = (evt) => {
  crawl();
};

