let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(42.352271, -71.055242),
    zoom: 14,
  });

  const iconBase = "./";
  const icons = {
    car: {
      icon: iconBase + "car.png",
    },
  };
  const features = [
    {
      title: "mXfkjrFw",
      position: new google.maps.LatLng(42.3453, -71.0464),
      type: "car",
    },
    {
      title: "nZXB8ZHz",
      position: new google.maps.LatLng(42.3662, -71.0621),
      type: "car",
    },
    {
      title: "Tkwu74WC",
      position: new google.maps.LatLng(42.3603, -71.0547),
      type: "car",
    },
    {
      title: "5KWpnAJN",
      position: new google.maps.LatLng(42.3472, -71.0802),
      type: "car",
    },
    {
      title: "uf5ZrXYw",
      position: new google.maps.LatLng(42.3663, -71.0544),
      type: "car",
    },
    {
      title: "VMerzMH8",
      position: new google.maps.LatLng(42.3542, -71.0704),
      type: "car",
    },
  ];

  // Create markers.
  for (let i = 0; i < features.length; i++) {
    const marker = new google.maps.Marker({
      position: features[i].position,
      icon: icons[features[i].type].icon,
      map: map,
    });
  }
}

window.initMap = initMap;
