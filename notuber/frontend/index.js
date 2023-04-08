const API_URL = "http://localhost:5001/rides";
const API_USERNAME = "jLttbNzY";

const ICON_BASE = "./assets/icons/";
const ICONS = {
  car: {
    icon: ICON_BASE + "car.png",
  },
  cat: {
    icon: ICON_BASE + "cat.png",
  },
  food: {
    icon: ICON_BASE + "food.png",
  },
};

const DEFAULT_CENTER = { lat: 42.352271, lng: -71.055242 };
const MILE = 1609.344;

function toMiles(meters) {
  return (meters * 0.000621371192).toFixed(2);
}

function toKilometers(miles) {
  return (miles * 1.609344).toFixed(2);
}

function toQueryString(params) {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

function sendRequest(method, url, data) {
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

let map, infoWindow, currentPosition;

function handleLocationError(browserHasGeolocation, infoWindow, pos, msg) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? `Error: The Geolocation service failed. ${msg}`
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
    zoom: 14,
  });

  infoWindow = new google.maps.InfoWindow();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        currentPosition = {
          lat: coords.latitude,
          lng: coords.longitude,
        };

        // EC: Find nearby restaurants
        const request = {
          location: currentPosition,
          radius: MILE,
          type: ["restaurant"],
        };

        const service = new google.maps.places.PlacesService(map);

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach((restaurant) => {
              const marker = new google.maps.Marker({
                position: restaurant.geometry.location,
                icon: ICONS["food"].icon,
                map: map,
              });

              // EC: Show restaurant info
              marker.addListener("click", () => {
                infoWindow.setContent(
                  `<div>
                    <h3>${restaurant.name}</h3>
                    <p>${restaurant.vicinity}</p>
                  </div>`
                );
                infoWindow.open({ anchor: marker, map });
              });
            });
          }
        });

        // EC: Show my location
        map.setCenter(currentPosition);
        const myMarker = new google.maps.Marker({
          position: currentPosition,
          icon: ICONS["cat"].icon,
          map: map,
          zIndex: 999,
        });

        sendRequest("POST", API_URL, {
          username: API_USERNAME,
          lat: currentPosition.lat,
          lng: currentPosition.lng,
        })
          .then((responseData) => {
            // Show cars
            const cars = responseData
              .map(({ username, lat, lng }) => {
                const carPosition = new google.maps.LatLng(lat, lng);
                const distance =
                  google.maps.geometry.spherical.computeDistanceBetween(
                    currentPosition,
                    carPosition
                  );
                return {
                  title: username,
                  position: carPosition,
                  type: "car",
                  distance: toMiles(distance),
                };
              })
              .sort((a, b) => a.distance - b.distance);

            const markers = cars.map((car) => {
              const marker = new google.maps.Marker({
                position: car.position,
                icon: ICONS["car"].icon,
                map: map,
              });

              const kilometers = toKilometers(car.distance);

              // EC: Show car info
              marker.addListener("click", () => {
                infoWindow.setContent(
                  `<div>
                    <h3>Vehicle ${car.title}</h3>
                    <p>Distance: ${car.distance} miles (${kilometers} kms) away</p>
                  </div>`
                );
                infoWindow.open({ anchor: marker, map });
              });

              marker.title = car.title;
              marker.distance = car.distance;

              return marker;
            });

            const closestMarker = markers[0];
            const line = new google.maps.Polyline({
              path: [currentPosition, closestMarker.position],
              geodesic: true,
              strokeColor: "#FF0000",
              strokeOpacity: 1.0,
              strokeWeight: 2,
            });
            line.setMap(map);

            // EC: Show both miles and kilometers for accessibility
            myMarker.addListener("click", () => {
              infoWindow.setContent(
                `<div>
                  <h3>Closest vehicle: ${closestMarker.title}</h3>
                  <p>Distance: ${closestMarker.distance} miles away</p>
                </div>`
              );
              infoWindow.open({ anchor: myMarker, map });
            });
          })
          .catch((err) => {
            alert(err);
          });
      },
      (err) => {
        handleLocationError(true, infoWindow, map.getCenter(), err.message);
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

window.initMap = initMap;
