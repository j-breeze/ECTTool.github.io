// https://leafletjs.com/reference.html for how everything works!

//Added additional layers in a watercolor map and a simple black and white political map.
//Disabling them through commenting for now, will add back later. They're a bit buggier than the terrain...

//This is code for the tiles that make up the layers. Limited it to only load Alaska. Faster, saves data! :)
var terrain = L.tileLayer.provider('Stamen.Terrain', {
	bounds:[[46.654,-200.941],[76.701,-120.231]]
});

//var watercolor = L.tileLayer.provider('Stamen.Watercolor', {
//	bounds:[[46.654,-200.941],[76.701,-120.231]]
//});

//var toner = L.tileLayer.provider('Stamen.TonerLite', {
//	bounds:[[46.654,-200.941],[76.701,-120.231]]
//});

//This sets the boundaries and zoom for the map. Limited it to Alaska.
var map = L.map('map', {
	//maxZoom sets how far you can zoom in. minZoom sets how far you can zoom out!
	//minZoom helps limit view to Alaska. maxZoom helps prevent super high res images from loading, 
	//and super zoomed in terrain often doesn't load correctly anyway. (404 errors, doubt they have images!)
	maxZoom:12,
	minZoom:5,
	//This will pull the user back to the map if they try to scroll outside these Lat/Longs
	maxBounds:[[46.654,-200.941],[76.701,-120.231]],
	layers: [terrain/*, watercolor, toner*/]
}).setView([64.666, -147.101], 8);

//This is code for the layers and their names.
var baseLayers = {
	'Terrain': terrain,
	//'Watercolor': watercolor,
	//'Toner': toner
};

var layerControl = L.control.layers(baseLayers).addTo(map);

//This is where the script pulls the data from Synoptic (parent company of MesoWest). The URL defines the parameters of what is pulled.
//Typical format is &[parameter]=[thing]. For instance, &units=metric sets the returned unit values to metric.
//https://developers.synopticdata.com/mesonet/explorer/ lets you customize what the API delivers and gives you a custom URL automatically!
fetch("https://api.synopticdata.com/v2/stations/latest?&token=7c0eab19bffc4221af1eaf73b4b1237e&obtimezone=utc&output=geojson&units=english&status=active&varsoperator=and&state=AK&within=1440&units=english")
	.then(function(response) {
		return response.json();
	})
	.then(function(data) {
		var jsonLayer = L.geoJSON(data, {
			style: function(feature) {
				if (feature.properties.air_temp == null) {
					var ECT = undefined;
				} else if (feature.properties.wind_speed == null ) {
					var ECT = undefined;
				} else if (feature.properties.wind_speed >= 2.60693) {	
					var ECT = Math.round(35.74+(0.6215*feature.properties.air_temp)-(35.75*(feature.properties.wind_speed**0.16))+(0.4275*feature.properties.air_temp*((feature.properties.wind_speed/1.15077944802)**0.16)));
				} else {
					var ECT = feature.properties.air_temp;
				};
		
				if (ECT > 0) {
					return {
						color: "green",
						fillOpacity:1,
						fillColor: "green"
					};
				} else if (ECT > -30) {
					return {
						color: "yellow",
						fillOpacity:1,
						fillColor: "yellow"
					};
				} else if (ECT > -50) {
					return {
						color: "red",
						fillOpacity:1,
						fillColor: "red"
					};
				} else if (ECT <= -50) {
					return {
						color: "purple",
						fillOpacity:1,
						fillColor: "purple"
					};
				} else {
					return {
						color: "black",
						fillOpacity:1,
						fillColor: "black"
					};
				}	
			},
			
			//This loops through each feature and applies a popup with ECT information if wind > 2.6 kts 
			//The equation doesnt work below that wind speed!
			onEachFeature: function (feature, jsonLayer) {
				if (feature.properties.air_temp == null) {
					var uECT = "???";
				} else if (feature.properties.wind_speed == null ) {
					var uECT = "???";
				} else if (feature.properties.wind_speed >= 2.60693) {	
					var uECT = Math.round(35.74+(0.6215*feature.properties.air_temp)-(35.75*(feature.properties.wind_speed**0.16))+(0.4275*feature.properties.air_temp*((feature.properties.wind_speed/1.15077944802)**0.16)))+"??F";
				} else {
					var uECT = Math.round(feature.properties.air_temp)+"??F";
				};
				
				if (feature.properties.wind_speed == null) {
					var windspeed = "???";
				} else {
					var windspeed = Math.round(feature.properties.wind_speed)+" kts";
				};
				
				if (feature.properties.air_temp == null) {
					var airtemp = "???";
				} else {
					var airtemp = Math.round(feature.properties.air_temp)+"??F";
				};
				
				jsonLayer.bindPopup("<h3>"+"Station: "+feature.properties.stid+"</h3>"+"ECT: "+uECT+"<br>"+"Air Temp: "+airtemp+"<br>"+"Wind Speed: "+windspeed).bindTooltip(uECT, {
					permanent: true,
					className: 'ect-tooltip',
					direction: 'center',
					opacity:1
				});
			},
			//This tells the function to use the station marker options defined above.
			pointToLayer: function (feature, latlng) {
				return L.circleMarker(latlng, {
					radius:15,
				});	
			}
		}).addTo(map);
	})

//This defines the settings for the MOAs.


//This pulls the MOAs and styles them red with no fill-in! Downloaded from the FAA ArcGIS page as a .geoJSON file: https://adds-faa.opendata.arcgis.com/ 
fetch("Special_Use_Airspace.geojson")
	.then(function(response) {
		return response.json();
	})
	.then(function(data) {
		var moaLayer = L.geoJSON(data, {
			style: {
				color: "red",
				fillOpacity:0
			},
			onEachFeature: function (feature, moaLayer) {
				moaLayer.bindPopup("<h3>"+feature.properties.NAME+"</h3>");
			}
		}).addTo(map);
	});
	

	