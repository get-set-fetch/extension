
interface SystemJS {    
  instantiate(url, parent?);
  import(id, parentUrl?)
  getRegister();
  resolve(id, parentUrl?);
  get(id);
  delete(id);

  getRegistry();
}

declare global {
  const System: SystemJS;
}

export {};

