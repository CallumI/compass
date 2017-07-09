canvas.width = innerWidth;
canvas.height = innerHeight * 6 / 10;
minDimension = Math.min(canvas.width, canvas.height);
var ctx = canvas.getContext("2d");
var alpha = 0;
var coords = 0;

// A list of colours to use to highlight the colours.
var clrList = [
  "red", "green", "blue", "yellow", "orange", "purple", "forestgreen", "navy",
  "pink", "brown", "cyan"
];

// An array of places to show on the compass.
// Each entry should be
// [lat (Number), lon (Number), name (String), selected (Bool)]
var places = [
  [90, 0, "North", true],
  [51.492344, -0.147978, "London Coach Station", false],
  [52.363710, 4.888239, "Hans Brinker", false],
  [52.378820, 4.897783, "Amsterdam Station", false],
];

loadPlaces();

window.addEventListener('deviceorientationabsolute', orientHandler, false);

function d2r(degrees) {
  return (degrees / 180) * Math.PI;
}

function r2d(radian) {
  return radian * 180 / (Math.PI);
}

function orientHandler(e) {
  if (e.alpha == null && e.beta == null && e.gamma == null) {
    console.log("No orientation");
    return;
  }
  alpha = e.alpha;
  if (!e.absolute) {
    alert("absolute error");
  };

}
draw(canvas.width / 2, canvas.height / 2, minDimension * 0.45);


function drawArrowBetter(cX, cY, r, bearing, clr, txt1, txt2) {
  ctx.beginPath();
  var TEXT_HEIGHT = 40;
  ctx.font = TEXT_HEIGHT + "px sans-serif";
  //var RADIUS = Math.max(Math.max(ctx.measureText(txt2).width/2,TEXT_HEIGHT),ctx.measureText(txt1).width/2)+30;
  var RADIUS = Math.max(ctx.measureText(txt2).width / 2, TEXT_HEIGHT) + 20;
  ctx.translate(cX, cY);
  ctx.rotate(d2r(alpha + bearing));
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -(r / 2 - RADIUS));
  ctx.moveTo(0, -(r / 2 + RADIUS));
  ctx.lineTo(0, -(r));
  ctx.strokeStyle = clr;
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.fillStyle = "#000";
  if (txt1 == "North") {
    ctx.fillText("N", -ctx.measureText("N").width / 2, -(r / 2) + TEXT_HEIGHT / 2);
  }
  ctx.fillText(txt2, -ctx.measureText(txt2).width / 2, -(r / 2 - TEXT_HEIGHT / 2));

  ctx.beginPath();
  ctx.arc(0, -(r / 2), RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawTable() {
  table.innerHTML = "<tr><td>Name</td><td>Latitude</td><td>Longitude</td></tr>";
  var count = 0;
  for (var i = 0; i < places.length; i++) {
    var tr = document.createElement("tr");
    //  var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var td3 = document.createElement("td");
    var td4 = document.createElement("td");
    td2.innerText = places[i][2];
    td3.innerText = places[i][0];
    td4.innerText = places[i][1];
    //  tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    if (places[i][3] == true) {
      tr.style.backgroundColor = clrList[count % clrList.length];
      count++;
    }
    tr.setAttribute("number", i);
    tr.onclick = function(e) {
      var number = parseInt(this.getAttribute("number"), 10);
      places[number][3] = !places[number][3];
      savePlaces();
    }
    table.appendChild(tr);
  }
}

function draw(cX, cY, r) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(120,120,120)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(cX, cY, r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  var count = 0;
  for (var i = 0; i < places.length; i++) {
    if (places[i][3] == true) {
      if (i == 0) {
        drawArrowBetter(cX, cY, r, getBearing(coords, places[i]), clrList[0], places[i][2], "");

      } else {
        drawArrowBetter(cX, cY, r, getBearing(coords, places[i]), clrList[count % clrList.length], places[i][2], Math.round(getDistance(coords, places[i])) + "m");
      }
      count++;
    }
  }
  //ctx.fillText(alpha,cX,cY);
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.arc(cX, cY, r, 0, Math.PI * 2);
  ctx.stroke();
  drawTable();
  requestAnimationFrame(function() {
    draw(cX, cY, r);
  });
}

function getDistance(start, end) {
  var R = 6371 * 1000;
  var lat1 = d2r(start[0]);
  var lat2 = d2r(end[0]);
  var dLat = d2r(end[0] - start[0]);
  var dLon = d2r(end[1] - start[1]);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(start, end) { //lat,lon
  var dLon = end[1] - start[1];
  var y = Math.sin(d2r(dLon)) * Math.cos(d2r(end[0]));
  var x = Math.cos(d2r(start[0])) * Math.sin(d2r(end[0])) - Math.sin(d2r(start[0])) * Math.cos(d2r(end[0])) * Math.cos(d2r(dLon));
  return r2d(Math.atan2(y, x));
}


function geoSuccess(position) {
  coords = [position.coords.latitude, position.coords.longitude];
}

function geoError() {
  setTimeout(function() {
    if (coords == 0) {
      alert("Sorry cannot use GPS for some reason!");
    }
  }, 6000);
}

goIN.onclick = function() {
  var arr = [latIN.value, lonIN.value, nameIN.value, true];
  places[places.length] = arr;
  savePlaces();
}

myLocationIN.onclick = function() {
  latIN.value = coords[0];
  lonIN.value = coords[1];
}

function loadPlaces() {
  if (localStorage.save == undefined) {
    savePlaces();
  }
  places = JSON.parse(localStorage.save);
}

function savePlaces() {
  var str = JSON.stringify(places);
  localStorage.save = str;
}

var geoOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 1000
};

var wpid = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
