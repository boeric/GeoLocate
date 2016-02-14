// geoLocate.js
// the script geo locates (using the Google geocoder) each item in a JSON array
// author: Bo Ericsson, bo@boe.net, 2016
'use strict';

// dependencies
var fs = require('fs');
var util = require("util");
var rest = require('restler');

// geo location url
var url = "https://maps.googleapis.com/maps/api/geocode/json";
var authKey = "&key=AIzaSyDyMR5XIV9tyExPpDM1c5dtlT9jIOhPCmc";

// restler request object
var reqObj = { headers: { 'Accept': 'application/json' }, rejectUnauthorized: false }

// read and parse the input file
var input = fs.readFileSync('input.json', 'utf8')
input = JSON.parse(input);
//console.log(JSON.stringify(input, null, 2));

// define the output array
var output = [];


var count = 0;
function processNode() {
  // get next item
  var item = input.shift();

  // are we done?
  if (item == undefined) end();
  console.log("\nprocessing item " + count++ + " (" + input.length + " remaining)");

  // generate query
  var query = "?address=" + encodeURIComponent(item.address) + authKey;
  //var query = "?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA" + authKey; // sample query that works
  console.log("url: [" + url + query + "]");

  // get the geo location and address data
  rest.get(url + query, reqObj).on('complete', function(data, response) {

    if (data && data.status.toLowerCase() == 'ok') {
      // parse the response from the geocoder
      var geo = parseGeoData(data);

      // add geo and address components to address item
      item.origAddress = item.address;
      delete item.address;
      item.fullAddress = data.results[0].formatted_address;
      item.lat = data.results[0].geometry.location.lat;
      item.lng = data.results[0].geometry.location.lng;
      item.streetNumber = geo.streetNumber;
      item.street = geo.street;
      item.city = geo.city;
      item.county = geo.county;
      item.country = geo.country;
      item.state = geo.state;
      item.zip = geo.zip;

      // add to output array
      output.push(item);
    }
    else { console.log("Error: could not obtain geo location for item: " + item.address) }

    setTimeout(function(d, i) { processNode(); }, 100);
  })
}
processNode();


function end() {
  var outStr = JSON.stringify(output, null, 1);
  //console.log(outStr);

  try {
    fs.writeFileSync('output.json', outStr);
    console.log("\nGenerated output.json file...");
  }
  catch(e) {
    console.log("Error: could not write output file, reason: ", e)
  }

  process.exit(0);
}


function parseGeoData(data) {
  //console.log("data", util.inspect(data, { depth: null }));

  var outLabels =   [ 'streetNumber',   'street',     'city',       'county',                       'state',                        'country',    'zip']
  var inLabels =    [ 'street_number',  'route',      'locality',   'administrative_area_level_2',  'administrative_area_level_1',  'country',    'postal_code']
  var typeLabels =  [ 'short_name',     'long_name',  'short_name', 'short_name',                   'short_name',                   'short_name', 'short_name']
  var geo = {}
  data.results[0].address_components.forEach(function (d, i) {
    var idx = inLabels.indexOf(d.types[0])
    if (idx != -1) geo[outLabels[idx]] = d[typeLabels[idx]];
  })
  return geo;
}


/* sample of output from the Google geocoder
{ 
  results: 
  [ 
    { 
      address_components: 
        [
          { 
            long_name: '220',
            short_name: '220',
            types: [ 'street_number' ] 
          },
          { 
            long_name: 'Wisconsin Avenue',
            short_name: 'Wisconsin Ave',
            types: [ 'route' ] 
          },
          { 
            long_name: 'Waukesha',
            short_name: 'Waukesha',
            types: [ 'locality', 'political' ] 
          },
          {
            long_name: 'Waukesha County',
            short_name: 'Waukesha County',
            types: [ 'administrative_area_level_2', 'political' ] 
          },
          { 
            long_name: 'Wisconsin',
            short_name: 'WI',
            types: [ 'administrative_area_level_1', 'political' ] 
          },
          { 
            long_name: 'United States',
            short_name: 'US',
            types: [ 'country', 'political' ] 
          },
          { 
            long_name: '53186',
            short_name: '53186',
            types: [ 'postal_code' ] 
          } 
        ],

      formatted_address: '220 Wisconsin Avenue, Waukesha, WI 53186, USA',
      geometry: 
          { 
            location: { lat: 43.0100539, lng: -88.23006 },
          location_type: 'ROOFTOP',
          viewport: 
              { 
                northeast: { lat: 43.01140288029149, lng: -88.22871101970848 },
              southwest: { lat: 43.0087049197085, lng: -88.23140898029149 } 
            } 
         },

      types: [ 'street_address' ] 
    }
  ],
  status: 'OK' 
}
*/