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

// Returns the string of a number rounded to the given number of
// decimalPlaces.
function rdp(num, decimalPlaces){
  let shift = Math.pow(10, decimalPlaces);
  return "" + Math.round(num * shift) / shift;
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
  // First setup the compass
  var compass_pointers = compass_svg_group.selectAll(".pointer")
    .data(places.filter(d => d[3]));
  compass_pointers.exit().remove();
  cEnter = compass_pointers.enter().append("svg:circle")
      // only applied to new elements
      .attr("class", "pointer")
    .merge(compass_pointers)
      // Within the merge, this is applied to new + old elements
      .attr("transform", d => "rotate(" + getBearing(coords, d) + ") " +
        "translate(0, -" + compass_radius + ")")
      .attr("fill", (d, i) => clrList[i])
      .attr("r", d => d == selectedPlace ? 20 : 15)
      .on("click", d => {
        updateSelectedPlace(d);
        d3.event.stopPropagation();
      });


  // Now setup the table
  var listElements = d3.select(".data-table").selectAll("li")
    .data(places);
  // Create the new elements
  liEnter = listElements.enter();
  createCard(liEnter);
  // Populate the new + existing elements
  updateCard(liEnter.merge(listElements));
  // Remove the old elements
  listElements.exit().remove();
}

/* Given an enter with data attached to it, this function will create the
 * card */
function createCard(enter){
   liEnter = enter.append("li")  // Create list element
     .attr("class", "mdl-list__item mdl-list__item--three-line");
     //.text(d => JSON.stringify(d));
   primaryContent = liEnter.append("span")  // Create span for pimary content
     .attr("class", "mdl-list__item-primary-content");
   primaryContent.append("i")  // Create avatar in primary content
     .attr("class", "material-icons mdl-list__item-avatar")
     .text("pin_drop");
   primaryContent.append("span");  // Add the place's title
   primaryContent.append("span")  // Add the place's text body
     .attr("class", "mdl-list__item-text-body");
   liEnter.append("span")  // Create secondary content
     .attr("class", "mdl-list__item-secondary-content")
     .append("label")
       .attr("class", "mdl-switch mdl-js-switch mdl-js-ripple-effect")
         .append("input")
           .attr("type", "checkbox")
           .attr("class", "mdl-switch__input");
}


/* Given an liMerge with data attached to it, this function will update
 * the card */
function updateCard(merge){
  // Update the data in the elements
  primaryContent = merge.select(".mdl-list__item-primary-content");
  primaryContent.select("span").text(d => d[2]);  // Populate the title
  primaryContent.select(".mdl-list__item-text-body")  // Populate info
    .text(d => "" + rdp(getDistance(coords, d), 0) +
          'm | (' + rdp(d[0], 2) + ', '+ rdp(d[1], 3) + ')');
  merge.select(".mdl-list__item-secondary-content") // Secondary content
    .select("label")  // Add label 'for'
      .attr("for", (d, i) => "switch-" + i)
      .select("input")
        .attr("id", (d, i) => "switch-" + i)
        .property("checked", (d) => d[3])
        .on("change", (d, i, n) => {
          d[3] = n[i].checked;
          savePlaces();
          updatePointers();
        });
}


/*
 * Change selected place to the argument. The argument should be a member of
 * places.
 * The selected place is the one which is displayed in the centre and
 * highlighted by being made bigger.
 */
function updateSelectedPlace(newOne) {
  selectedPlace = newOne;
  dataForD3 = selectedPlace ? [selectedPlace] : [];
  updatePointers(); // Because selected one changes size!
  var compass_svg_title = compass_svg_group.selectAll(".distance")
    .data(dataForD3);
  compass_svg_title.enter().append("svg:text")
    .attr("text-anchor", "middle")
    .attr("class", "distance")
    .merge(compass_svg_title)
    .text(d => "" + rdp(getDistance(coords, d), 0) + "m");
  compass_svg_title.exit().remove();

  selectedCard = d3.select(".chart.page").selectAll("ul")
    .data(dataForD3);
  liEnter = selectedCard.enter().append("ul")
    .attr("class", "mdl-list selected-place-card");
  createCard(liEnter);
  updateCard(liEnter.merge(selectedCard));
  selectedCard.exit().remove();
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
 * Event called when the floating button is clicked. This removes the current
 * displayed page and moves to the new page.
 */
function floatingButtonClick(e) {
  const classes = ["page-displayed", "page-ontop", "page-move-in"];
  currentPage = e.srcElement.parentElement.parentElement;
  currentPage.classList.remove(...classes);
  for(let aPage of document.querySelectorAll(".page")){
    if(aPage != currentPage){
      aPage.classList.add(...classes);
    }
  }
}

// Assign floatingButtonClick() as a callback to both floating buttons
for(let floatingButton of document.querySelectorAll(".main-button")){
  floatingButton.onclick = floatingButtonClick;
}

/*
 * Register to watch the GPS position.
 */
var wpid = navigator.geolocation.watchPosition(
  function(position) { // On successful return store the position.
    coords = [position.coords.latitude, position.coords.longitude];
    updatePointers();
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
  updatePointers();

}, false);
