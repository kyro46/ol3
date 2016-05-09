(function(win, doc){
	'use strict';
	  var draw; // global so we can remove it later

  var 
  view = new ol.View({
      center: [0, 0],
      zoom: 0,
		  projection: 'EPSG:4326',
      minZoom: 0,
      maxZoom: 4
    }),
    vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    }),
    /*
    baseLayer = new ol.layer.Tile({
      preload: Infinity,
      opacity: 1,
      source: new ol.source.MapQuest({layer: 'osm'})
    }),*/
    imageLayer = new ol.layer.Image({
		title: "image",
		opacity: 1,
		source: new ol.source.ImageStatic({
		  url: 'uhd.jpg',
  		  projection: 'EPSG:4326',
		  //url: 'uhd.jpg',
		  //ToDo Adjust dimensions according to uploaded image: +/-x:2 and +/-y:2 minx,miny,maxx,maxy
		  imageExtent: [-390, -303, 390, 303],
		  //Size in Pixels:
		  imageSize: [780, 606]
		})
	  }),   
    map = new ol.Map({
      target: doc.getElementById('map'),
      loadTilesWhileAnimating: true,
      view: view,
      layers: [imageLayer, vectorLayer]
    }),
    // from https://github.com/DmitryBaranovskiy/raphael
    elastic = function(t) {
      return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
    center = function(obj){
      var pan = ol.animation.pan({
        duration: 1000,
        easing: elastic,
        source: view.getCenter()
      });
      map.beforeRender(pan);
      view.setCenter(obj.coordinate);
    },
    marker = function(obj){
    	   draw = new ol.interaction.Draw({
    		      features: features,
    		      type: /** @type {ol.geom.GeometryType} */ ('Polygon')
    		    });
    		    map.addInteraction(draw);
    }
  ;
  var contextmenu_items = [
     {
      text: 'Add a Polygon',
      icon: 'img/marker.png',
      callback: marker
    }
  ];
  var contextmenu = new ContextMenu({
    width: 180,
    default_items: false,
    items: contextmenu_items
  });
  map.addControl(contextmenu);
  
  var removeMarker = function(obj){
	  featureOverlay.getSource().removeFeature(obj.data.marker);
    
	var  format = new ol.format.GeoJSON();
	var data;
	data = format.writeFeatures(featureOverlay.getSource().getFeatures());
	document.getElementById('geojson').innerHTML = data;
    
  };
  var editMarker = function(obj){
	  
	  //TODO Re-promt for points and name
	  var name = prompt("Please enter the name", "My Point");


	  //Save Name to Label and to JSON, refresh Layer
	  obj.data.marker.getStyle().getText().setText(name);
	  obj.data.marker.set('name', name);
	  
		var  format = new ol.format.GeoJSON();
		var data;
		data = format.writeFeatures(featureOverlay.getSource().getFeatures());
		document.getElementById('geojson').innerHTML = data;

		featureOverlay.getSource().changed();
	};
	
	
  var editMarkerItem = {
		    text: 'Edit this Polygon',
		  	icon: 'img/marker.png',
		  	callback: editMarker
  };  
  var removeMarkerItem = {
     text: 'Remove this Polygon',
     icon: 'img/marker.png',
     callback: removeMarker
  };  
  
  var changed = false;
  contextmenu.on('open', function(evt){

    var feature = map.forEachFeatureAtPixel(evt.pixel, function(ft, l){
      return ft;
    });
    if (feature){ //&& feature.get('type') == 'removable') {
      contextmenu.clear();
      removeMarkerItem.data = {
        marker: feature
      };
      editMarkerItem.data = {
    	        marker: feature
    	      };
      contextmenu.push(editMarkerItem);
      contextmenu.push(removeMarkerItem);
      changed = true;
    } else if (changed) {
      contextmenu.clear();
      contextmenu.extend(contextmenu_items);
      //contextmenu.extend(contextmenu.getDefaultItems());
      changed = false;
    }
  });
  map.on('pointermove', function(e) {
    if (e.dragging) return;
         
    var pixel = map.getEventPixel(e.originalEvent);
    var hit = map.hasFeatureAtPixel(pixel);
    
    map.getTarget().style.cursor = hit ? 'pointer' : '';
  });

  
  var polygonStyle = new ol.style.Style({
      fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        }),
        text: new ol.style.Text({
    	    textAlign: 'center',
  	    textBaseline: 'middle',
  	    font: '14px helvetica,sans-serif',
  	    text: "hallo welt",
  	    fill: new ol.style.Fill({color: '#000'}),
  	    stroke: new ol.style.Stroke({color: '#fff', width: 2}),
  	    offsetX: 0,
  	    offsetY: 0,
  	    rotation: 0
        })
      });
  
  
  var features = new ol.Collection();
  var featureOverlay = new ol.layer.Vector({
      source: new ol.source.Vector({features: features, wrapX: false}),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
          color: '#ffcc33'
        })
      }),
      text: new ol.style.Text({
  	    textAlign: 'center',
	    textBaseline: 'middle',
	    font: '14px helvetica,sans-serif',
	    text: "hallo welt",
	    fill: new ol.style.Fill({color: '#000'}),
	    stroke: new ol.style.Stroke({color: '#fff', width: 2}),
	    offsetX: 0,
	    offsetY: 0,
	    rotation: 0
      })
    })
  });
  featureOverlay.setMap(map);

  var modify = new ol.interaction.Modify({
    features: features,
    // the SHIFT key must be pressed to delete vertices, so
    // that new vertices can be drawn at the same position
    // of existing vertices
    deleteCondition: function(event) {
      return ol.events.condition.shiftKeyOnly(event) &&
          ol.events.condition.doubleClick(event);
    }
  });
  map.addInteraction(modify);

  features.on('add', function(e) {
	  var name = prompt("Please enter the name", "My Point");

	  //Save Name to Label and to JSON, refresh Layer
	  //e.element.getStyle().getText().setText(name);
	  e.element.set('name', name);
	  e.element.set('points_answer', 1);
	  e.element.set('points_position', 1);
	  
	  e.element.setStyle(polygonStyle);
	  e.element.getStyle().getText().setText(name);
	  
	  
		var  format = new ol.format.GeoJSON();
		var data;
		data = format.writeFeatures(featureOverlay.getSource().getFeatures());
		document.getElementById('geojson').innerHTML = data;
		map.removeInteraction(draw);
  }); 
 
  modify.on('modifyend',function(e){
	  
	  //alert(e.features.getArray()[0].getGeometry().getCoordinates());
	  
	  
		var  format = new ol.format.GeoJSON();
		var data;
		data = format.writeFeatures(featureOverlay.getSource().getFeatures());
		document.getElementById('geojson').innerHTML = data;
	}); 
  
})(window, document);