/**
 * Fusion.Layers.Generic
 *
 * $Id: Generic.js 1590 2008-10-10 14:01:27Z madair $
 *
 * Copyright (c) 2007, DM Solutions Group Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/***************************************************************************
* Class: Fusion.Layers.Generic
*
* Implements the map layer for Generic mapping services.
*/

Fusion.Layers.Generic = OpenLayers.Class(Fusion.Layers, {
    arch: 'Generic',
    sActiveLayer: null,
    selectionType: 'INTERSECTS',
    bSelectionOn: false,
    oSelection: null,
    
    initialize: function(map, mapTag, isMapWidgetLayer) {
        // console.log('Generic.initialize');
        Fusion.Layers.prototype.initialize.apply(this, arguments);

        this._sMapname = mapTag.layerOptions['name'] ? mapTag.layerOptions['name'] : 'generic layer';
        
        this.minScale = mapTag.layerOptions.minScale ? mapTag.layerOptions.minScale : 1;
        this.maxScale = mapTag.layerOptions.maxScale ? mapTag.layerOptions.maxScale : 'auto';
        var scaleRange = new Fusion.Layers.ScaleRange({
            minScale: this.minScale,
            maxScale: this.maxScale}, 
            Fusion.Constant.LAYER_RASTER_TYPE);
        
        rootOpts = {
          layerName: this._sMapname,
          resourceId: this.sMapResourceId,
          selectable: false,
          editable: false,
          layerTypes: [Fusion.Constant.LAYER_RASTER_TYPE],
          minScale: this.minScale,          
          maxScale: this.maxScale,
          scaleRanges: [scaleRange],
          parentGroup: map.layerRoot,
          displayInLegend: this.bDisplayInLegend,
          expandInLegend: this.bExpandInLegend,
          legendLabel: this._sMapname,
          uniqueId: 'layerRoot',
          visible: true,
          actuallyVisible: true
          //TODO: set other opts for group initialization as required
        };
        this.layerRoot = new Fusion.Layers.Layer(rootOpts,this);
        //this.layerRoot = new Fusion.Layers.Group(rootOpts,this);
        if (isMapWidgetLayer) {
            this.loadMap(this.sMapResourceId);            
        }
    },

    loadMap: function(resourceId) {
        this.bMapLoaded = false;

        this.triggerEvent(Fusion.Event.LAYER_LOADING);
        if (this.bIsMapWidgetLayer) {
          this.mapWidget._addWorker();
        }
        
        //remove this layer if it was already created
        if (this.oLayerOL) {
            this.oLayerOL.events.unregister("loadstart", this, this.loadStart);
            this.oLayerOL.events.unregister("loadend", this, this.loadEnd);
            this.oLayerOL.events.unregister("loadcancel", this, this.loadEnd);
            this.oLayerOL.destroy();
            this.oLayerOL = null;
        }

        switch (this.layerType) {
          case 'Google':
            switch (this.mapTag.layerOptions.type) {   //Google layer types are actual objects
              case 'G_PHYSICAL_MAP':              //defined by gmap, not a string
                this.mapTag.layerOptions.type = G_PHYSICAL_MAP;
                break;
              case 'G_HYBRID_MAP':
                this.mapTag.layerOptions.type = G_HYBRID_MAP;
                break;
              case 'G_SATELLITE_MAP':
                this.mapTag.layerOptions.type = G_SATELLITE_MAP;
                break;
              case 'G_NORMAL_MAP':
                this.mapTag.layerOptions.type = G_NORMAL_MAP;
              default:
                // For the re-loaded Google layers
                if(this.mapTag.layerOptions.type == G_PHYSICAL_MAP)
                  this.mapTag.layerOptions.type = G_PHYSICAL_MAP;
                else if(this.mapTag.layerOptions.type == G_HYBRID_MAP)
                  this.mapTag.layerOptions.type = G_HYBRID_MAP;
                else if(this.mapTag.layerOptions.type == G_SATELLITE_MAP)
                  this.mapTag.layerOptions.type = G_SATELLITE_MAP;
                else 
                  this.mapTag.layerOptions.type = G_NORMAL_MAP;
                break;
            }
            break;
         case 'VirtualEarth':         
             switch (this.mapTag.layerOptions.type) {   //VE layer types are enumerated values
               case 'Aerial':              //defined in VEMapStyle from the VE api
               case 'a':
                 this.mapTag.layerOptions.type = VEMapStyle.Aerial;
                 break;
               case 'Shaded':
               case 's':
                 this.mapTag.layerOptions.type = VEMapStyle.Shaded;
                 break;
               case 'Hybrid':
               case 'h':
                 this.mapTag.layerOptions.type = VEMapStyle.Hybrid;
                 break;
               default:
                 this.mapTag.layerOptions.type = VEMapStyle.Road;
                 break;
             }
             break;
         case 'Yahoo':
            switch (this.mapTag.layerOptions.type) {   //Yahoo is similar to google
              case 'YAHOO_MAP_SAT':              //defined by YMap, not a string
              case 'YAHOO_SAT':
                this.mapTag.layerOptions.type = YAHOO_MAP_SAT;
                break;
              case 'YAHOO_MAP_HYB':
              case 'YAHOO_HYB':
                this.mapTag.layerOptions.type = YAHOO_MAP_HYB;
                break;
              case 'YAHOO_MAP_REG':
              case "YAHOO_REG":
              default:
                this.mapTag.layerOptions.type = YAHOO_MAP_REG;
                break;
            }
            break;
          default:
            this.oLayerOL = new OpenLayers.Layer[this.layerType](
                                  this.getMapName(), 
                                  this.sMapResourceId, 
                                  this.mapTag.layerParams, 
                                  this.mapTag.layerOptions );

            break;
        }

        if (!this.oLayerOL) {
            if (!this.mapTag.layerOptions.maxExtent) {
                this.mapTag.layerOptions.maxExtent = new OpenLayers.Bounds(-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892);
            }
            if (typeof this.mapTag.layerOptions.sphericalMercator == 'undefined') {
                this.mapTag.layerOptions.sphericalMercator = true;
            }
            if (typeof this.mapTag.layerOptions.numZoomLevels == 'undefined') {
                this.mapTag.layerOptions.numZoomLevels = 20;
            }
            this.oLayerOL = new OpenLayers.Layer[this.layerType](this.getMapName(), this.mapTag.layerOptions );
            this.mapWidget.fractionalZoom = false;        //fractionalZoom not permitted with Google layers
            this.mapWidget.oMapOL.setOptions({fractionalZoom: false});
        }

        this.oLayerOL.events.register("loadstart", this, this.loadStart);
        this.oLayerOL.events.register("loadend", this, this.loadEnd);
        this.oLayerOL.events.register("loadcancel", this, this.loadEnd);
        
        //this is to distinguish between a regular map and an overview map
        if (this.bIsMapWidgetLayer) {
          this.mapWidget.addMap(this);
          this.mapWidget._removeWorker();
        }
        
        //this.triggerEvent(Fusion.Event.LAYER_LOADED);
        window.setTimeout(OpenLayers.Function.bind(this.asyncTrigger, this),1);
    },
    
    asyncTrigger: function() {
        this.bMapLoaded = true;
        this.triggerEvent(Fusion.Event.LAYER_LOADED);
    },
    
//TBD: this function not yet converted for OL    
    reloadMap: function() {
        
        this.loadMap(this.sResourceId);
            this.mapWidget.triggerEvent(Fusion.Event.MAP_RELOADED);
            this.drawMap();
    },
    
    drawMap: function() {
        if (!this.bMapLoaded) {
            return;
        }
        this.oLayerOL.mergeNewParams(params);
    },

    showLayer: function( layer, noDraw ) {
        this.processLayerEvents(layer, true);
        if (!noDraw) {
            this.oLayerOL.setVisibility(true);
        }
    },
    
    hideLayer: function( layer, noDraw ) {
        this.processLayerEvents(layer, false);
        if (!noDraw) {
            this.oLayerOL.setVisibility(false);
        }
    },
    
    showGroup: function( group, noDraw ) {
        this.processGroupEvents(group, true);
    },
    
    hideGroup: function( group, noDraw ) {
        this.processGroupEvents(group, false);
    },
    
    refreshLayer: function( layer ) {
        this.drawMap();
    },
    
    getLegendImageURL: function(fScale, layer, style,defaultIcon) {
      //var url = null; //TODO: provide a generic icon url 
      return defaultIcon;
    }

});
