/* jshint esversion: 6 */

// The minimum screen dimension
min_dimension = Math.min(innerWidth, innerHeight);
// The margin between the compass and the edge
compass_margin_general = 50;
// The margins to center the compass in the max_dimension (the min should be 0)
compass_margin_x = (innerWidth - min_dimension) / 2;
compass_margin_y = (innerHeight - min_dimension) / 2;
// The size of the compass
compass_diameter = min_dimension - compass_margin_general * 2;
compass_radius = compass_diameter / 2;

// Store the data from the two sensors here.
var alpha = 0;
var coords = [51.476798, -0.966547];

// A list of colours to use to highlight the colours.
var clrList = [
  "red", "green", "blue", "yellow", "orange", "purple", "forestgreen", "navy",
  "pink", "brown", "cyan"
];


// The main colours for the UI
var primaryColour = "#9E9E9E"; // Grey
var secondaryColour = "#00BCD4"; // Cyan

// An array of places to show on the compass.
// Each entry should be
// [lat (Number), lon (Number), name (String), enabled (Bool)]
var places = [
  [90, 0, "North", true],
  [51.492344, -0.147978, "London Coach Station", true],
  [52.363710, 4.888239, "Hans Brinker", true],
  [52.378820, 4.897783, "Amsterdam Station", false],
];
var selectedPlace = null; // Stores the place above that is show in the middle
// Load places from local storage. (Or create local storage).
loadPlaces();


// Return the radians of degrees.
function d2r(degrees) {
  return (degrees / 180) * Math.PI;
}

// Return the degress of radians.
function r2d(radian) {
  return radian * 180 / (Math.PI);
}

// Create an outer svg element within the container .chart element.
var vis = d3.selectAll(".chart")
  .append("svg:svg")
  .attr("width", innerWidth)
  .attr("height", innerHeight);

// Create the compass svg group.
var compass_svg_group = vis.append("svg:g")
  .attr("transform",
    "translate(" +
    (compass_radius + compass_margin_general + compass_margin_x) + "," +
    (compass_radius + compass_margin_general + compass_margin_y) + ")")
  .on("click", () => updateSelectedPlace(null));

// Make outercircle
var compass_svg_circle = compass_svg_group.append("svg:circle")
  .attr("r", 0)
  .attr("fill", "white")
  .attr("class", "clock outercircle")
  .transition()
  .duration(250)
  .attr("r", compass_radius)
  .on("end", () => {
    // Add the pointers
    updatePointers();
    updateSelectedPlace();
  });


/*
 * Update the position of the pointers after a change in position or
 * orientation.
 */
function updatePointers() {
  // See here https://bl.ocks.org/mbostock/3808218
  // for d3 v4 data joins.
  var compass_pointers = compass_svg_group.selectAll(".pointer")
    .data(places.filter(d => d[3]));
  // only applied to old elements
  compass_pointers.transition()
    .duration(200)
    .attr("r", d => d == selectedPlace ? 20 : 15);
  compass_pointers.enter().append("svg:circle")
    // only applied to new elements
    .attr("class", "pointer")
    .attr("r", 0)
    .transition()
    .duration(() => Math.random() * 250)
    .attr("r", 40 + Math.random() * 40)
    .transition()
    .duration(() => Math.random() * 250)
    .attr("r", d => d == selectedPlace ? 20 : 15);
  compass_pointers.merge(compass_pointers)
    // Within the merge, this is applied to new + old elements
    .attr("transform", d => "rotate(" + getBearing(coords, d) + ") " +
      "translate(0, -" + compass_radius + ")")
    .attr("fill", (d, i) => clrList[i])
    .on("click", d => {
      updateSelectedPlace(d);
      d3.event.stopPropagation();
    });

  compass_pointers.exit().remove(); // Remove redundant elements.s


}

/*
 * Change selected place to the argument. The argument should be a member of
 * places.
 * The selected place is the one which is displayed in the centre and
 * highlighted by being made bigger.
 */
function updateSelectedPlace(newOne) {
  selectedPlace = newOne;
  updatePointers(); // Because selected one changes size!
  var compass_svg_title = compass_svg_group.selectAll(".distance")
    .data(selectedPlace ? [selectedPlace] : []);
  compass_svg_title.enter().append("svg:text")
    .attr("text-anchor", "middle")
    .attr("class", "distance")
    .merge(compass_svg_title)
    .text(d => "" + Math.round(getDistance(coords, d)), "m");
  compass_svg_title.exit().remove();
}


/*
 * Return the distance between end and start.
 * Takes positions in form [lat, lon]
 */
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

/*
 * Return the bearing for end from start.
 * Both should be passed as [lat, lon] tuples.
 * Returns in degrees.
 */
function getBearing(start, end) { //lat,lon
  var dLon = end[1] - start[1];
  var y = Math.sin(d2r(dLon)) * Math.cos(d2r(end[0]));
  var x = Math.cos(d2r(start[0])) * Math.sin(d2r(end[0])) - Math.sin(d2r(start[0])) * Math.cos(d2r(end[0])) * Math.cos(d2r(dLon));
  return r2d(Math.atan2(y, x));
}

/*
 * Create the local storage if it doesn't exist, else load from it.
 */
function loadPlaces() {
  if (localStorage.save == undefined) {
    savePlaces();
  }
  places = JSON.parse(localStorage.save);
}


/*
 * Save to the local storage.
 */
function savePlaces() {
  var str = JSON.stringify(places);
  localStorage.save = str;
}

/*
 * Register to watch the GPS position.
 */
var wpid = navigator.geolocation.watchPosition(
  function(position) { // On successful return store the position.
    coords = [position.coords.latitude, position.coords.longitude];
  },
  function() { // On failure log no connection
    setTimeout(function() {
      if (coords == 0) {
        console.log("Sorry cannot use GPS for some reason!");
      }
    }, 6000);
  }, { // Options...
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 1000
  });

// Register listener for orientation.
window.addEventListener('deviceorientationabsolute', function(e) {
  if (e.alpha == null && e.beta == null && e.gamma == null) {
    console.log("No orientation");
    return;
  }
  alpha = e.alpha;
  // Absolute error means that this device doesn't associate alpha with north.
  if (!e.absolute) {
    alert("absolute error");
  }

}, false);
