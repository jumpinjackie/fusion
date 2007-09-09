/********************************************************************** * 
 * $Id$
 * 
 * Measure widget
 * 
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * ********************************************************************
 *
 * The Measure widget allows the user to measure distances or areas on the map in
 * one or more segments. Area is positive if measured clockwise.
 *
 * Minimal XML Tag:
 *
 * <Command xsi:type="FusionCommandType">
 *    <Name>Measure</Name>
 *    <Label></Label>
 *    <Tooltip>Measure distance and/or areas</Tooltip>
 *    <!-- Kind of measure: distance, area, both -->
 *    <MeasureType>both</MeasureType>
 *    <ImageURL>images/icons/measure.png</ImageURL>
 *    <TargetViewer>All</TargetViewer>
 *    <Action>Measure</Action>
 * </Command>
 *
 * Additionnal Tags:
 * <DistanceRoundValue>       :Fixed value for distance display, 2 => 0.00, 3 => 0.000,
 *                             but -2 => 1221 -> 1200
 * <AreaRoundValue>           :Fixed value for area display, 2 => 0.00, 3 => 0.000,
 *                             but -2 => 1221 -> 1200
 * <MeasureTooltipContainer>  :The ID of an existing <div>, default: MeasureContainerBox,
 *                             which is styled in css file (see bellow)
 * <MeasureTooltipType>       :Default value: dynamic, could static too.
 *   <MeasureTipPositionTop>  :if static above given, then give here the Top position
 *   <MeasureTipPositionLeft> :if static above given, then give here the Left position
 * 
 * You may want to customize the canvas distance and area appearance, please use these tags:
 *
 * <AreaFillStyle>            :Fill color rgba for area drawing: sample value: rgba(0,255,0,0.3)
 * <AreaLineStyleWidth>       :Border width in pixel for area drawing: sample value: 2
 * <AreaLineStyleColor>       :Border color rgba for area drawing.
 * <DistanceNormalStyleWidth> :Line width in pixel for distance drawing.
 * <DistanceNormalStyleColor> :Line color rgba for distance drawing.
 * <DistanceEditStyleWidth>   :Line width in pixel for current distance drawing.
 * <DistanceEditStyleColor>   :Line color rgba for current distance drawing.
 * <AreaEditStyleWidth>       :Line width in pixel for current area drawing.
 * <AreaEditStyleColor>       :Line color rgba for current area drawing.
 *
 * Place this in your css file, style of the Tooltip (Here fusion style)
 *
 * #MeasureContainerBox {
 *    background-image: url('./images/headerbg.gif');
 *    background-repeat: repeat-x;
 *    font: 11px tahoma;
 *    color: #FFFFFF;
 *    position: absolute;
 *    width: 140px;
 *    float: left;
 *    border: solid #000000 2px;
 *    display : 'none';
 *    visibility : hidden;
 *    filter:alpha(opacity=75);
 *    -moz-opacity:0.75;
 *    opacity: 0.75;
 * }   
 *
 * Distances for the current segment and the total distance are advertised
 * through the Fusion.Event.MEASURE_CHANGED event. Only tested with meter unit
 * for now. You may want to change the htlm text to format the 
 * tooltip to match your desire: See Vars: dTipStr and aTipStr below.
 * 
 * **********************************************************************/

Fusion.Constant.MEASURE_TYPE_DISTANCE = 0;
Fusion.Constant.MEASURE_TYPE_AREA = 1;
Fusion.Constant.MEASURE_TYPE_BOTH = 2;

Fusion.Constant.MEASURE_TOOLTIP_DYNAMIC = 0;
Fusion.Constant.MEASURE_TOOLTIP_STATIC = 1;
 
Fusion.Event.MEASURE_CHANGED = Fusion.Event.lastEventId++;
Fusion.Widget.Measure = Class.create();
Fusion.Widget.Measure.prototype = {
    isDigitizing: false,
    //distance of each segment
    aDistances: [],
    //Array of points used to compute area
    aAreaFirstPoint: null,
    //cumulativeDistance
    cumulativeDistance: 0,
    lastDistance: 0,
    //for areas
    //cumulativeArea
    cumulativeArea: 0,
    lastArea: 0,
    aAreas: [],
    
    /* the units to display distances in */
    units: Fusion.UNKNOWN,

    /* Type of measure: values = disance, area or both, default: both*/
    mType: null,

    /* Precision of the distance displayed */
    distPrecision: 0,
    
    /* Precision of the area displayed */
    areaPrecision: 0,
    
    /* an HTML container to put the current distance in */
    measureTip: null,
        
    /* Static position of Tooltip Box TOP */
    measureTipPositionTop: null,
   
    /* Static position of Tooltip Box LEFT */ 
    measureTipPositionLeft: null,
    
    /* Tooltip appearance: static or dynamic */
    tooltipType: '',

    /* Style for the distance line used for distance draw */   
    distanceNormalStyle: null,

    /* Style for the polygon used for area draw */   
    fillStyle: null,

    /* Style for the polygon line used for area draw */    
    areaStyle: null,
    
    initialize : function(widgetTag) {
        Object.inheritFrom(this, Fusion.Widget.prototype, [widgetTag, true]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, []);
        Object.inheritFrom(this, Fusion.Tool.Canvas.prototype, []);
        this.asCursor = ['crosshair'];
        var json = widgetTag.extension;
        this.units = (json.Units && (json.Units[0] != '')) ?  Fusion.unitFromName(json.Units[0]): this.units;
        this.distPrecision = json.DistancePrecision ? json.DistancePrecision[0] : 2;
        this.areaPrecision = json.AreaPrecision ? json.AreaPrecision[0] : 2;        
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
        var container = json.MeasureTooltipContainer ? json.MeasureTooltipContainer[0] : 'MeasureContainerBox';
        //Here are the canvas style definition
        var fillStyle = json.FillStyle ? json.FillStyle[0] : 'rgba(0,0,255, 0.3)';
        var lineStyleWidth = json.LineStyleWidth ? json.LineStyleWidth[0] : 2;
        var lineStyleColor = json.LineStyleColor ? json.LineStyleColor[0] : 'rgba(0,0,255,0.3)';     
        this.fillStyle = new Fusion.Tool.Canvas.Style({fillStyle:fillStyle});
        this.lineStyle = new Fusion.Tool.Canvas.Style({lineWidth:lineStyleWidth,strokeStyle:lineStyleColor});  	
        //set default container if not specified 
        var cont = document.getElementById(container);
        if (cont == null){
            cont = document.createElement('div');
            cont.id = container;
        }  
        if (cont != '') {
            this.measureTip = $(cont);
        }
        if (this.measureTip) {
            if(json.MeasureTooltipType){
            	if(json.MeasureTooltipType[0] == 'dynamic') {
                    this.tooltipType = Fusion.Constant.MEASURE_TOOLTIP_DYNAMIC;
                } else {
                    this.tooltipType = Fusion.Constant.MEASURE_TOOLTIP_STATIC;
                }
            }
            if (this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_DYNAMIC) {
                var oDomElem =  this.getMap().getDomObj();
                oDomElem.appendChild(this.measureTip);
                this.measureTip.style.position = 'absolute';
                this.measureTip.style.display = 'none';
                this.measureTip.style.top = '0px';
                this.measureTip.style.left = '0px';
                this.measureTip.style.zIndex = 101;
            }
            if (this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_STATIC) {
            	this.measureTipPositionTop = json.MeasureTipPositionTop ? json.MeasureTipPositionTop[0] : 100;
                this.measureTipPositionLeft = json.MeasureTipPositionLeft ? json.MeasureTipPositionLeft[0] : 15;                                
                var oDomElem =  this.getMap().getDomObj();
                oDomElem.appendChild(this.measureTip);
                this.measureTip.style.position = 'absolute';
                this.measureTip.style.display = 'none';
                this.measureTip.style.top = this.measureTipPositionTop;
                this.measureTip.style.left = this.measureTipPositionLeft;
                this.measureTip.style.zIndex = 101;
            }
        }
        this.registerEventID(Fusion.Event.MEASURE_CHANGED);
        this.getMap().registerForEvent(Fusion.Event.MAP_EXTENTS_CHANGED, this.resetCanvas.bind(this));
        this.keyHandler = this.onKeyPress.bind(this);
    },
    
    onKeyPress: function(e) {
        //console.log('Rule::onKeyPress');
        var charCode = (e.charCode ) ? e.charCode : ((e.keyCode) ? e.keyCode : e.which);
        //console.log(charCode);
        if (charCode == Event.KEY_ESC) {
            this.resetCanvas();
        } 
    },
    
    /**
     * (public) activate()
     *
     * activate the measure tool
     */
    activateTool: function() {
        this.getMap().activateWidget(this);
        this._oButton.activateTool();
    },

    /**
     * (public) initVars()
     *
     * reset area and/or distance vars
     */    
    initVars: function() {
        this.aDistances = [];
        this.aAreas = [];
        this.cumulativeDistance = 0;
        this.lastDistance = 0;
        this.cumulativeArea = 0;
        this.lastArea = 0;
        this.aAreaFirstPoint = null;
    },
    
    activate: function() {
        this.activateCanvas();
        this.initVars();
        this.triggerEvent(Fusion.Event.MEASURE_CHANGED, this);
        Event.observe(document,"keypress",this.keyHandler);
    },
    
    /**
     * (public) deactivate()
     *
     * deactivate the ruler tool
     */
    deactivate: function() {
        //console.log('Ruler.deactivate');
        Event.stopObserving(document, 'keypress', this.keyHandler);           
        this._oButton.deactivateTool();
        this.deactivateCanvas();
        this.resetCanvas();
    },
    
    resetCanvas: function() {
        if (this.isDigitizing) {
            this.isDigitizing = false;
        }
        this.clearContext();
        this.initVars();
        this.triggerEvent(Fusion.Event.MEASURE_CHANGED, this);
        if (this.measureTip) {
            this.updateTip(null);
        }
    },
      
    /**
     * (public) mouseDown(e)
     *
     * handle the mouse down event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseDown: function(e) {  	
        if (Event.isLeftClick(e)) {
            var map = this.getMap();
            var p = map.getEventPosition(e);
            var gp = map.pixToGeo(p.x, p.y);
            //if not digitizing
            if (!this.isDigitizing) {
                var from = new Fusion.Tool.Canvas.Node(gp.x,gp.y, map);
                var to = new Fusion.Tool.Canvas.Node(gp.x,gp.y, map);
                var seg = new Fusion.Tool.Canvas.Segment(from,to);
                if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE) {
                    this.feature = new Fusion.Tool.Canvas.Line(map);
                } else {
                    this.feature = new Fusion.Tool.Canvas.Polygon(map);
                    this.feature.fillStyle = this.fillStyle;
                    this.feature.lineStyle = this.lineStyle;
                }
                this.feature.addSegment(seg);
                this.initVars();               
                this.aAreaFirstPoint = new Fusion.Tool.Canvas.Node(gp.x,gp.y, map);
                this.isDigitizing = true;                                  
            //if digitizing
            } else {
                var lastSegment = this.feature.lastSegment();
                lastSegment.to.set(gp.x,gp.y);
                this.feature.extendLine();
                if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
                    //Compute area
                    var a = this.measureArea(lastSegment);
                    this.aAreas.push(a);
                    this.cumulativeArea += a;
                }
                if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
                    //Compute distance
                    var d = this.measureSegment(lastSegment);
                    this.aDistances.push(d);
                    this.cumulativeDistance += d;
                    this.lastDistance = 0;
                } 
                this.triggerEvent(Fusion.Event.MEASURE_CHANGED, this, this.getDistance());
                if (this.measureTip) {
                    this.updateTip(e);
                } 
            }
            this.clearContext();
            this.feature.draw(this.context);
        }
    },

    /**
     * (public) mouseMove(e)
     *
     * handle the mouse move event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseMove: function(e) {
        if (!this.isDigitizing) {
            return;
        }
        var oElement = this.getMap().getDomObj();
        var target = e.target || e.srcElement;
        if (target.id != 'featureDigitizer') { //'_oEventDiv_'+oElement.id) {
            console.log('target id is ' + target.id);
            return;
        }
        var map = this.getMap();
        var p = map.getEventPosition(e);
        var gp = map.pixToGeo(p.x, p.y);
        
        var lastSegment = this.feature.lastSegment();
        lastSegment.to.set(gp.x,gp.y);
        this.clearContext();
        this.feature.draw(this.context);
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
            this.updateArea(lastSegment, e);
        }
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {  
            this.updateDistance(lastSegment, e);      
        }
    },
   
    /**
     * (public) dblClick(e)
     *
     * handle the mouse dblclick event
     *
     * @param e Event the event that happened on the mapObj
     */
    dblClick: function(e) {
        //console.log('Digitizer.dblClick');
        if (!this.isDigitizing) {
            return;
        }
        var p = this.getMap().getEventPosition(e);
        var gp = this.getMap().pixToGeo(p.x, p.y);   
        var seg = this.feature.lastSegment();
        seg.to.set(gp.x,gp.y);
        this.clearContext();
        this.feature.draw(this.context);
        
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
            
        }
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
        }  
        this.isDigitizing = false;
    },
    
    /**
     * (public) measureSegment(seg)
     *
     * return the length of the given segment
     *
     * @param seg Current canvas segment object
     * @return length of the given segment
     */    
    measureSegment: function(seg) {
        var map = this.getMap();
        var dist = Math.sqrt(Math.pow(seg.to.x-seg.from.x,2) +
                         Math.pow(seg.to.y-seg.from.y,2));        
        var dist = this.toFieldUnit(dist);
        return dist;
    },

    /**
     * (public) toFieldUnit(dist)
     *
     * return a distance in field unit, used both for area and distance computing
     *
     * @param dist Current distance
     * @return distance in field unit
     */      
    toFieldUnit: function(dist) {
    	var map = this.getMap();
        var d = dist;
    	if (this.units != Fusion.PIXELS) {
            d = dist * map._fMetersperunit;
        }
        /* magic number - this means the map units are meters! */
        if (map._fMetersperunit == 111319.4908) {
            var center = map.getCurrentCenter();
            d = d * Math.cos(2 * Math.PI * center.y / 360);
        }
    	return d;
    },

    /**
     * (public) measureArea()
     *
     * Compute partial area between the given segment and the first area point,
     * positive when the segment (vector) turns clockwise around the first point.
     * The total area is the sum of all partial areas.
     * Segment area must be signed for non-convex area computing.
     * Intersecting segment result on false area
     * @param seg Current canvas segment object
     * @return signed area
     */    
    measureArea: function(seg) {
        var map = this.getMap();
        var a = 0;
        var tmpArray = [];
	    //Initialise an array with the first point of area and the given segment, formula ends with first point
	    tmpArray[0] = this.aAreaFirstPoint;
	    tmpArray[1] = seg.from;
	    tmpArray[2] = seg.to;
	    tmpArray[3] = this.aAreaFirstPoint;
	    for (var i = 0; i < 3; i++) {
	        a += this.toFieldUnit(tmpArray[i+1].x - tmpArray[i].x)*this.toFieldUnit(tmpArray[i].y + tmpArray[i+1].y - 2*tmpArray[0].y)/2;
	    }   
        //return signed area
        return a;             
    },
    
     /**
     * (public) updateDistance(seg, e)
     *
     * Update distance tip and value when onMouseOver Event occurs
     *
     * @param seg Current segment
     * @param e Event The event that happened on the mapObj
     */ 
    updateDistance: function(seg, e) {
        this.lastDistance = this.measureSegment(seg);
        this.triggerEvent(Fusion.Event.MEASURE_CHANGED, this, this.getDistance());
        if (this.measureTip) {
            this.updateTip(e);
        }
    },
    
    getLastDistance: function() {
        var d = this.lastDistance;
        if (this.units != Fusion.PIXELS && this.units != Fusion.METERS) {
            d = Fusion.fromMeter(this.units,d);
        }
        return d;
    },
    
    getDistance: function() {
        var totalDistance = this.cumulativeDistance + this.lastDistance;
        if (this.units != Fusion.PIXELS && this.units != Fusion.METERS) {
            totalDistance = Fusion.fromMeter(this.units,totalDistance);
        }
        return totalDistance;
    },

     /**
     * (public) updateArea(seg, e)
     *
     * Update area tip and value when onMouseOver Event occurs
     *
     * @param seg Current segment
     * @param e Event The event that happened on the mapObj
     */  
    updateArea: function(seg, e){
        this.lastArea = this.measureArea(seg);
        //AS this event changes distances and area too, keep this name for now...
        this.triggerEvent(Fusion.Event.MEASURE_CHANGED, this, this.getArea());
        if (this.measureTip) {
            this.updateTip(e);
        }
    },
   
    getLastArea: function() {
        return this.lastArea;
    },

    getArea: function() {
        return this.cumulativeArea + this.lastArea;
    },

    setParameter: function(param, value) {
      //console.log('setParameter: ' + param + ' = ' + value);
        if (param == 'Units') {
            this.units = Fusion.unitFromName(value);
        }
    },

     /**
     * (public) updateTip()
     *
     * Update distance and/or area tip and value
     *
     */     
    updateTip: function(e) {
        if (!this.measureTip) {
            return;
        }
        //for dist
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
            var segDistance = this.getLastDistance();
            var totalDistance = this.getDistance();
            var dAmp = Math.pow(10, this.distPrecision);
            segDistance = parseInt(segDistance * dAmp)/dAmp;
            totalDistance = parseInt(totalDistance * dAmp)/dAmp;
        }
        if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA || this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH) {
            var segArea = this.getLastArea();
            var totalArea = this.getArea();
            var aAmp = Math.pow(10, this.areaPrecision);
            segArea = parseInt(segArea * aAmp)/aAmp;
            totalArea = parseInt(totalArea * aAmp)/aAmp;
        }  
        if ((segDistance == 0 && totalDistance == 0)||((segArea == 0 && totalArea == 0) && this.measureType != Fusion.Constant.MEASURE_TYPE_BOTH)) {
                this.measureTip.innerHTML = '';
                if(this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_DYNAMIC ||this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_STATIC ) {
                    this.measureTip.style.display = 'none';
                }     
        } else {  
            if (Fusion.unitName(this.units) == "Meters" || !this.units) {
                var unitDisplay = " m";
                
            }
            //var dTipStr = "<table><tr><td align='left' style='font-weight: bold'>Segment: </td><td>&nbsp</td><td>" + segDistance + unitDisplay + "</td>" + "<tr><td align='left' style='font-weight: bold'>Total: </td><td>&nbsp</td><td>" + totalDistance + unitDisplay +"</td></tr></table>";
            var dTipStr ="<TABLE><TR><TH>Segm:</TH><TD>" + segDistance + unitDisplay + "</TD></TR><TR><TH>Total:</TH><TD>" + totalDistance + unitDisplay + "</TD></TR></TABLE>";
            var aTipStr = "<TABLE><TR><TH>Area:</TH><TD>" + segArea + unitDisplay + "<sup>2</sup></TD></TR><TR><TH>Total:</TH><TD>" + totalArea + unitDisplay + "<sup>2</sup></TD></TR></TABLE>";
            
            // Distance or both
            if (this.measureType == Fusion.Constant.MEASURE_TYPE_DISTANCE) {
                this.measureTip.innerHTML = dTipStr;               
            }
            // Area or both
            if (this.measureType == Fusion.Constant.MEASURE_TYPE_AREA) {
                this.measureTip.innerHTML = aTipStr;
            }
            if (this.measureType == Fusion.Constant.MEASURE_TYPE_BOTH){
                this.measureTip.innerHTML = dTipStr + aTipStr;
            }
            // Both, area and distance
            if (this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_DYNAMIC) {
                this.measureTip.style.display = 'block';
                this.measureTip.style.visibility = 'visible';
                var p = this.getMap().getEventPosition(e);
                var size = Element.getDimensions(this.measureTip);
                var t = (p.y - size.height * 1.5);
                if (t < 0) {
                    t = p.y + size.height * 0.5;
                }               
                var pSize = Element.getDimensions(this.measureTip.parentNode);
                var l = p.x;
                if (l+size.width > pSize.width) {
                    l = p.x - size.width;
                }       
                this.measureTip.style.top = t + 'px';
                this.measureTip.style.left = l + 'px';
            }//end dynamic
            if (this.tooltipType == Fusion.Constant.MEASURE_TOOLTIP_STATIC) {
                this.measureTip.style.display = 'block';
                this.measureTip.style.visibility = 'visible';
                this.measureTip.style.top = this.measureTipPositionTop + 'px';
                this.measureTip.style.left = this.measureTipPositionLeft + 'px';
            }//end static
        }//else
    }
};
