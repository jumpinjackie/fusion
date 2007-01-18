/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Zoom widget
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
 * Zoom widget using the map guide web layout configuration file
 * 
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxRectTool.js');

var Zoom = Class.create();
Zoom.prototype = 
{
    nTolerance : 5,
    nFactor : 2,
    zoomIn: true,
    initialize : function(oCommand)
    {
        //console.log('Zoom.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Zoom', true, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxRectTool.prototype, []);
        this.setMap(oCommand.getMap());
        this.asCursor = ["url('images/zoomin.cur'),auto",'-moz-zoom-in', 'auto'];
        var json = oCommand.jsonNode;
        this.zoomIn = (json.Direction && json.Direction[0] == 'out') ? false : true;
        this.zoomInCursor = ["url('images/zoomin.cur'),auto",'-moz-zoom-in', 'auto'];
        this.zoomOutCursor = ["url('images/zoomout.cur'),auto",'-moz-zoom-out', 'auto'];
        
        
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    activateTool : function()
    {
        //console.log('Zoom.activateTool');
        this.getMap().activateWidget(this);
    },

    /**
     * activate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     */
    activate : function()
    {
        //console.log('Zoom.activate');
        this.activateRectTool();
        /*cursor*/
        if (this.zoomIn) {
            this.getMap().setCursor(this.zoomInCursor);
        } else {
            this.getMap().setCursor(this.zoomOutCursor);
        }
        /*icon button*/
        this._oButton.activateTool();
    },

    /**
     * deactivate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     **/
    deactivate : function()
    {
        //console.log('Zoom.deactivate');
        this.deactivateRectTool();
        this.getMap().setCursor('auto');
        /*icon button*/
        this._oButton.deactivateTool();
    },

    /**
     * set the extents of the map based on the pixel coordinates
     * passed
     * 
     * @param nLeft integer pixel coordinates of the left (minx)
     * @param nBottom integer pixel coordinates of the bottom (miny)
     * @param nRight integer pixel coordinates of the right (maxx)
     * @param nTop integer pixel coordinates of the top (maxy)
     */
    execute : function(nLeft, nBottom, nRight, nTop)
    {
        /* if the last event had a shift modifier, swap the sense of this
           tool - zoom in becomes out and zoom out becomes in */
        var map = this.getMap();
        var zoomIn = this.zoomIn;
        if (this.event && this.event.shiftKey) {
            zoomIn = !zoomIn;
        }
        if (arguments.length == 2) {
            nRight = nLeft;
            nTop = nBottom;
        }
        var gMin = map.pixToGeo(nLeft,nBottom);
        var gMax = map.pixToGeo(nRight,nTop);
        var gCenter = {x:(gMin.x+gMax.x)/2,y:(gMin.y+gMax.y)/2};
        var ratio = this.nFactor;
        var pWidth = Math.abs(nRight-nLeft);
        var pHeight = Math.abs(nBottom-nTop);
        //console.log('pWidth: ' + pWidth + ', pHeight: ' + pHeight);
        if (pWidth > this.nTolerance ||
            pHeight > this.nTolerance) {
            ratio = Math.min(map._nWidth/pWidth,map._nHeight/pHeight);
        }
        if (!zoomIn) {
            ratio = ratio * -1;
        }
        map.zoom(gCenter.x,gCenter.y,ratio);
    },

    setParameter : function(param, value)
    {
        if (param == "Factor" && value > 0)
        {
            this.nFactor = value;
        }
    }
};
