console.log('Hello from the client side');
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiaXRheS1tYXBib3giLCJhIjoiY2xtN3B2OTBhMDRvdTNkcjd3MWZ0aTVmeiJ9.I4MjeM6mYi1GZD8QXf1OTA';

const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/itay-mapbox/clrp5o5sa008v01pe87hth18r', // style URL
  scrollZoom: false
  // center: [-118.113491, 34.111745], // starting position [lng, lat]
  // zoom: 9, // starting zoom
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
