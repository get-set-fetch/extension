console.log('popup2.js');


const port = chrome.runtime.connect({ name: 'gsf' });
port.postMessage({ joke: 'Knock knock' });
port.onMessage.addListener((msg) => {
  console.log(`msg received at bkg: ${msg}`);
  console.log(msg);
  if (msg.question === "Who's there?") {
    port.postMessage({ answer: 'Madame' });
  }
  else if (msg.question === 'Madame who?') {
    port.postMessage({ answer: 'Madame... Bovary' });
  }
});

function addAdminLink(container) {
  const adminLink = document.createElement('a');
  const linkText = document.createTextNode('Admin Area');
  adminLink.appendChild(linkText);
  adminLink.title = 'Admin Area';
  adminLink.href = chrome.runtime.getURL('admin/admin.html');
  adminLink.target = '_blank';
  container.appendChild(adminLink);
}


addAdminLink(document.body);

