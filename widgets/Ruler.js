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
 * 
 * **********************************************************************/
Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxCanvasTool.js');
//Fusion.require('widgets/excanvas.js');

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
    units: null,
    
    initialize : function(oCommand)
    {
        console.log('Ruler.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Ruler', true]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxCanvasTool.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        this.asCursor = ['crosshair'];
        
        var u = oCommand.oxmlNode.getNodeText('Units');
        switch(u.toLowerCase()) {
            case 'inches':
                this.units = Fusion.INCHES;
                break;
            case 'feet':
                this.units = Fusion.FEET;
                break;
            case 'miles':
                this.units = Fusion.MILES;
                break;
            case 'meters':
                this.units = Fusion.METERS;
                break;
            case 'kilometers':
                this.units = Fusion.KILOMETERS;
                break;
            case 'degrees':
                this.units = Fusion.DEGREES;
                break;
            default:
                this.units = Fusion.METERS;
        }
        console.log( 'Ruler default units are ' + Fusion.unitName(this.units));
        this.registerEventID(RULER_DISTANCE_CHANGED);
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.resetCanvas.bind(this));
        
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
    },
    
    /**
     * (public) deactivate()
     *
     * deactivate the ruler tool
     */
    deactivate: function() {
        //console.log('Ruler.deactivate');
        this._oButton.deactivateTool();
        this.deactivateCanvas();
        this.resetCanvas();
    },
    
    resetCanvas: function() {
        if (this.isDigitizing) {
            this.isDigitizing = false;
            this.clearContext();
            this.aDistances = [];
            this.cumulativeDistance = 0;
            this.lastDistance = 0;
            this.triggerEvent(RULER_DISTANCE_CHANGED, this);
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
        this.updateDistance(seg);
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
        return Math.sqrt(Math.pow(seg.to.x-seg.from.x,2) +
                         Math.pow(seg.to.y-seg.from.y,2)) * map._fMetersperunit;
    },
    
    updateDistance: function(seg) {
        this.lastDistance = this.measureSegment(seg);
        this.triggerEvent(RULER_DISTANCE_CHANGED, this, this.getDistance());
    },
    
    getLastDistance: function() {
        var d = this.lastDistance;
        if (this.units != Fusion.METERS) {
            d = Fusion.toMeter(this.units,d);
        }
        return d;
    },
    
    getDistance: function() {
        var totalDistance = this.cumulativeDistance + this.lastDistance;
        if (this.units != Fusion.METERS) {
            totalDistance = Fusion.toMeter(this.units,totalDistance);
        }
        return totalDistance;
    },
    
    setParameter: function(param, value) {
        if (param == 'Units') {
            this.units = value;
        }
    }
};
