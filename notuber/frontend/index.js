const API_URL = "http://localhost:5001/rides";
const API_USERNAME = "jLttbNzY";

const ICON_BASE = "./assets/icons/";
const ICONS = {
  simpsons: {
    url: ICON_BASE + "simpsons.png",
    width: `100px`,
    height: `100px`,
    description: "The Simpsons",
    icon_size: 0.5,
  },
  vehicle: {
    url: ICON_BASE + "sedan.png",
    icon_size: 0.25,
  },
  springfield: {
    url: ICON_BASE + "home.png",
    icon_size: 1,
  },
  food: {
    url: ICON_BASE + "food.png",
  },
};
const SIMPSONS_COLORS = {
  blue: "#2f64d6",
  yellow: "#f8db27",
  brown: "#9c5b01",
  white: "#fff",
  pink: "#ff81c1",
  house: "#c692a3",
};
const LINE_COLOR = SIMPSONS_COLORS.blue;
const HOUSE_COLOR = SIMPSONS_COLORS.house;

const HOME = { lat: 44.046204, lng: -123.023346 };
const MILE = 1609.344;

// The 'building' layer in the Mapbox Streets vector tileset contains building
// height data from OpenStreetMap.
const BUILDING_LAYER = {
  id: "add-3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 10,
  paint: {
    "fill-extrusion-color": HOUSE_COLOR,

    // Use an 'interpolate' expression to add a smooth transition effect to
    // the buildings as the user zooms in.
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "height"],
    ],
    "fill-extrusion-base": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "min_height"],
    ],
    "fill-extrusion-opacity": 0.6,
  },
};
const STYLES = {
  default: "mapbox://styles/mapbox/streets-v11",
  simpsons: "mapbox://styles/mier-cat/clg9j4111000t01n26k6zm790",
};

// let map, infoWindow, myPosition;

mapboxgl.accessToken =
  "pk.eyJ1IjoibWllci1jYXQiLCJhIjoiY2xnOWoyeDFlMTgyazNkcWxjbGtmdDNmeSJ9.AHv5qdeOJViFp1EcbeCQsA";

const map = new mapboxgl.Map({
  container: "map",
  style: STYLES.simpsons,
  center: toLngLat(HOME),
  zoom: 15.5,
  pitch: 45,
  bearing: -17.6,
  container: "map",
  antialias: true,
});

const popup = new mapboxgl.Popup();

map.on("style.load", () => {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === "symbol" && layer.layout["text-field"]
  ).id;

  map.addLayer(BUILDING_LAYER, labelLayerId);
});

// Main Entry Point
map.on("load", async () => {
  // Home Sweet Home
  map.loadImage(ICONS.springfield.url, (error, image) => {
    if (error) throw error;

    // Add the image to the map style.
    map.addImage("home", image);

    map.addSource(
      "home",
      toPointsGeoJson([
        {
          properties: {
            title: "Springfield, Oregon",
          },
          position: toLngLat(HOME),
        },
      ])
    );

    map.addLayer({
      id: "home",
      type: "symbol",
      source: "home",
      layout: {
        "icon-image": "home",
        "icon-size": ICONS.springfield.icon_size,
      },
    });
  });

  if (!navigator.geolocation) {
    // Browser doesn't support Geolocation
    handleLocationError(false, popup, map.getCenter());
    return;
  }

  try {
    // FEATURE: Show my location
    const position = await getCurrentPosition();
    const myPosition = toLngLat({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    map.setCenter(myPosition);

    map.loadImage(ICONS.simpsons.url, (error, image) => {
      if (error) throw error;

      // Add the image to the map style.
      map.addImage("simpsons", image);

      map.addSource(
        "myLocation",
        toPointsGeoJson([
          {
            properties: {
              title: ICONS.simpsons.description,
            },
            position: myPosition,
          },
        ])
      );

      map.addLayer({
        id: "myLocation",
        type: "symbol",
        source: "myLocation",
        layout: {
          "icon-image": "simpsons",
          "icon-allow-overlap": true,
          "icon-size": ICONS.simpsons.icon_size,
        },
      });
    });

    // FEATURE: Show closest vehicle
    const ridesData = await sendRequest("POST", API_URL, {
      username: API_USERNAME,
      lat: myPosition.lat,
      lng: myPosition.lng,
    });

    // Show vehicles
    const vehicles = ridesData
      .map(({ username, lat, lng }) => {
        const vehiclePosition = toLngLat({ lat, lng });
        const distance = computeDistanceBetween(myPosition, vehiclePosition, {
          units: "miles",
        });
        return {
          properties: {
            title: username,
            distance: distance,
          },
          position: vehiclePosition,
        };
      })
      .sort((a, b) => a.properties.distance - b.properties.distance);

    map.loadImage(ICONS.vehicle.url, (error, image) => {
      if (error) throw error;

      // Add the image to the map style.
      map.addImage("vehicle", image);
      map.addSource("vehicles", toPointsGeoJson(vehicles));
      map.addLayer({
        id: "vehicles",
        type: "symbol",
        source: "vehicles",
        layout: {
          "icon-image": "vehicle",
          "icon-allow-overlap": true,
          "icon-size": ICONS.vehicle.icon_size,
        },
      });
    });

    // FEATURE: Show line between my location and closest vehicle
    const closestVehicle = vehicles[0];
    map.addSource("line", toLineGeoJson([myPosition, closestVehicle.position]));

    // add the line which will be modified in the animation
    map.addLayer({
      id: "line-animation",
      type: "line",
      source: "line",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": LINE_COLOR,
        "line-width": 5,
        "line-opacity": 0.8,
      },
    });

    handleClick("vehicles", (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = `<div>
          <h3>Vehicle: ${e.features[0].properties.title}</h3>
          <p>Distance: ${e.features[0].properties.distance} miles away</p>
        </div>`;
      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });

    handleClick("myLocation", (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { title, distance } = closestVehicle.properties;
      const description = `<div>
        <h3>Closest vehicle: ${title}</h3>
        <p>Distance: ${distance} miles away</p>
      </div>`;

      popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });

    handleClick("home", (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { title } = e.features[0].properties;
      const description = `<div>
        <h1>${title}</h1>
        <p>Home Sweet Home</p>
      </div>`;

      popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });
  } catch (err) {
    handleLocationError(true, popup, map.getCenter(), err.message);
  }
});

/* Helper functions ***********************************************************/
function computeDistanceBetween(to, from, options = {}) {
  return turf.distance(to, from, options).toFixed(2);
}
function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );
}

function handleClick(id, onClick) {
  map.on("click", id, onClick);

  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on("mouseenter", id, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", id, () => {
    map.getCanvas().style.cursor = "";
  });
}

function toLineGeoJson(coordinates) {
  return {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      ],
    },
  };
}

function toPointsGeoJson(items) {
  // This GeoJSON contains features that include an "icon" property.
  // The value of the "icon" property corresponds to an image in the
  // Mapbox Streets style's sprite.
  return {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: items.map((item) => {
        return {
          type: "Feature",
          properties: item.properties,
          geometry: {
            type: "Point",
            coordinates: item.position,
          },
        };
      }),
    },
  };
}

function toLngLat({ lat, lng }) {
  return [lng, lat];
}

function toQueryString(params) {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

async function sendRequest(method, url, data) {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.responseType = "json";

    if (method === "POST" && data) {
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    }

    xhr.onload = () => {
      if (xhr.status >= 400) {
        reject(xhr.response);
      } else {
        resolve(xhr.response);
      }
    };

    xhr.onerror = () => {
      reject("Something went wrong");
    };

    xhr.send(toQueryString(data));
  });

  return promise;
}

function handleLocationError(browserHasGeolocation, popup, pos, msg) {
  popup
    .setLngLat(pos)
    .setHTML(
      browserHasGeolocation
        ? `Error: The Geolocation service failed. ${msg}`
        : "Error: Your browser doesn't support geolocation."
    )
    .addTo(map);
}

// async function initMap() {
//   const { Map, InfoWindow } = await google.maps.importLibrary("maps");
//   const { Marker } = await google.maps.importLibrary("marker");

//   map = new Map(document.getElementById("map"), {
//     center: new google.maps.LatLng(HOME.lat, HOME.lng),
//     zoom: 14,
//   });

//   infoWindow = new InfoWindow();

//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       async ({ coords }) => {
//         myPosition = {
//           lat: coords.latitude,
//           lng: coords.longitude,
//         };

//         // EC: Find nearby restaurants
//         const request = {
//           location: myPosition,
//           radius: MILE,
//           type: ["restaurant"],
//         };

//         const service = new google.maps.places.PlacesService(map);

//         service.nearbySearch(request, (results, status) => {
//           if (status === google.maps.places.PlacesServiceStatus.OK) {
//             results.forEach((restaurant) => {
//               const marker = new Marker({
//                 position: restaurant.geometry.location,
//                 icon: ICONS["food"].icon,
//                 map: map,
//               });

//               // EC: Show restaurant info
//               marker.addListener("click", () => {
//                 infoWindow.setContent(
//                   `<div>
//                     <h3>${restaurant.name}</h3>
//                     <p>${restaurant.vicinity}</p>
//                   </div>`
//                 );
//                 infoWindow.open({ anchor: marker, map });
//               });
//             });
//           }
//         });

//         // EC: Show my location
//         map.setCenter(myPosition);
//         const myMarker = new Marker({
//           position: myPosition,
//           icon: ICONS["cat"].icon,
//           map: map,
//           zIndex: 999,
//         });

//         // EC: Show nearby cars
//         try {
//           const ridesData = await sendRequest("POST", API_URL, {
//             username: API_USERNAME,
//             lat: myPosition.lat,
//             lng: myPosition.lng,
//           });

//           // Show cars
//           const cars = ridesData
//             .map(({ username, lat, lng }) => {
//               const vehiclePosition = new google.maps.LatLng(lat, lng);
//               const distance =
//                 google.maps.geometry.spherical.computeDistanceBetween(
//                   myPosition,
//                   vehiclePosition
//                 );
//               return {
//                 title: username,
//                 position: vehiclePosition,
//                 type: "car",
//                 distance: toMiles(distance),
//               };
//             })
//             .sort((a, b) => a.distance - b.distance);

//           const markers = cars.map((car) => {
//             const marker = new Marker({
//               position: car.position,
//               icon: ICONS["car"].icon,
//               map: map,
//             });

//             const kilometers = toKilometers(car.distance);

//             // EC: Show car info
//             marker.addListener("click", () => {
//               infoWindow.setContent(
//                 `<div>
//                     <h3>Vehicle ${car.title}</h3>
//                     <p>Distance: ${car.distance} miles (${kilometers} kms) away</p>
//                   </div>`
//               );
//               infoWindow.open({ anchor: marker, map });
//             });

//             marker.title = car.title;
//             marker.distance = car.distance;

//             return marker;
//           });

//           const closestVehicle = markers[0];
//           const line = new google.maps.Polyline({
//             path: [myPosition, closestVehicle.position],
//             geodesic: true,
//             strokeColor: "#FF0000",
//             strokeOpacity: 1.0,
//             strokeWeight: 2,
//           });
//           line.setMap(map);

//           // EC: Show both miles and kilometers for accessibility
//           myMarker.addListener("click", () => {
//             infoWindow.setContent(
//               `<div>
//                   <h3>Closest vehicle: ${closestVehicle.title}</h3>
//                   <p>Distance: ${closestVehicle.distance} miles away</p>
//                 </div>`
//             );
//             infoWindow.open({ anchor: myMarker, map });
//           });
//         } catch (err) {
//           alert(err);
//         }
//       },
//       async (err) => {
//         handleLocationError(true, infoWindow, map.getCenter(), err.message);
//       }
//     );
//   } else {
//     // Browser doesn't support Geolocation
//     handleLocationError(false, infoWindow, map.getCenter());
//   }
// }

// window.initMap = initMap;
