const API_URL = "https://jordan-marsh.herokuapp.com/rides";
const API_USERNAME = "jLttbNzY";

const ICON_BASE = "./assets/icons/";
const ICONS = {
  car: {
    icon: ICON_BASE + "car.png",
  },
  cat: {
    icon: ICON_BASE + "cat.png",
  },
};

const DEFAULT_CENTER = { lat: 42.352271, lng: -71.055242 };

function toMiles(meters) {
  return meters * 0.000621371192;
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

        map.setCenter(currentPosition);
        new google.maps.Marker({
          position: currentPosition,
          icon: ICONS["cat"].icon,
          map: map,
        });

        sendRequest("POST", API_URL, {
          username: API_USERNAME,
          lat: currentPosition.lat,
          lng: currentPosition.lng,
        })
          .then((responseData) => {
            console.log(responseData);

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
                  distance: toMiles(distance).toFixed(2),
                };
              })
              .sort((a, b) => a.distance - b.distance);

            console.log(cars);

            const markers = cars.map((car) => {
              const marker = new google.maps.Marker({
                position: car.position,
                icon: ICONS["car"].icon,
                map: map,
              });

              marker.addListener("click", () => {
                infoWindow.setContent(
                  `<div>
                    <h3>${car.title}</h3>
                    <p>Distance: ${car.distance} miles away</p>
                  </div>`
                );
                infoWindow.open({ anchor: marker, map });
              });

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
          })
          .catch((err) => {
            console.log(err);
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
