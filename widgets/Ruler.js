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
    
    INCHES: 0,
    FEET: 1,
    MILES: 2,
    METERS: 3,
    KILOMETERS: 4,
    DEGREES: 5,
    PIXELS: 6,
    
    unitPerMeter: [39.37,3.2808,0.00062137,1.0,0.001,0.000009044],
    meterPerUnit: [0.0254,0.3048,1609.3445,1.0,1000.0,110570],
    unitNames: ['Inches', 'Feet', 'Miles', 'Meters', 'Kilometers', 'Degrees'],
    unitAbbr: ['in', 'ft', 'mi', 'm', 'km', '&deg;'],
    
    /* the units to display distances in */
    units: null,
    
    initialize : function(oCommand)
    {
        console.log('Ruler.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Ruler', true]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxCanvasTool.prototype, [oCommand]);
        Object.inheritFrom(this, EventMgr.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.asCursor = ['crosshair'];
        
        var u = oCommand.oxmlNode.getNodeText('Units');
        switch(u.toLowerCase()) {
            case 'inches':
                this.units = this.INCHES;
                break;
            case 'feet':
                this.units = this.FEET;
                break;
            case 'miles':
                this.units = this.MILES;
                break;
            case 'meters':
                this.units = this.METERS;
            case 'kilometers':
                this.units = this.KILOMETERS;
                break;
            case 'degrees':
                this.units = this.DEGREES;
                break;
            default:
                this.units = this.METERS;
        }
        
        this.registerEventID(RULER_DISTANCE_CHANGED);
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
        this.isDigitizing = false;
        this.clearContext();
        this._oButton.deactivateTool();
        this.deactivateCanvas();
        
        this.aDistances = [];
        this.cumulativeDistance = 0;
        this.lastDistance = 0;
        this.triggerEvent(RULER_DISTANCE_CHANGED, this);
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
        var map = this.getMap();
        var p = map.getEventPosition(e);
        

        if (!this.isDigitizing) {
            this.currentFeature = new FeatureLine();
            this.lastDistance = 0;
            this.cumulativeDistance = 0;
            this.aDistances = [];
            var from = new Node(p.x,p.y, map);
            var to = new Node(p.x,p.y, map);
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
        var seg = this.currentFeature.lastSegment();
        seg.to.set(p.x,p.y);
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
        var s = map.pixToGeo(seg.from.x, seg.from.y);
        var e = map.pixToGeo(seg.to.x, seg.to.y);
        var geoDist = Math.sqrt(Math.pow(e.x-s.x,2) + Math.pow(e.y-s.y,2));
        var meters = geoDist * map._fMetersperunit;
        return meters;
    },
    
    updateDistance: function(seg) {
        this.lastDistance = this.measureSegment(seg);
        this.triggerEvent(RULER_DISTANCE_CHANGED, this, this.getDistance());
    },
    
    getLastDistance: function() {
        var d = this.lastDistance;
        if (this.units != this.METERS) {
            d = d * this.unitPerMeter[this.units];
        }
        return d;
    },
    
    getDistance: function() {
        var totalDistance = this.cumulativeDistance + this.lastDistance;
        if (this.units != this.METERS) {
            totalDistance = totalDistance * this.unitPerMeter[this.units];
        }
        return totalDistance;
    }
};
