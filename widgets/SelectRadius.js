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
require('widgets/GxCanvasTool.js');

var SelectRadius = Class.create();
SelectRadius.prototype = 
{       
    nTolerance : 3, //default pixel tolernace for a point click
    initialize : function(oCommand)
    {
        //console.log('Select.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['SelectRadius', true]);
        this.setMap(oCommand.getMap());
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxCanvasTool.prototype, [this.getMap()]);
        this.asCursor = ['auto'];

        if (parseInt(oCommand.oxmlNode.getNodeText('Tolerance')) > 0)
        {
            nTolerance = parseInt(oCommand.oxmlNode.getNodeText('Tolerance'));
        }
        this.circle = new FeatureCircle();
        this.circle.setCenter(0);
        
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
        var p = this.getMap().getEventPosition(e);

        if (!this.isDigitizing) {
            this.circle.setCenter(p.x, p.y);
            this.circle.setRadius(1);
            this.clearContext();
            this.circle.draw(this.context);     
            this.isDigitizing = true;
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
        this.circle.setRadius(radius);
        this.clearContext();
        this.circle.draw(this.context);
    },
    
    mouseUp: function(e) {
        this.clearContext();
        this.isDigitizing = false;
        var center = this.getMap().pixToGeo(this.circle.center.x, this.circle.center.y);
        var radius = this.getMap().pixToGeoMeasure(this.circle.radius);
        this.execute(center, radius);
    },

    /**
     *  set the extants of the map based on the pixel coordinates
     * passed
     * 
     * @param center
     * @param radius
     **/
    execute : function(center, radius)
    {
        alert(center.x + ' ' + center.y + ' ' + radius);
    }
};
