/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Select by polygon widget
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license MIT
 * ********************************************************************
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ********************************************************************
 *
 * perform a selection using a polygon
 * 
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxCanvasTool.js');

var SelectPolygon = Class.create();
SelectPolygon.prototype = 
{       
    nTolerance : 3, //default pixel tolernace for a point click
    initialize : function(oCommand)
    {
        //console.log('Select.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['SelectPolygon', true, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxCanvasTool.prototype, [this.getMap()]);
        this.setMap(oCommand.getMap());
        this.asCursor = ['auto'];

        if (parseInt(oCommand.oxmlNode.getNodeText('Tolerance')) > 0)
        {
            nTolerance = parseInt(oCommand.oxmlNode.getNodeText('Tolerance'));
        }
        this.polygon = new FeaturePolygon();
    },
    
    /**
     * called when the button is clicked by the MGButtonBase widget
     */
    activateTool : function()
    {
        this.getMap().activateWidget(this);
        //this.activate();
    },

    /**
     * activate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     */
    activate : function()
    {
        this.activateCanvas();
        this.getMap().setCursor(this.asCursor);
        /*icon button*/
        this._oButton.activateTool();
        this.polygon = new FeaturePolygon(this.getMap());
    },

    /**
     * deactivate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     **/
    deactivate : function()
    {
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
                this.polygon = new FeaturePolygon(this.getMap());
                var point = this.getMap().pixToGeo(p.x, p.y);
                var from = new Node(point.x,point.y, this.getMap());
                var to = new Node(point.x,point.y, this.getMap());
                var seg = new Segment(from,to);
                seg.setEditing(true);
                this.polygon.addSegment(seg);
                this.clearContext();
                this.polygon.draw(this.context);     

                this.isDigitizing = true;
            } else {
                var seg = this.polygon.lastSegment();
                seg.setEditing(false);
                seg = this.polygon.extendLine();
                seg.setEditing(true);
                this.clearContext();
                this.polygon.draw(this.context);
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
        //console.log('SelectRadius.mouseMove');
        if (!this.isDigitizing) return;
    
        var p = this.getMap().getEventPosition(e);
        var seg = this.polygon.lastSegment();
        seg.to.setPx(p.x,p.y);
        seg.to.updateGeo();
        this.clearContext();
        this.polygon.draw(this.context);
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
        this.event = e;
        var p = this.getMap().getEventPosition(e);
        var point = this.getMap().pixToGeo(p.x, p.y);
        var seg = this.polygon.lastSegment();
        seg.setEditing(false);
        seg.to.set(point.x,point.y);
        this.clearContext();
        this.isDigitizing = false;
        this.execute();
    },

    /**
     *  
     **/
    execute : function() {
        var wkt = 'POLYGON((';
        var nodes = this.polygon.getNodes();
        var sep = '';
        for (var i=0; i<nodes.length; i++) {
            wkt = wkt + sep + nodes[i].x + ' ' + nodes[i].y;
            sep = ',';
        }
        wkt = wkt + sep + nodes[0].x + ' ' + nodes[0].y + '))';
        
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
