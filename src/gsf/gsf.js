import IdbStorage from './storage/IdbStorage';


console.log('attempting to comm');

(async () => {
  // init db connection
  const { Site, Resource } = await IdbStorage.init();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.resource) {
      case "site":
        
        if (request.method === "GET")
    }
    Site.getAll().then((result) => {
      console.log(result);
      sendResponse(result);
    });

    return true;
  });


  /*
  const siteA = new Site('siteA', 'www.siteA.com');
  await siteA.save();
  const siteB = new Site('siteB', 'www.siteB.com');
  await siteB.save();
  */
})();

