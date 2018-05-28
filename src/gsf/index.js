import IdbStorage from './storage/IdbStorage';


(async () => {
  // init db connection
  const { Site, Resource } = await IdbStorage.init();
}
)();

