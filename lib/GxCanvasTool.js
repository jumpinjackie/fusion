/********************************************************************** * 
 * @project Fusion
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
//Fusion.require('widgets/excanvas.js');

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

var FeatureCircle = Class.create();
FeatureCircle.prototype = {
    center: null,
    radius: null,
    lineStyle: null,
    fillStyle: null,
    
    initialize: function(map) {
        this.center = new Node(0,0, map);
        this.radius = 1;
        this.lineStyle = new CanvasStyle({lineWidth:2,strokeStyle:'rgba(0,0,0,1.0)'});
        this.fillStyle = new CanvasStyle({fillStyle:'rgba(0,0,255, 0.5)'});
    },
    
    setCenter: function(x,y) {
        this.center.set(x,y);
    },
    
    setRadius: function(r) {
        if (r > 1 || r < -1) {
            this.radius = Math.abs(r);
        } else {
            this.radius = 1;
        }
    },
    
    draw: function( context ) {
        var x = this.center.x;
        var y = this.center.y;
        var radius = this.radius;
        
        this.fillStyle.apply(context)
        this.lineStyle.apply(context)
        
        context.beginPath();
        context.arc(x,y,radius, 0, 2*Math.PI, 1);
        context.closePath();
        context.fill(); 
        context.stroke();
        
    }
};

var FeaturePolygon = Class.create();
FeaturePolygon.prototype = {
    segments: null,
    lineStyle: null,
    fillStyle: null,
    map: null,
    
    initialize: function(map) {
        this.map = map;
        this.segments = [];
        this.lineStyle = new CanvasStyle({lineWidth:2,strokeStyle:'rgba(0,0,0,1.0)'});
        this.fillStyle = new CanvasStyle({fillStyle:'rgba(0,0,255, 0.5)'});
    },

    clean: function() {
        var nodes = this.getNodes();
        this.segments = [];
        var n1 = nodes[0];
        console.log('n1: '+ n1);
        var n2 = nodes[1];
        for (var i=1; i<nodes.length;i++) {
            if (n1.x != n2.x || n1.y != n2.y) {
                this.addSegment(new Segment(n1,n2));
                console.log('n2: '+ n2);
                n1 = n2;
            }
            n2 = nodes[i];
        }
        
        this.addSegment(new Segment(n1, nodes[0]));
        console.log(this);
    },

    getNodes: function() {
        var nodes = [];
        nodes.push(this.segments[0].from);
        for (var i=0; i<this.segments.length; i++) {
            nodes.push(this.segments[i].to);
        }
        return nodes;
    },

    /*
     * remove node from the nodes in this feature
     * and adjust segments
     */
    removeNode: function(node) {
        //end cases
        if (node == this.segments[0].from) {
            this.segments[0].from = null;
            this.segments.shift();
            this.segments[0].from = this.segments[this.segments.length - 1].to;
            return;
        }
        if (node == this.segments[this.segments.length -1].from) {
            this.segments[this.segments.length -1].from = null;
            this.segments.pop();
            this.segments[0].from = this.segments[this.segments.length - 1].to;
            return;
        }
        //general case
        for (var i=1; i < this.segments.length; i++) {
            if (node == this.segments[i].from){
                this.segments[i-1].to = this.segments[i].to;
                this.segments[i].from = null;
                this.segments.splice(i, 1);
                return;
            }
        };
        
    },
    
    draw: function( context ) {
        if (this.segments.length > 2) {
            /* draw closing line and fill */
            var x = this.segments[0].from.px;
            var y = this.segments[0].from.py;
        
            this.fillStyle.apply(context)
            context.beginPath();
            context.moveTo(x,y);
            for (var i=0; i<this.segments.length; i++) {
                var s = this.segments[i];
                context.lineTo(s.to.px, s.to.py);         
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
        context.moveTo(last.to.px,last.to.py);
        context.lineTo(x,y);
        context.stroke();
    },

    addSegment: function( s ) {
        s.normalStyle = this.lineStyle;
        this.segments[this.segments.length] = s;
        console.log('add segment ' + s);
    },

    lastSegment: function() {
        return this.segments[this.segments.length-1];
    },

    /* find the segment with the given node as its end
     * @param Object node - the node at the end
     * @param Int tolerance - an optional tolerance in pixels
     * @return the segment or null if nothing is found.
     */
     segmentTo: function(node) {
         var margin = arguments.length > 1?arguments[1]:3;
         for (var i=0; i<this.segments.length; i++) {
             if (this.segments[i].hasTo(node, margin)) {
                 return this.segments[i];
             }
         }
         return null;        
     },

    /* find the segment with the given node as its start
     * @param Object node - the node at the start
     * @param Int tolerance - an optional tolerance in pixels
     * @return the segment or null if there is none.
     */
     segmentFrom: function(node) {
         var margin = arguments.length > 1?arguments[1]:3;
         for (var i=0; i<this.segments.length; i++) {
             if (this.segments[i].hasFrom(node, margin)) {
                 return this.segments[i];
             }
         }
         return null;        
     },

    /* extend an existing line by creating a new segment attached
     * to the last segment
     * @return the new segment
     */
    extendLine: function() {
        var last = this.lastSegment();
        var newNode = new Node(last.to.x, last.to.y, this.map);
        var newSegment = new Segment( last.to, newNode );
        this.addSegment(newSegment);
        return newSegment;  
    },

    /* determine if the passed pixel coordinate is within this feature
     * @param point Object - {px,py} representation of point
     * @return true if the point is contained
     *
     * uses crossing test (Jordan Curve Theorem) algorithm discussed at
     * http://www.acm.org/tog/editors/erich/ptinpoly/
     */
    contains: function(node) {
        return true;  
    },
    
    
    toString: function() {
        var szFeature = this.segments[0].from.toString();
        for (var i=0; i < this.segments.length; i++) {
            szFeature += ',' + this.segments[i].to.toString();
        }
        return 'POLYGON(' + szFeature + ')';
    }
    
    
};

var FeatureLine = Class.create();
FeatureLine.prototype = {
    segments: null,
    lineStyle: null,
    map: null,
    
    initialize: function(map) {
        this.map = map;
        this.segments = [];
        this.lineStyle = new CanvasStyle({strokeStyle:'rgba(0,0,0,1.0)'});
    },

    clean: function() {
        var nodes = this.getNodes();
        this.segments = [];
        var n1 = nodes[0];
        var n2 = nodes[1];
        for (var i=1; i<nodes.length;i++) {
            console.log('n1: '+ n1);
            console.log('n2: '+ n2);
            n2 = nodes[i];
            if (n1.x != n2.x || n1.y != n2.y) {
                this.addSegment(new Segment(n1,n2));
                n1 = n2;
            }
        }
        console.log(this);
    },

    getNodes: function() {
        var nodes = [];
        nodes.push(this.segments[0].from);
        for (var i=0; i<this.segments.length; i++) {
            nodes.push(this.segments[i].to);
        }
        return nodes;
    },

    /*
     * remove node from the nodes in this feature
     * and adjust segments
     */
    removeNode: function(node) {
        //end cases
        if (node == this.segments[0].from) {
            this.segments[0].from = null;
            this.segments.shift();
            return;
        }
        if (node == this.segments[this.segments.length -1].from) {
            this.segments[this.segments.length -1].from = null;
            this.segments.pop();
            return;
        }
        //general case
        for (var i=1; i < this.segments.length; i++) {
            if (node == this.segments[i].from){
                this.segments[i-1].to = this.segments[i].to;
                this.segments[i].from = null;
                this.segments.splice(i, 1);
                return;
            }
        };
        
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

    /* find the segment with the given node as its end
     * @param Object node - the node at the end
     * @param Int tolerance - an optional tolerance in pixels
     * @return the segment or null if nothing is found.
     */
     segmentTo: function(node) {
         var margin = arguments.length > 1?arguments[1]:3;
         for (var i=0; i<this.segments.length; i++) {
             if (this.segments[i].hasTo(node, margin)) {
                 return this.segments[i];
             }
         }
         return null;        
     },

    /* find the segment with the given node as its start
     * @param Object node - the node at the start
     * @param Int tolerance - an optional tolerance in pixels
     * @return the segment or null if there is none.
     */
     segmentFrom: function(node) {
         var margin = arguments.length > 1?arguments[1]:3;
         for (var i=0; i<this.segments.length; i++) {
             if (this.segments[i].hasFrom(node, margin)) {
                 return this.segments[i];
             }
         }
         return null;        
     },

    /* extend an existing line by creating a new segment attached
     * to the last segment
     * @return the new segment
     */
    extendLine: function() {
        var last = this.lastSegment();
        var newNode = new Node(last.to.x, last.to.y, this.map);
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

    /* returns true if the node is at the end of this segment
     * within the given margin
     * @return Bool true if found within margin, false otherwise
     */
    hasTo: function(node, margin) {
        return this.to.near({x:node.px, y:node.py}, margin);
    },

    /* returns true if the node is at the start of this segment
     * within the given margin
     * @return Bool true if found within margin, false otherwise
     */
    hasFrom: function(node, margin) {
        return this.from.near({x:node.px, y:node.py}, margin);
    },
    
    /* returns true if the given point falls along this segment
     * within the given margin
     * @return Bool true if found within margin, false otherwise
     */
    intersectsPoint: function(point, margin){
        //check bbox
        var minX = Math.min(this.to.px, this.from.px);
        var maxX = Math.max(this.to.px, this.from.px);
        if (point.x > maxX || point.x < minX){return false;};
        var maxY = Math.max(this.to.py, this.from.py);
        var minY = Math.min(this.to.py, this.from.py);
        if (point.y < minY || point.y > maxY){return false;};
        
        //determine slope
        var slope = parseFloat((maxY-minY))/(maxX-minX);
        var segY = slope * (point.x - minX) + minY;
        return (segY - margin < point.y && segY + margin > point.y);

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
        context.moveTo(this.from.px, this.from.py);
        context.lineTo(this.to.px, this.to.py);
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
    },
    
    toString: function() {
        return this.from.toString() + ', '+ this.to.toString();
    }
    
};

var Node = Class.create();
Node.prototype = {
    x: null,
    y: null,
    px: null,
    py: null,
    uid: null,
    map: null,
    counter: [0],
    isSelected: false,
    
    initialize: function(x,y, map) {
        this.map = map;
        this.set(x,y);
        var p = map.geoToPix(x, y);
        this.setPx(p.x, p.y);
        this.radius = 3;
        this.uid = this.counter[0];
        this.counter[0]++;
        this.normalStyle = new CanvasStyle({lineWidth:1, strokeStyle:'rgba(0,0,0,1.0)'});
        this.selectedStyle = new CanvasStyle({lineWidth:1, fillStyle:'rgba(255,0,0,1.0)',
                                                strokeStyle:'rgba(255,0,0,1.0)'});
    },

    set: function(x,y) {
        this.x = x;
        this.y = y;
    },
    
    setPx: function(px, py) {
        this.px = px;
        this.py = py;
    },
    
    updateGeo: function() {
        if (!this.px || !this.py) {return;};
        var g = this.map.pixToGeo(this.px, this.py);
        this.set(g.x, g.y);
    },
    
    /* returns true if the supplied pixel position is
     * within the given tolerance
     * @return Bool true if found within margin, false otherwise
     */
     /*TODO: uses a square envelope for speed but could use radius
      *TODO: should support geographic tolerance
      */
    near: function(point, tolerance) {
        var minX = point.x - tolerance;
        var maxX = point.x + tolerance;
        var maxY = point.y + tolerance;
        var minY = point.y - tolerance;
        return ((this.px > minX && this.px < maxX) && (this.py > minY && this.py < maxY))?true:false;
    },

    /* returns true if this node is
     * within the given bbox
     * @param Array bbox - array of pixel coordinates to search within
     * @return Bool true if found within, false otherwise
     */
    within: function(bbox) {
        //TODO: handle > 2 coord pairs
        var minX = Math.min(bbox[0], bbox[2]);
        var maxX = Math.max(bbox[0], bbox[2]);
        var minY = Math.min(bbox[1], bbox[3]);
        var maxY = Math.max(bbox[1], bbox[3]);
        return ((this.px > minX && this.px < maxX) && (this.py > minY && this.py < maxY))?true:false;
    },

    /* draw a node on a canvas. */
    draw: function( context ) {
        /* set up correct style */
        if (this.isSelected) {
            this.selectedStyle.apply(context);
        } else {
            this.normalStyle.apply(context);
        }

        context.beginPath();
        context.arc(this.px, this.py, this.radius, 0, 2*Math.PI,1);
        context.closePath();
        context.stroke();
        if(this.isSelected){
            context.fill();
        };
    },
    
    /* changes rendering style */
    setSelected: function(bSelected) {
        this.isSelected = bSelected;
    },

    toString: function() {
        return '('+this.uid+') '+ this.x + ' ['+this.px+'px] '+ this.y+ ' ['+this.py+'px] ';
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