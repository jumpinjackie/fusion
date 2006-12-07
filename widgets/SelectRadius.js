/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Select widget
 * @author yassefa@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license MIT
 * ********************************************************************
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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ********************************************************************
 *
 * perform a selection using the map guide web layout conifiguration file
 * 
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxCanvasTool.js');

var SelectRadius = Class.create();
SelectRadius.prototype = {       
    nTolerance : 3, //default pixel tolernace for a point click
    defaultRadius: 20,
    initialize : function(oCommand) {
        //console.log('Select.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['SelectRadius', true, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxCanvasTool.prototype, [this.getMap()]);
        
        this.setMap(oCommand.getMap());
        this.asCursor = ['auto'];

        if (parseInt(oCommand.oxmlNode.getNodeText('Tolerance')) > 0) {
            nTolerance = parseInt(oCommand.oxmlNode.getNodeText('Tolerance'));
        }
        
        var container = oCommand.oxmlNode.getNodeText('RadiusTooltipContainer');
        if (container != '') {
            this.radiusTip = $(container);
        }
        
        if (this.radiusTip) {
            var type = oCommand.oxmlNode.getNodeText('RadiusTooltipType');
            switch (type.toLowerCase()) {
                case 'dynamic':
                case 'static':
                    this.radiusTipType = type.toLowerCase();
                default:
                    this.radiusTipType = 'dynamic';
            }
            if (this.radiusTipType == 'dynamic') {
                var oDomElem =  this.getMap().getDomObj();
                oDomElem.appendChild(this.radiusTip);
                this.radiusTip.style.position = 'absolute';
                this.radiusTip.style.display = 'none';
                this.radiusTip.style.top = '0px';
                this.radiusTip.style.left = '0px';
                this.radiusTip.style.zIndex = 101;
            }
        }
    },
    
    setRadius: function(r) {
        this.defaultRadius = r;
    },
    
    getRadius: function() {
        if (this.circle) {
            return this.circle.radius;
        } else {
            return this.defaultRadius;
        }
    },
    
    /**
     * called when the button is clicked by the MGButtonBase widget
     */
    activateTool : function() {
        this.getMap().activateWidget(this);
        //this.activate();
    },

    /**
     * activate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     */
    activate : function() {
        this.activateCanvas();
        this.getMap().setCursor(this.asCursor);
        /*icon button*/
        this._oButton.activateTool();
        if (!this.circle) {
            this.circle = new FeatureCircle(this.getMap());
            this.circle.setCenter(0);
        }
    },

    /**
     * deactivate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     **/
    deactivate : function() {
         this.deactivateCanvas();
         this.getMap().setCursor('auto');
         /*icon button*/
         this._oButton.deactivateTool();
    },
    
    /**
     * (public) mouseDown(e)
     *
     * handle the mouse down event
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseDown: function(e) {
        //console.log('SelectRadius.mouseDown');
        if (Event.isLeftClick(e)) {
            var p = this.getMap().getEventPosition(e);

            if (!this.isDigitizing) {
                this.circle.setCenter(p.x, p.y);
                this.circle.setRadius(this.defaultRadius);
                this.clearContext();
                this.circle.draw(this.context);     
                this.isDigitizing = true;
            }
        }
        if (this.radiusTip && this.radiusTipType == 'dynamic') {
            this.radiusTip.style.display = 'block';
            var size = Element.getDimensions(this.radiusTip);
            this.radiusTip.style.top = (p.y - size.height*2) + 'px';
            this.radiusTip.style.left = p.x + 'px';
            var r = this.getMap().pixToGeoMeasure(this.circle.radius);
            this.radiusTip.innerHTML = r;
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
        //console.log('SelectRadius.mouseMove');
        if (!this.isDigitizing) return;
    
        var p = this.getMap().getEventPosition(e);
        var center = this.circle.center;
        
        var radius = Math.sqrt(Math.pow(center.x-p.x,2) + Math.pow(center.y-p.y,2));
        if (radius > this.nTolerance) {
            this.circle.setRadius(radius);
        }
        this.clearContext();
        this.circle.draw(this.context);
        
        if (this.radiusTip && this.radiusTipType == 'dynamic') {
            this.radiusTip.style.display = 'block';
            var size = Element.getDimensions(this.radiusTip);
            this.radiusTip.style.top = (p.y - size.height*2) + 'px';
            this.radiusTip.style.left = p.x + 'px';
            var r = this.getMap().pixToGeoMeasure(this.circle.radius);
            this.radiusTip.innerHTML = r;
        }
        
    },
    
    mouseUp: function(e) {
        if (this.isDigitizing) {
            this.event = e;
            //this.circle.draw(this.context);
            this.clearContext();
            this.isDigitizing = false;
            var center = this.getMap().pixToGeo(this.circle.center.x, this.circle.center.y);
            var radius = this.getMap().pixToGeoMeasure(this.circle.radius);
            this.execute(center, radius);
        }
        
        if (this.radiusTip && this.radiusTipType == 'dynamic') {
            this.radiusTip.style.display = 'none';
            this.radiusTip.innerHTML = '';
        }
        
    },

    /**
     *  set the extants of the map based on the pixel coordinates
     * passed
     * 
     * @param center
     * @param radius
     **/
    execute : function(center, radius) {
        var wkt = 'POLYGON((';
        var nPoints = 16;
        var angle = 2 * Math.PI / nPoints;
        var sep = '';
        var first;
        for (var i=0; i<nPoints; i++) {
            var x = center.x + radius * Math.cos(i*angle);
            var y = center.y + radius * Math.sin(i*angle);
            if (i==0) {
                first = x + ' ' + y;
            }
            wkt = wkt + sep + x + ' ' + y;
            sep = ',';
        }
        wkt = wkt + sep + first + '))';
        
        var options = {};
        options.geometry = wkt;
        options.selectionType = "inside";

        if (this.bActiveOnly) {
            var layer = this.getMap().getActiveLayer();
            if (layer) {
                options.layers = layer.layerName;
            } else {
                return;
            }
        }
        
        if (this.event.shiftKey) {
            options.extendSelection = true;
        }
        
        this.getMap().query(options);
    }
};
