// Type declaration for GeoJSON file imports

declare module "*.geojson" {
  const value: GeoJSON.FeatureCollection;
  export default value;
}
