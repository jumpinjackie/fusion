/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Ruler widget
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license All Rights Reserved
 * ********************************************************************
 * ********************************************************************
 *
 * The Ruler widget allows the user to measure distances on the map in
 * one or more segments.
 *
 * Distances for the current segment and the total distance are advertised
 * through the RULER_DISTANCE_CHANGED event.
 * 
 * **********************************************************************/
Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxCanvasTool.js');

var RULER_DISTANCE_CHANGED;

var Ruler = Class.create();
Ruler.prototype = 
{
    isDigitizing: false,
    //distance of each segment
    aDistances: [],
    //cumulativeDistance distance
    cumulativeDistance: 0,
    lastDistance: 0,
    
    /* the units to display distances in */
    units: Fusion.UNKNOWN,
    
    /* an HTML container to put the current distance in */
    rulerTip: null,
    
    initialize : function(oCommand)
    {
        /*console.log('Ruler.initialize');*/
        Object.inheritFrom(this, GxWidget.prototype, ['Ruler', true, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        Object.inheritFrom(this, GxCanvasTool.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.asCursor = ['crosshair'];
        var json = oCommand.jsonNode;
        
        this.units = (json.Units && (json.Units[0] != '')) ?
                      Fusion.unitFromName(json.Units[0]): this.units;
        
        var container = json.RulerTooltipContainer ? json.RulerTooltipContainer[0] : '';
        if (container != '') {
            this.rulerTip = $(container);
        }
        
        if (this.rulerTip) {
            this.rulerTipType = json.RulerTooltipType ?
                                json.RulerTooltipType[0].toLowerCase() : 'dynamic';
            if (this.rulerTipType == 'dynamic') {
                var oDomElem =  this.getMap().getDomObj();
                oDomElem.appendChild(this.rulerTip);
                this.rulerTip.style.position = 'absolute';
                this.rulerTip.style.display = 'none';
                this.rulerTip.style.top = '0px';
                this.rulerTip.style.left = '0px';
                this.rulerTip.style.zIndex = 101;
            }
        }
        
        this.registerEventID(RULER_DISTANCE_CHANGED);
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.resetCanvas.bind(this));
        this.keyHandler = this.onKeyPress.bind(this);
    },
    
    onKeyPress: function(e) {
        console.log('Rule::onKeyPress');
        var charCode = (e.charCode ) ? e.charCode : ((e.keyCode) ? e.keyCode : e.which);
        console.log(charCode);
        if (charCode == Event.KEY_ESC) {
            this.resetCanvas();
        } 
    },
    
    /**
     * (public) activate()
     *
     * activate the ruler tool
     */
    activateTool: function() {
        this.getMap().activateWidget(this);
        this._oButton.activateTool();
    },
    
    
    activate: function() {
        this.activateCanvas();
        this.aDistances = [];
        this.cumulativeDistance = 0;
        this.lastDistance = 0;
        this.triggerEvent(RULER_DISTANCE_CHANGED, this);
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
        this.aDistances = [];
        this.cumulativeDistance = 0;
        this.lastDistance = 0;
        this.triggerEvent(RULER_DISTANCE_CHANGED, this);
        if (this.rulerTip) {
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
        //console.log('Ruler.mouseDown');
        if (Event.isLeftClick(e)) {
            var map = this.getMap();
            var p = map.getEventPosition(e);
            var gp = map.pixToGeo(p.x, p.y)

            if (!this.isDigitizing) {
                this.currentFeature = new FeatureLine(map);
                this.lastDistance = 0;
                this.cumulativeDistance = 0;
                this.aDistances = [];
                var from = new Node(gp.x,gp.y, map);
                var to = new Node(gp.x,gp.y, map);
                var seg = new Segment(from,to);
                seg.setEditing(true);
                this.currentFeature.addSegment(seg);
                this.clearContext();
                this.currentFeature.draw(this.context);     
                this.isDigitizing = true;
            } else {
                var seg = this.currentFeature.lastSegment();
                var d = this.measureSegment(seg);
                this.aDistances.push(d);
                this.cumulativeDistance += d;
                this.lastDistance = 0;
                this.triggerEvent(RULER_DISTANCE_CHANGED, this, this.getDistance());
                if (this.rulerTip) {
                    this.updateTip(e);
                }
                seg.setEditing(false);
                seg = this.currentFeature.extendLine();
                seg.setEditing(true);
                this.clearContext();
                this.currentFeature.draw(this.context);
            }
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
        //console.log('Digitizer.mouseMove');
        if (!this.isDigitizing) return;
    
        var p = this.getMap().getEventPosition(e);
        var gp = this.getMap().pixToGeo(p.x, p.y);
        var seg = this.currentFeature.lastSegment();
        seg.to.set(gp.x,gp.y);
        this.clearContext();
        this.currentFeature.draw(this.context);
        this.updateDistance(seg, e);
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
        if (!this.isDigitizing) return;
    
        var p = this.getMap().getEventPosition(e);
        var seg = this.currentFeature.lastSegment();
        seg.setEditing(false);
        seg.to.set(p.x,p.y);
        this.clearContext();
        this.currentFeature.draw(this.context);
        this.isDigitizing = false;
    },
    
    measureSegment: function(seg) {
        var map = this.getMap();
        var dist = Math.sqrt(Math.pow(seg.to.x-seg.from.x,2) +
                         Math.pow(seg.to.y-seg.from.y,2));
        if (this.units != Fusion.PIXELS) {
            dist = dist * map._fMetersperunit;
        }
        /* magic number - this means the map units are meters! */
        if (map._fMetersperunit == 111319.4908) {
            var center = map.getCurrentCenter();
            dist = dist * Math.cos(2 * Math.PI * center.y / 360);
        }
        return dist;
    },
    
    updateDistance: function(seg, e) {
        this.lastDistance = this.measureSegment(seg);
        this.triggerEvent(RULER_DISTANCE_CHANGED, this, this.getDistance());
        if (this.rulerTip) {
            this.updateTip(e);
        }
    },
    
    getLastDistance: function() {
        var d = this.lastDistance;
        if (this.units != Fusion.PIXELS && this.units != Fusion.METERS) {
            d = Fusion.toMeter(this.units,d);
        }
        return d;
    },
    
    getDistance: function() {
        var totalDistance = this.cumulativeDistance + this.lastDistance;
        if (this.units != Fusion.PIXELS && this.units != Fusion.METERS) {
            totalDistance = Fusion.toMeter(this.units,totalDistance);
        }
        return totalDistance;
    },
    
    setParameter: function(param, value) {
        if (param == 'Units') {
            this.units = value;
        }
    },
    
    updateTip: function(e) {
        if (!this.rulerTip) {
            return;
        }
        var segDistance = this.getLastDistance();
        var totalDistance = this.getDistance();
        
        segDistance = parseInt(segDistance * 100)/100;
        totalDistance = parseInt(totalDistance * 100)/100;
        if (segDistance == 0 && totalDistance == 0) {
            this.rulerTip.innerHTML = '';
            if(this.rulerTipType == 'dynamic') {
                this.rulerTip.style.display = 'none';
            }
        } else {
            this.rulerTip.innerHTML = "Segment: " + segDistance + " " + Fusion.unitName(this.units) + "<BR>Total: " + totalDistance + " " + Fusion.unitName(this.units);
            if(this.rulerTipType == 'dynamic') {
                this.rulerTip.style.display = 'block';
                var p = this.getMap().getEventPosition(e);
                var size = Element.getDimensions(this.rulerTip);
                this.rulerTip.style.top = (p.y - size.height*2) + 'px';
                this.rulerTip.style.left = p.x + 'px';
            }
        }
    }
};
