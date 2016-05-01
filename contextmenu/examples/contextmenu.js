(function(win, doc){
	'use strict';
  
  //Drag interaction
  
  /**
   * Define a namespace for the application.
   */
  var app = {};


  /**
   * @constructor
   * @extends {ol.interaction.Pointer}
   */
  app.Drag = function() {

    ol.interaction.Pointer.call(this, {
      handleDownEvent: app.Drag.prototype.handleDownEvent,
      handleDragEvent: app.Drag.prototype.handleDragEvent,
      handleMoveEvent: app.Drag.prototype.handleMoveEvent,
      handleUpEvent: app.Drag.prototype.handleUpEvent
    });

    /**
     * @type {ol.Pixel}
     * @private
     */
    this.coordinate_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.cursor_ = 'pointer';

    /**
     * @type {ol.Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.previousCursor_ = undefined;

  };
  ol.inherits(app.Drag, ol.interaction.Pointer);


  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   * @return {boolean} `true` to start the drag sequence.
   */
  app.Drag.prototype.handleDownEvent = function(evt) {
    var map = evt.map;

    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature) {
          return feature;
        });

    if (feature) {
      this.coordinate_ = evt.coordinate;
      this.feature_ = feature;
    }

    return !!feature;
  };


  /**
   * @param {ol.MapBrowserEvent} evt Map browser event.
   */
  app.Drag.prototype.handleDragEvent = function(evt) {
    var deltaX = evt.coordinate[0] - this.coordinate_[0];
    var deltaY = evt.coordinate[1] - this.coordinate_[1];

    var geometry = /** @type {ol.geom.SimpleGeometry} */
        (this.feature_.getGeometry());
    geometry.translate(deltaX, deltaY);

    this.coordinate_[0] = evt.coordinate[0];
    this.coordinate_[1] = evt.coordinate[1];
    
    //this.feature_.getStyle().getText().setText("(" + this.coordinate_[0] + " | " + this.coordinate_[1] + ")");
    
    //document.getElementById('coor').innerHTML = this.feature_.getStyle().getText().getText() + "    "    +this.coordinate_[0] + "   " + this.coordinate_[1];
    
  };


  /**
   * @param {ol.MapBrowserEvent} evt Event.
   */
  app.Drag.prototype.handleMoveEvent = function(evt) {
    if (this.cursor_) {
      var map = evt.map;
      var feature = map.forEachFeatureAtPixel(evt.pixel,
          function(feature) {
            return feature;
          });
      var element = evt.map.getTargetElement();
      if (feature) {
        if (element.style.cursor != this.cursor_) {
          this.previousCursor_ = element.style.cursor;
          element.style.cursor = this.cursor_;
        }
      } else if (this.previousCursor_ !== undefined) {
        element.style.cursor = this.previousCursor_;
        this.previousCursor_ = undefined;
      }
    }
  };


  /**
   * @return {boolean} `false` to stop the drag sequence.
   */
  app.Drag.prototype.handleUpEvent = function() {
    this.coordinate_ = null;
    this.feature_ = null;
    return false;
  };

  //End drag interaction
  
  var 
    view = new ol.View({
      center: [0, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 20
    }),
    vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    }),
    baseLayer = new ol.layer.Tile({
      preload: Infinity,
      opacity: 1,
      source: new ol.source.MapQuest({layer: 'osm'})
    }),
    map = new ol.Map({
      interactions: ol.interaction.defaults().extend([new app.Drag()]),
      target: doc.getElementById('map'),
      loadTilesWhileAnimating: true,
      view: view,
      layers: [baseLayer, vectorLayer]
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
      var
        coord4326 = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'),
        template = 'Coordinate is ({x} | {y})',
        iconStyle = new ol.style.Style({
          image: new ol.style.Icon({
            scale: .6,
            src: 'img/marker.png'
          }),
          text: new ol.style.Text({
            offsetY: 25,
            text: ol.coordinate.format(coord4326, template, 2),
            font: '15px Open Sans,sans-serif',
            fill: new ol.style.Fill({ color: '#111' }),
            stroke: new ol.style.Stroke({
              color: '#eee', width: 2
            })
          })
        }),
        feature = new ol.Feature({
          type: 'removable',
          geometry: new ol.geom.Point(obj.coordinate)
        })
      ;
      
      feature.setStyle(iconStyle);
      vectorLayer.getSource().addFeature(feature);
    }
  ;
  var contextmenu_items = [
     {
      text: 'Add a Marker',
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
    vectorLayer.getSource().removeFeature(obj.data.marker);
  };
  var editMarker = function(obj){
	  var name = prompt("Please enter the name", "My Point");

	  //document.getElementById('coor').innerHTML = obj.data.marker.getStyle().getText().getText();

	  obj.data.marker.getStyle().getText().setText(name);
	  vectorLayer.getSource().changed();
	};
  var editMarkerItem = {
		    text: 'Edit this Marker',
		  	icon: 'img/marker.png',
		  	callback: editMarker
  };  
  var removeMarkerItem = {
     text: 'Remove this Marker',
     icon: 'img/marker.png',
     callback: removeMarker
  };  
  
  var changed = false;
  contextmenu.on('open', function(evt){
    var feature = map.forEachFeatureAtPixel(evt.pixel, function(ft, l){
      return ft;
    });
    if (feature && feature.get('type') == 'removable') {
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

})(window, document);