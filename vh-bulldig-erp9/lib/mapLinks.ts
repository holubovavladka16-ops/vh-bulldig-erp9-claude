export function mapyCzUrl(lat: number, lng: number): string {
  return `https://mapy.cz/zakladni?x=${lng}&y=${lat}&z=17&source=coor&id=${lng}%2C${lat}`;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function googleStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}
