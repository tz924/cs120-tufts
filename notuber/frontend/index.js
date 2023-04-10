const API_URL = "https://unicorn-cat.herokuapp.com/rides";
const API_USERNAME = "jLttbNzY";

const ICON_BASE = "./assets/icons/";
const ICONS = {
  car: {
    icon: ICON_BASE + "car.png",
  },
  cat: {
    icon: ICON_BASE + "cat.png",
  },
  simpsons: {
    icon: ICON_BASE + "simpsons.png",
  },
  portal: {
    icon: ICON_BASE + "home.png",
  },
};

const DEFAULT_CENTER = { lat: 42.352271, lng: -71.055242 };
const PORTAL = { lat: 44.046204, lng: -123.023346 };
const MILE = 1609.344;

function toMiles(meters) {
  return (meters * 0.000621371192).toFixed(2);
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

function getRandomOffset() {
  const sign = Math.random() > 0.5 ? 1 : -1;
  return sign * Math.random();
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

        // EC: Show Portal in Springfield
        const portalMarker = new google.maps.Marker({
          position: PORTAL,
          icon: ICONS["portal"].icon,
          map: map,
          zIndex: 998,
        });

        portalMarker.addListener("click", () => {
          infoWindow.setContent(
            `<div class="simpsons">
              <h2>Springfield, OR</h2>
              <p>Home Sweet Home</p>
              <a href="/simpsons">DIMENSIONAL RIFT</a>
            </div>`
          );
          infoWindow.open({ anchor: portalMarker, map });
        });

        // EC: Show Simpsons marker
        const simpsonsMarker = new google.maps.Marker({
          position: {
            lat: PORTAL.lat + getRandomOffset(),
            lng: PORTAL.lng + getRandomOffset(),
          },
          icon: ICONS["simpsons"].icon,
          map: map,
          zIndex: 999,
        });

        simpsonsMarker.addListener("click", () => {
          infoWindow.setContent(
            `<div class="simpsons">
              <h2>The Simpsons</h2>
              <p>We need to go home.</p>
            </div>`
          );
          infoWindow.open({ anchor: simpsonsMarker, map });
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

              // EC: Show car info
              marker.addListener("click", () => {
                infoWindow.setContent(
                  `<div>
                    <h3>Vehicle ${car.title}</h3>
                    <p>Distance: ${car.distance} miles away</p>
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
