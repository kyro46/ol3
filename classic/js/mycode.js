var layer = new ol.layer.Tile({
	source : new ol.source.MapQuest({
		layer : 'sat'
	})
});

var layer = new ol.layer.Image({
	title: "image",
	opacity: 1,
	source: new ol.source.ImageStatic({
	  //url: '{IMAGE_PATH}', //ILIAS
	  url: 'img/sample.jpg',
	  //ToDo Adjust dimensions according to uploaded image: +/-x:2 and +/-y:2 minx,miny,maxx,maxy
	  imageExtent: [-390, -303, 390, 303],
	  //imageExtent: [-200, -100, 200, 100],
	  //imageExtent: [-1920, -1080, 1920, 1080],
	  //Size in Pixels:
	  imageSize: [780, 606]
	  //imageSize: [1280, 1024]
	  //imageSize: [19000, 6385]
	})
  });

var map = new ol.Map({
	//controls: ol.control.defaults({}).extend([new ol.control.FullScreen()]),
	logo: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" ,
	target: 'map',
  layers: [
	layer/*,
    vector_layer*/
  ],
	view: new ol.View({
		center: [0, 0],
		projection: 'EPSG:4326',
		zoom: 0
	})
});

var pos = ol.proj.fromLonLat([ 16.3725, 48.208889 ],'EPSG:4326' );

// Existing point 
var marker = new ol.Overlay({
	position : pos,
	positioning : 'center-center',
	element : document.getElementById('marker'),
	stopEvent : false
});
map.addOverlay(marker);

// Existing point label
var vienna = new ol.Overlay({
	position : pos,
	element : document.getElementById('vienna')
});
map.addOverlay(vienna);

// Popup showing the position the user clicked
var popup = new ol.Overlay({
	element : document.getElementById('popup')
});
map.addOverlay(popup);

map.on('click', function(evt) {
	var element = popup.getElement();
	var coordinate = evt.coordinate;
	var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate,
			'EPSG:3857', 'EPSG:4326'));

	$(element).popover('destroy');
	popup.setPosition(coordinate);
	// the keys are quoted to prevent renaming in ADVANCED mode.
	$(element).popover(
			{
				'placement' : 'top',
				'animation' : false,
				'html' : true,
				'content' : '<p>The location you clicked was:</p><code>' + coordinate
						+ '</code>'
			});
	$(element).popover('show');
});
