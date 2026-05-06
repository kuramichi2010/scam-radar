declare module "globe.gl" {
  interface GlobeOptions {
    animateIn?: boolean;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type GlobeInstance = any;
  // Globe() returns a builder that, when called with a DOM element, returns the instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function Globe(options?: GlobeOptions): any;
  export default Globe;
}
