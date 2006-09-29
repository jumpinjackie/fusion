/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Base class for widgets that want to use canvas functions
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license All Rights Reserved
 * ********************************************************************
 * ********************************************************************
 *
 * 
 * **********************************************************************/
//require('widgets/excanvas.js');

var GxCanvasTool = Class.create();
GxCanvasTool.prototype = 
{
    context: null,
    canvas: null,
    width: null,
    height: null,
    
    initialize : function(oCommand)
    {
        console.log('GxCanvasTool.initialize');
        
        this.context = null;
        this.canvas = null;
        this.width = null;
        this.height = null;
        
        this.mouseMoveCB = this.mouseMove.bindAsEventListener(this);
        this.mouseUpCB = this.mouseUp.bindAsEventListener(this);
        this.mouseDownCB = this.mouseDown.bindAsEventListener(this);
        this.dblClickCB = this.dblClick.bindAsEventListener(this);
    },
    
    /**
     * (public) clearContext()
     *
     * wipe the slate clean
     */
    clearContext: function() {
        //console.log('GxCanvasTool.clearContext');
        this.context.clearRect(0,0,this.width,this.height);
    },

    activateCanvas: function() {
        var map = this.getMap();
        var domObj = map.getDomObj();
        
        var size = Element.getDimensions(domObj);
        this.width = size.width;
        this.height = size.height;
        
        /* create dynamic canvas */
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            
            // we need to init this for IE 
            if (typeof G_vmlCanvasManager != "undefined") { 
                document.getElementsByTagName('BODY')[0].appendChild(this.canvas);
                G_vmlCanvasManager.initElement(this.canvas); 
                this.canvas = document.getElementsByTagName('BODY')[0].lastChild;
            } 
            
            this.canvas.id = 'featureDigitizer';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0px';
            this.canvas.style.left = '0px';
            this.canvas.style.width = this.width+'px';
            this.canvas.style.height = this.height+'px';
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.style.zIndex = 99;
            
        }
    
        domObj.appendChild(this.canvas);
        if (!this.context) {
            this.context = this.canvas.getContext('2d');
        }
        this.canvas.style.width = this.width+'px';
        this.canvas.style.height = this.height+'px';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        map.observeEvent('mousemove', this.mouseMoveCB);
        map.observeEvent('mouseup', this.mouseUpCB);
        map.observeEvent('mousedown', this.mouseDownCB);
        map.observeEvent('dblclick', this.dblClickCB);
    },
    
    /**
     * (public) deactivate()
     *
     * deactivate the line digitizing tool
     */
    deactivateCanvas: function() {
        //console.log('GxCanvasTool.deactivate');
        var map = this.getMap();
        map.getDomObj().removeChild(this.canvas);
        this.context.clearRect(0,0,this.width,this.height);
        map.stopObserveEvent('mousemove', this.mouseMoveCB);
        map.stopObserveEvent('mouseup', this.mouseUpCB);
        map.stopObserveEvent('mousedown', this.mouseDownCB);
        map.stopObserveEvent('dblclick', this.dblClickCB);
    },
    
    /**
     * (public) mouseDown(e)
     *
     * handle the mouse down event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseDown: function(e) { },

    /**
     * (public) mouseUp(e)
     *
     * handle the mouse up event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseUp: function(e) { },

    /**
     * (public) mouseMove(e)
     *
     * handle the mouse move event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseMove: function(e) { },

    /**
     * (public) dblClick(e)
     *
     * handle the mouse dblclick event
     *
     * @param e Event the event that happened on the mapObj
     */
    dblClick: function(e) { }
};

var FeaturePolygon = Class.create();
FeaturePolygon.prototype = {
    segments: null,
    lineStyle: null,
    fillStyle: null,
    
    initialize: function() {
        this.segments = [];
        this.lineStyle = new CanvasStyle({lineWidth:2,strokeStyle:'rgba(0,0,0,1.0)'});
        this.fillStyle = new CanvasStyle({fillStyle:'rgba(0,0,255, 0.5)'});
    },

    clean: function() {
        var nodes = this.getNodes();
        this.segments = [];
        var n1 = nodes[0];
        var n2 = nodes[1];
        for (var i=1; i<nodes.length;i++) {
            if (n1.x != n2.x || n1.y != n2.y) {
                this.addSegment(new Segment(n1,n2));
                n1 = n2;
            }
            n2 = nodes[i];
        }
    },

    getNodes: function() {
        var nodes = [];
        nodes.push(this.segments[0].from);
        for (var i=0; i<this.segments.length; i++) {
            nodes.push(this.segments[i].to);
        }
        nodes.push(this.segments[0].from);
        return nodes;
    },

    draw: function( context ) {
        if (this.segments.length > 2) {
            /* draw closing line and fill */
            var x = this.segments[0].from.x;
            var y = this.segments[0].from.y;
        
            this.fillStyle.apply(context)
            context.beginPath();
            context.moveTo(x,y);
            for (var i=0; i<this.segments.length; i++) {
                var s = this.segments[i];
                context.lineTo(s.to.x, s.to.y);         
            }
            context.lineTo(x,y); //closing line
            context.closePath();
            context.fill(); 
        }
        /* draw outline */
        for (var i=0; i<this.segments.length; i++) {
            this.segments[i].draw(context);
        }
    
        var last = this.lastSegment();
        context.beginPath();
        context.moveTo(last.to.x,last.to.y);
        context.lineTo(x,y);
        context.stroke();
    },

    addSegment: function( s ) {
        s.normalStyle = this.lineStyle;
        this.segments[this.segments.length] = s;
    },

    lastSegment: function() {
        return this.segments[this.segments.length-1];
    },

    /* extend an existing line by creating a new segment attached
     * to the last segment
     * @return the new segment
     */
    extendLine: function() {
        var last = this.lastSegment();
        var newNode = new Node(last.to.x, last.to.y);
        var newSegment = new Segment( last.to, newNode );
        this.addSegment(newSegment);
        return newSegment;  
    }
};

var FeatureLine = Class.create();
FeatureLine.prototype = {
    segments: null,
    lineStyle: null,
    
    initialize: function() {
        this.segments = [];
        this.lineStyle = new CanvasStyle({strokeStyle:'rgba(0,0,0,1.0)'});
    },

    clean: function() {
        var nodes = this.getNodes();
        this.segments = [];
        var n1 = nodes[0];
        var n2 = nodes[1];
        for (var i=1; i<nodes.length;i++) {
            if (n1.x != n2.x || n1.y != n2.y) {
                this.addSegment(new Segment(n1,n2));
                n1 = n2;
            }
            n2 = nodes[i];
        }
    },

    getNodes: function() {
        var nodes = [];
        nodes.push(this.segments[0].from);
        for (var i=0; i<this.segments.length; i++) {
            nodes.push(this.segments[i].to);
        }
        return nodes;
    },

    draw: function( context ) {
        for (var i=0; i<this.segments.length; i++) {
            this.segments[i].draw(context);
        }
    },

    addSegment: function( s ) {
        s.normalStyle = this.lineStyle;
        this.segments[this.segments.length] = s;
    },

    lastSegment: function() {
        return this.segments[this.segments.length-1];
    },

    /* extend an existing line by creating a new segment attached
     * to the last segment
     * @return the new segment
     */
    extendLine: function() {
        var last = this.lastSegment();
        var newNode = new Node(last.to.x, last.to.y);
        var newSegment = new Segment( last.to, newNode );
        this.addSegment(newSegment);
        return newSegment;  
    }
};

var Segment = Class.create();
Segment.prototype = {
    from: null,
    to: null,
    
    initialize: function(from, to) {
        this.from = from;
        this.to = to;
        this.isEditing = false;
        this.normalStyle = new CanvasStyle({lineWidth:1, strokeStyle:'rgba(0,0,0,1.0)'});
        this.editStyle = new CanvasStyle({lineWidth:1, strokeStyle:'rgba(255,0,0,1.0)'});
    },

    setNormalStyle: function( style ) {
        this.normalStyle = style;
    },

    setEditStyle: function( style ) {
        this.editStyle = style;
    },

    draw: function( context ) {
        /* set up correct style */
        if (this.isEditing) {
            this.editStyle.apply(context);
        } else {
            this.normalStyle.apply(context);
        }
    
        /* draw segment */
        context.beginPath();
        context.moveTo(this.from.x, this.from.y);
        context.lineTo(this.to.x, this.to.y);
        context.closePath();
        context.stroke();
    
        /* draw nodes if editing */
        if (this.isEditing) {
            this.from.draw( context );
            this.to.draw( context );
        }
    },

    /* changes rendering style */
    setEditing: function(bEditing) {
        this.isEditing = bEditing;
    }
};

var Node = Class.create();
Node.prototype = {
    x: null,
    y: null,
    
    initialize: function(x,y) {
        this.set(x,y);
        this.radius = 3;
    },

    set: function(x,y) {
        this.x = x;
        this.y = y;
    },

    /* draw a node on a canvas. */
    draw: function( context ) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2*Math.PI,1);
        context.closePath();
        context.stroke();
    }
};

/* encapsulate a context style */
var CanvasStyle = Class.create();
CanvasStyle.prototype = {
    properties: ['fillStyle',
                 'globalAlpha',
                 'globalCompositeOperation',
                 'lineCap',
                 'lineJoin',
                 'lineWidth',
                 'miterLimit',
                 'shadowBlur',
                 'shadowColor',
                 'shadowOffsetX',
                 'shadowOffsetY',
                 'strokeStyle'],
    
    initialize: function( o ) { 
        for (var i=0; i<this.properties.length; i++) {
            var p = this.properties[i];
            this[p] = o[p] ? o[p]:null;
        }
    },

    set: function( p, v ) {
        this[p] = v;
    },

    apply: function(context) {
        for (var i=0; i<this.properties.length; i++) {
            var p = this.properties[i];
            if (this[p]) {
                context[p] = this[p];
            }
        }
    }
};