// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface Window {
  GsfClient;
}

declare module '*.png' {
  const value;
  export = value;
}
