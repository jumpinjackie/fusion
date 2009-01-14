/**
 * Fusion.Widget.Measure
 *
 * $Id$
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

 /* ********************************************************************
 * Class: Fusion.Widget.Measure
 *
 * The Measure widget allows the user to measure distances or areas on the map 
 * in one or more segments. Area is positive if measured clockwise.
 * 
 * **********************************************************************/

Fusion.Constant.MEASURE_TYPE_DISTANCE = 0;
Fusion.Constant.MEASURE_TYPE_AREA = 1;
Fusion.Constant.MEASURE_TYPE_BOTH = 2;

Fusion.Event.MEASURE_SEGMENT_UPDATE = Fusion.Event.lastEventId++;
Fusion.Event.MEASURE_CLEAR = Fusion.Event.lastEventId++;
Fusion.Event.MEASURE_COMPLETE = Fusion.Event.lastEventId++;

Fusion.Widget.Measure = OpenLayers.Class(Fusion.Widget, {
    isExclusive: true,
    uiClass: Jx.Button,
    
    isDigitizing: false,
    //distance of each segment
    distances: null,
    distanceMarkers: null,
    
    //Array of points used to compute area
    aAreaFirstPoint: null,
    //cumulativeDistance
    cumulativeDistance: 0,
    lastDistance: 0,
    //for areas
    //cumulativeArea
    cumulativeArea: 0,
    lastArea: 0,
    
    /* the units to display distances in */
    units: Fusion.UNKNOWN,

    /* Type of measure: values = disance, area or both, default: both*/
    mType: null,

    /* Precision of the distance displayed */
    distPrecision: 4,
    
    /* Precision of the area displayed */
    areaPrecision: 4,
    
    /* Style for the distance line used for distance draw */   
    distanceNormalStyle: null,

    /* Style for the polygon used for area draw */   
    fillStyle: null,

    /* Style for the polygon line used for area draw */    
    areaStyle: null,
    
    initializeWidget: function(widgetTag) {
        this.asCursor = ['crosshair'];
        var json = widgetTag.extension;
        this.units = (json.Units && (json.Units[0] != '')) ?  Fusion.unitFromName(json.Units[0]): this.units;
        this.distPrecision = json.DistancePrecision ? parseInt(json.DistancePrecision[0]) : 4;
        this.areaPrecision = json.AreaPrecision ? parseInt(json.AreaPrecision[0]) : 4;  
        
        this.sTarget = json.Target ? json.Target[0] : "";
        this.sBaseUrl = Fusion.getFusionURL() + 'widgets/Measure/Measure.php';
        
        //init measure type
        this.measureType = Fusion.Constant.MEASURE_TYPE_BOTH;
        if (json.Type) {
            switch(json.Type[0].toLowerCase()) {
                case 'distance':
                    this.measureType = Fusion.Constant.MEASURE_TYPE_DISTANCE;
                    break;
                case 'area':
                    this.measureType = Fusion.Constant.MEASURE_TYPE_AREA;
                    break;
            }
        }
        //we don't support area yet.
        this.measureType = Fusion.Constant.MEASURE_TYPE_DISTANCE;
        
        //Here are the canvas style definition
        var fillStyle = json.FillStyle ? json.FillStyle[0] : 'rgba(0,0,255, 0.3)';
        var lineStyleWidth = json.LineStyleWidth ? json.LineStyleWidth[0] : 2;
        var lineStyleColor = json.LineStyleColor ? json.LineStyleColor[0] : 'rgba(0,0,255,0.3)';     
        //this.fillStyle = new Fusion.Tool.Canvas.Style({fillStyle:fillStyle});
        //this.lineStyle = new Fusion.Tool.Canvas.Style({lineWidth:lineStyleWidth,strokeStyle:lineStyleColor});  	
        this.distanceMarkers = [];
        this.distances = [];
        
        this.registerEventID(Fusion.Event.MEASURE_SEGMENT_UPDATE);
        this.registerEventID(Fusion.Event.MEASURE_CLEAR);
        this.registerEventID(Fusion.Event.MEASURE_COMPLETE);
        
        var mapWidget = this.getMap();
        mapWidget.registerForEvent(Fusion.Event.MAP_EXTENTS_CHANGED, OpenLayers.Function.bind(this.resetMeasure, this));
        this.keyHandler = OpenLayers.Function.bind(this.onKeyPress, this);
        Fusion.addWidgetStyleSheet(widgetTag.location + 'Measure/Measure.css');

        mapWidget.registerForEvent(Fusion.Event.MAP_LOADED, OpenLayers.Function.bind(this.setUnits, this, this.units));
        this.registerParameter('Units');
        
            // style the sketch fancy
        this.sketchSymbolizers = {
                "Point": {
                    pointRadius: 4,
                    graphicName: "square",
                    fillColor: "white",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeColor: "#333333"
                },
                "Line": {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    strokeDashstyle: "dash"
                },
                "Polygon": {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    fillColor: "white",
                    fillOpacity: 0.3
                }
        };
        var style = new OpenLayers.Style();
        style.addRules([
            new OpenLayers.Rule({symbolizer: this.sketchSymbolizers})
        ]);
        var styleMap = new OpenLayers.StyleMap({"default": style});
            
        //add in the OL Polygon handler
        this.map = mapWidget.oMapOL;
        this.handlerOptions = {                    
            style: "default", // this forces default render intent
            layerOptions: {styleMap: styleMap},
            persist: true
        };
        this.handler = new OpenLayers.Handler.Path(this, {
                done: this.dblClick,
                point: this.mouseDown
            }, this.handlerOptions);
        this.handler.mousemove = OpenLayers.Function.bind(this.mouseMove, this);
        mapWidget.handlers.push(this.handler);
    },
    
    onKeyPress: function(e) {
        //console.log('Rule::onKeyPress');
        var charCode = (e.charCode ) ? e.charCode : ((e.keyCode) ? e.keyCode : e.which);
        //console.log(charCode);
        if (charCode == OpenLayers.Event.KEY_ESC) {
            this.handler.clear();
        }
    },
    
    /**
     * (public) initVars()
     *
     * reset area and/or distance vars
     */    
    initVars: function() {
        this.cumulativeDistance = 0;
        this.lastDistance = 0;
        this.cumulativeArea = 0;
        this.lastArea = 0;
        this.aAreaFirstPoint = null;
    },
    
    activate: function() {
        this.handler.activate();
        this.resetMeasure();
        OpenLayers.Event.observe(document,"keypress",this.keyHandler);
        this.loadDisplayPanel();
    },
    
    loadDisplayPanel: function() {
        if (this.sTarget) {
            var url = this.sBaseUrl;
            var queryStr = 'locale='+Fusion.locale;
            if (url.indexOf('?') < 0) {
                url += '?';
            } else if (url.slice(-1) != '&') {
                url += '&';
            }
            url += queryStr;
            
            var taskPaneTarget = Fusion.getWidgetById(this.sTarget);
            var outputWin = window;
            if ( taskPaneTarget ) {
                taskPaneTarget.setContent(url);
                outputWin = taskPaneTarget.iframe.contentWindow;
            } else {
                outputWin = window.open(url, this.sTarget, this.sWinFeatures);
            }
            this.registerForEvent(Fusion.Event.MEASURE_CLEAR, OpenLayers.Function.bind(this.clearDisplay, this, outputWin));  
            this.registerForEvent(Fusion.Event.MEASURE_SEGMENT_UPDATE, OpenLayers.Function.bind(this.updateDisplay, this, outputWin));
            this.registerForEvent(Fusion.Event.MEASURE_COMPLETE, OpenLayers.Function.bind(this.updateDisplay, this, outputWin));
        } else {
            this.totalDistanceMarker = new Fusion.Widget.Measure.DistanceMarker(this.units, this.distPrecision, 'Total:');
            var oDomElem =  this.getMap().getDomObj();
            if (!this.totalDistanceMarker.domObj.parentNode || 
                this.totalDistanceMarker.domObj.parentNode != oDomElem) {
                oDomElem.appendChild(this.totalDistanceMarker.domObj);
            }
            this.totalDistanceMarker.domObj.addClass = 'divMeasureTotal';
            this.totalDistanceMarker.domObj.style.display = 'none';
            this.registerForEvent(Fusion.Event.MEASURE_CLEAR, OpenLayers.Function.bind(this.clearTotalDistance, this));  
            this.registerForEvent(Fusion.Event.MEASURE_SEGMENT_UPDATE, OpenLayers.Function.bind(this.updateTotalDistance, this));
            this.registerForEvent(Fusion.Event.MEASURE_COMPLETE, OpenLayers.Function.bind(this.updateTotalDistance, this));
        }
    },
    
    /**
     * (public) deactivate()
     *
     * deactivate the ruler tool
     */
    deactivate: function() {
        console.log('Ruler.deactivate');
        OpenLayers.Event.stopObserving(document, 'keypress', this.keyHandler);           
        this.handler.activate();
        this.resetMeasure();
    },
    
    resetMeasure: function() {
        if (this.isDigitizing) {
            this.isDigitizing = false;
        }
        this.initVars();
        for (var i=0; i<this.distanceMarkers.length; i++)  {
            this.distanceMarkers[i].destroy();
        }
        this.distanceMarkers = [];
        this.triggerEvent(Fusion.Event.MEASURE_CLEAR, this);
    },
      
    /**
     * (public) mouseDown(e)
     *
     * handle the mouse down event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseDown: function(geom2) {
        var evt = this.handler.evt;
        //OL appears to be calling this for mouseup too so filter on mousedown
        if (OpenLayers.Event.isLeftClick(evt) && evt.type=='mousedown') {
            var map = this.getMap();
            var p = map.getEventPosition(evt);
            
            if (!this.isDigitizing) {
                this.resetMeasure();
                this.isDigitizing = true;
                this.segStart = p;
                
            } else {
                //if digitizing
                if (p == this.segStart) {
                    this.dblClick(geom2);
                    return;
                }
                //create a new geometry to measure the last line segment drawn
                //new point already added on mousedown so use -3,-2
                var geom = this.handler.getGeometry();
                var lastSeg =  new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString());
                var p1 = geom.components[geom.components.length-3];
                var p2 = geom.components[geom.components.length-2];
                lastSeg.geometry.addPoint(p1.clone());
                lastSeg.geometry.addPoint(p2.clone());
                this.updateMarker(this.lastMarker, this.segStart, p, lastSeg);
                this.segStart = p;
            }
            //create a new marker
            this.lastMarker = new Fusion.Widget.Measure.DistanceMarker(this.units, this.distPrecision);
            this.distanceMarkers.push(this.lastMarker);
        }
    },

    /**
     * (public) mouseMove(e)
     *
     * handle the mouse move event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseMove: function(evt) {
        //var evt = this.handler.evt;
        if (!this.isDigitizing) {
            return;
        }
        OpenLayers.Handler.Path.prototype.mousemove.apply(this.handler, [evt]);
        var geom = this.handler.getGeometry();
        
        var offset = {x:0,y:0};
        var oElement = this.getMap().getDomObj();
        //var target = e.target || e.srcElement;
        if (this.delayUpdateTimer) {
            window.clearTimeout(this.delayUpdateTimer);
        }
        var map = this.getMap();
        var p = map.getEventPosition(evt);
        
        this.lastMarker.setCalculating();
        
        //create a new geometry to measure the last line segment drawn
        //from the last 2 points
        var lastSeg =  new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString());
        var p1 = geom.components[geom.components.length-2];
        var p2 = geom.components[geom.components.length-1];
        lastSeg.geometry.addPoint(p1.clone());
        lastSeg.geometry.addPoint(p2.clone());
        this.delayUpdateTimer = window.setTimeout(OpenLayers.Function.bind(this.delayUpdate, this, this.segStart, p, lastSeg), 100);
        
        this.positionMarker(this.lastMarker, this.segStart, p);
        if (this.totalDistanceMarker) {
          var size = this.totalDistanceMarker.getSize();
          this.totalDistanceMarker.domObj.style.top = (p.y - size.height) + 'px';
          this.totalDistanceMarker.domObj.style.left = p.x + 'px';
        }
    },
    
    delayUpdate: function(from, to, geom) {
        this.delayUpdateTimer = null;
        this.updateMarker(this.lastMarker, from, to, geom);
    },
   
    /**
     * (public) dblClick(e)
     *
     * handle the mouse dblclick event
     *
     * @param e Event the event that happened on the mapObj
     */
    dblClick: function(geom) {
        //console.log('Digitizer.dblClick');
        if (!this.isDigitizing) {
            return;
        }
        var evt = this.handler.evt;
        var p = this.getMap().getEventPosition(evt);
        
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
            
        }
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
        }  

        this.isDigitizing = false;
        
        //mousedown creates a new segment before dblClick so remove the last one
        var lastMarker = this.distanceMarkers.pop();
        lastMarker.destroy();
        this.triggerEvent(Fusion.Event.MEASURE_COMPLETE);
    },
    
    positionMarker: function(marker, from, to) {
        var oDomElem =  this.getMap().getDomObj();
        if (!marker.domObj.parentNode || 
            marker.domObj.parentNode != oDomElem) {
            oDomElem.appendChild(marker.domObj);
        }
        var size = marker.getSize();
        var t = (from.y + to.y - size.height)/2 ;
        var l = (from.x + to.x - size.width)/2;
        marker.domObj.style.top = t + 'px';
        marker.domObj.style.left = l + 'px';
    },
    
    updateMarker: function(marker, from, to, geom) {
        if (!marker) {
            return;
        }
        this.measureSegment2(marker, geom);
        this.positionMarker(marker, from, to);
        this.triggerEvent(Fusion.Event.MEASURE_SEGMENT_UPDATE);                    
    },
    
    measureSegment2: function(marker, geom) {
        var dist = this.measure(geom.geometry);
        marker.setDistance(dist);
        geom.destroy();
    },
    
    /**
     * Method: measure
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * eventType - {String}
     */
    measure: function(geometry, eventType) {
        var stat, order;
        if(geometry.CLASS_NAME.indexOf('LineString') > -1) {
            stat = this.getLength(geometry, this.units);
            order = 1;
        } else {
            stat = this.getArea(geometry, this.units);
            order = 2;
        }
        return stat;
        /*
        this.events.triggerEvent(eventType, {
            measure: stat[0],
            units: stat[1],
            order: order,
            geometry: geometry
        });
        */
    },
    
    /**
     * Method: getBestArea
     * Based on the <displaySystem> returns the area of a geometry.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {Array([Float, String])}  Returns a two item array containing the
     *     area and the units abbreviation.
     */
    displaySystemUnits: {
        geographic: ['dd'],
        english: ['mi', 'ft', 'in'],
        metric: ['km', 'm']
    },
    getBestArea: function(geometry) {
        var units = this.displaySystemUnits['metric'];
        var unit, area;
        for(var i=0, len=units.length; i<len; ++i) {
            unit = units[i];
            area = this.getArea(geometry, unit);
            if(area > 1) {
                break;
            }
        }
        return [area, unit];
    },
    
    /**
     * Method: getArea
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * units - {String} Unit abbreviation
     *
     * Returns:
     * {Float} The geometry area in the given units.
     */
    getArea: function(geometry, units) {
        var area = geometry.getArea();
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if(inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[this.map.getUnits()];
            area *= Math.pow((inPerMapUnit / inPerDisplayUnit), 2);
        }
        return area;
    },
    
    /**
     * Method: getBestLength
     * Based on the <displaySystem> returns the length of a geometry.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {Array([Float, String])}  Returns a two item array containing the
     *     length and the units abbreviation.
     */
    getBestLength: function(geometry) {
        var units = this.displaySystemUnits['metric'];
        var unit, length;
        for(var i=0, len=units.length; i<len; ++i) {
            unit = units[i];
            length = this.getLength(geometry, unit);
            if(length > 1) {
                break;
            }
        }
        return [length, unit];
    },

    /**
     * Method: getLength
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * units - {String} Unit abbreviation
     *
     * Returns:
     * {Float} The geometry length in the given units.
     */
    getLength: function(geometry, fusionUnits) {
        var units = Fusion.aUnitNames[fusionUnits];
        var units = "m";
        var length = geometry.getLength();
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if(inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[this.map.getUnits()];
            length *= (inPerMapUnit / inPerDisplayUnit);
        }
        return length;
    },
    
    measureSegment: function(marker, from, to, geom) {
        var mapWidget = this.getMap();
        var aMaps = mapWidget.getAllMaps();
        var s = 'layers/' + aMaps[0].arch + '/' + Fusion.getScriptLanguage() + "/Measure." + Fusion.getScriptLanguage();
        var fromGeo = mapWidget.pixToGeo(from.x, from.y);
        var toGeo = mapWidget.pixToGeo(to.x, to.y);
        var options = {
            parameters: {
                'session': aMaps[0].getSessionID(),
                'locale': Fusion.locale,
                'mapname': mapWidget.getMapName(),
                'x1': fromGeo.x,
                'y1': fromGeo.y,
                'x2': toGeo.x,
                'y2': toGeo.y
            },
            'onComplete': OpenLayers.Function.bind(this.measureCompleted, this, from, to, marker)
        };
        Fusion.ajaxRequest(s, options);
    },
    
    measureCompleted: function(from, to, marker, r) {
        if (r.status == 200) {
            var o;
            eval('o='+r.responseText);
            if (o.distance) {
              /* distance returned is always in meters*/
              //var mapUnits = Fusion.unitFromName(this.getMap().getUnits());
              //if (mapUnits == Fusion.DEGREES || Fusion.DECIMALDEGREES)
              mapUnits = Fusion.METERS;

              if (mapUnits != this.units) {
                o.distance = Fusion.convert(mapUnits, this.units, o.distance);
              }
              
              marker.setDistance(o.distance);
              this.positionMarker(marker, from, to);
              this.triggerEvent(Fusion.Event.MEASURE_SEGMENT_UPDATE);                    
            }
        }
    },
    
  /*
      * updates the summary display if it is loaded in a window somewhere
      */
    updateDisplay: function(outputWin) {
        var outputDoc = outputWin.document;
        var tbody = outputDoc.getElementById('segmentTBody');
        var value;
        if (tbody) {
            this.clearDisplay(outputWin);
            var totalDistance = 0;
            var units = Fusion.unitAbbr(this.units);
            for (var i=0; i<this.distanceMarkers.length; i++) {
                var distance = this.distanceMarkers[i].getDistance();
                totalDistance += distance;
            
                var tr = outputDoc.createElement('tr');
                var td = outputDoc.createElement('td');
                td.innerHTML = OpenLayers.i18n('segment',{'seg':i+1});
                tr.appendChild(td);
                td = outputDoc.createElement('td');
                if (this.distPrecision == 0) {
                  value = Math.floor(distance);
                }
                else {
                  value = distance.toPrecision(this.distPrecision);
                }
                td.innerHTML = value + ' ' + units;
                tr.appendChild(td);
                tbody.appendChild(tr);
            }
            var tDist = outputDoc.getElementById('totalDistance');
            if (this.distPrecision == 0) {
                  value = Math.floor(totalDistance);
            }
            else {
              value = totalDistance.toPrecision(this.distPrecision);
            }
            tDist.innerHTML = value + ' ' + units;
        }
    },
    
  /*
      * updates the summary display if it is loaded in a window somewhere
      */
    updateTotalDistance: function() {
      if (this.distanceMarkers.length > 1) {
        var totalDistance = 0;
        var units = Fusion.unitAbbr(this.units);
        for (var i=0; i<this.distanceMarkers.length; i++) {
            var distance = this.distanceMarkers[i].getDistance();
            totalDistance += distance;
        }
        this.totalDistanceMarker.domObj.style.display = 'block';
        this.totalDistanceMarker.setDistance(totalDistance);
      }
    },
    
  /*
      *clears the summary display if it is loaded in a window somewhere
      */
    clearDisplay: function(outputWin) {
        var outputDoc = outputWin.document;
        var tbody = outputDoc.getElementById('segmentTBody');
        if (tbody) {
          while(tbody.firstChild) {
              tbody.firstChild.marker = null;
              tbody.removeChild(tbody.firstChild);
          }
          var tDist = outputDoc.getElementById('totalDistance');
          tDist.innerHTML = '';
        }
    },
    
  /*
      *clears the summary display if it is loaded in a window somewhere
      */
    clearTotalDistance: function() {
      this.totalDistanceMarker.domObj.style.display = 'none';
    },
    
  /*
     * Callback method for the MAP_LOADED event
     * Set the units to whatever is specified in the AppDef, or the mapUnits if not specified
     * Subsequent calls from a ViewOptions widget would override the value specified.
     */
    setUnits: function(units) {
      units = (units == Fusion.UNKNOWN)?Fusion.unitFromName(this.getMap().getUnits()):units;
      this.setParameter('Units', Fusion.unitName(units));
    },

    setParameter: function(param, value) {
      //console.log('setParameter: ' + param + ' = ' + value);
        if (param == 'Units') {
            this.units = Fusion.unitFromName(value);
            for (var i=0; i<this.distanceMarkers.length; i++) {
                this.distanceMarkers[i].setUnits(this.units);
            }
            if (this.totalDistanceMarker) {
              this.totalDistanceMarker.setUnits(this.units);
            }
        }
    }
});

/*
* A class for handling the 'tooltip' for the distance measurement.  Markers also hold the distance
values and all markers are held in an array in the Measure widget for access.
*/
Fusion.Widget.Measure.DistanceMarker = OpenLayers.Class(
{
    calculatingImg: null,
    distance: 0,
    initialize: function(units, precision, label) {
        this.precision = precision;
        this.label = label ? label:'';
        this.domObj = document.createElement('div');
        this.domObj.className = 'divMeasureMarker';
        this.calculatingImg = document.createElement('img');
        this.calculatingImg.src = Fusion.getFusionURL() + 'widgets/Measure/MeasurePending.gif';
        this.calculatingImg.width = 19;
        this.calculatingImg.height = 4;
        this.setUnits(units);
        this.setCalculating();
    },
    
    destroy: function() {
      if (this.domObj.parentNode) {
          this.domObj.parentNode.removeChild(this.domObj);
          this.domObj.style.display = 'none'; //Also hide it because Safari leaves the domObj on the page 
      }
    },
    
    setUnits: function(units) {
        this.unit = units;
        this.unitAbbr = Fusion.unitAbbr(units);
    },
    
    getDistance: function() {
        return this.distance;
    },
    
    getDistanceLabel: function() {
      var value;
      if (this.precision == 0) {
        value = Math.floor(this.distance);
      }
      else {
          value = this.distance.toPrecision(this.precision);
      }

      return this.label + ' ' + value + ' ' + this.unitAbbr;  
    },
    
    setDistance: function(distance) {
        if (this.calculatingImg.parentNode) {
            this.calculatingImg.parentNode.removeChild(this.calculatingImg);
        }
        this.distance = distance;
        this.domObj.innerHTML = this.getDistanceLabel();
    },
    
    setCalculating: function() {
        if (!this.calculatingImg.parentNode) {
            this.domObj.innerHTML = '';
            this.domObj.appendChild(this.calculatingImg);
        }
    },
    
    getSize: function() {
        var size =  $(this.domObj).getBorderBoxSize();
        var imgSize = {width:19, height:4};
        if (size.width < imgSize.width) {
            size.width += imgSize.width;
        }
        if (size.height < imgSize.height) {
            size.height += imgSize.height;
        }
        return size;
    }
});
