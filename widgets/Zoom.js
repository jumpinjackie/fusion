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
    initialize : function(oCommand)
    {
        //console.log('Zoom.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Zoom', true]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxRectTool.prototype, []);
        this.setMap(oCommand.getMap());
        this.asCursor = ['-moz-zoom-in', 'auto'];
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
        this.getMap().setCursor(this.asCursor);
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
        if ((nRight-nLeft) < this.nTolerance || 
            (nBottom-nTop) < this.nTolerance) 
        {
		var nSize = this.getMap().getPixelSize();
		nLeft = nLeft - nSize.width/(this.nFactor*2);
		nRight = nLeft + nSize.width/(this.nFactor);
		nTop = nTop - nSize.height/(this.nFactor*2);
		nBottom = nTop + nSize.height/(this.nFactor);
        }
        var sMin = this.getMap().pixToGeo(nLeft,nBottom);
	var sMax = this.getMap().pixToGeo(nRight,nTop);

        this.getMap().setExtents([sMin.x,sMin.y,sMax.x,sMax.y]);
    }
};
