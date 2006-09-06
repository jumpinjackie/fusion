/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
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
 * perform a selection using the map guide web layout conifiguration file
 * 
 * **********************************************************************/

require('widgets/GxButtonBase.js');
require('widgets/GxRectTool.js');

var Select = Class.create();
Select.prototype = 
{       
    nTolerance : 3, //default pixel tolernace for a point click
    initialize : function(oCommand)
    {
        //console.log('Select.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Select', true]);
        this.setMap(oCommand.getMap());
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxRectTool.prototype, [this.getMap()]);
        this.asCursor = ['auto'];

        if (parseInt(oCommand.oxmlNode.getNodeText('Tolerance')) > 0)
        {
            nTolerance = parseInt(oCommand.oxmlNode.getNodeText('Tolerance'));
        }
        
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
        this.activateRectTool();
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
         this.deactivateRectTool();
         this.getMap().setCursor('auto');
         /*icon button*/
         this._oButton.deactivateTool();
    },

    /**
     *  set the extants of the map based on the pixel coordinates
     * passed
     * 
     * @param nLeft integer pixel coordinates of the left (minx)
     * @param nBottom integer pixel coordinates of the bottom (miny)
     * @param nRight integer pixel coordinates of the right (maxx)
     * @param nTop integer pixel coordinates of the top (maxy)
     **/
    execute : function(nLeft, nBottom, nRight, nTop)
    {
        var sMin = this.getMap().pixToGeo(nLeft,nBottom);
        var sMax = this.getMap().pixToGeo(nRight,nTop);
        var nXDelta = Math.abs(nLeft-nRight);
        var nYDelta = Math.abs(nBottom- nTop);
        
        if (nXDelta <=this.nTolerance && nYDelta <=this.nTolerance)
        {
            var dfGeoTolerance = this.getMap().pixToGeoMeasure(this.nTolerance);
            sMin.x = sMin.x-dfGeoTolerance;
            sMin.y = sMin.y-dfGeoTolerance;
            sMax.x = sMax.x+dfGeoTolerance;
            sMax.y = sMax.y+dfGeoTolerance;
            
            this.getMap().queryRect(sMin.x,sMin.y,sMax.x,sMax.y);
        }
        else
        {
          this.getMap().queryRect(sMin.x,sMin.y,sMax.x,sMax.y);
        }
    }
};
