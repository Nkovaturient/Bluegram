export type GibsLayerId = "blue-marble" | "modis-terra" | "viirs-night";

export type GibsLayerSpec = {
  id: GibsLayerId;
  label: string;
  shortLabel: string;
  wmsUrl: string;
  attribution: string;
};

export const GIBS_LAYERS: readonly GibsLayerSpec[] = [
  {
    id: "blue-marble",
    label: "Blue Marble Bathymetry",
    shortLabel: "Blue Marble",
    wmsUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=BlueMarble_ShadedRelief_Bathymetry&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&STYLES=",
    attribution: "NASA GIBS · Blue Marble Next Generation",
  },
  {
    id: "modis-terra",
    label: "MODIS Terra True Color",
    shortLabel: "MODIS Terra",
    wmsUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&STYLES=&TIME=2024-07-15",
    attribution: "NASA GIBS · MODIS Terra Corrected Reflectance",
  },
  {
    id: "viirs-night",
    label: "VIIRS Earth at Night",
    shortLabel: "Night Lights",
    wmsUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=VIIRS_Black_Marble&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&STYLES=&TIME=2016-01-01",
    attribution: "NASA GIBS · Suomi NPP VIIRS Black Marble",
  },
] as const;

export function getGibsLayer(id: GibsLayerId): GibsLayerSpec {
  return GIBS_LAYERS.find((layer) => layer.id === id) ?? GIBS_LAYERS[0];
}
