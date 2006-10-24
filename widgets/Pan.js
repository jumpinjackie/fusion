/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Pan
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
 * extended description
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxRectTool.js');

var Pan = Class.create();
Pan.prototype = 
{
    initialize : function(oCommand)
    {
        //console.log('Pan.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Pan', true]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxRectTool.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.cursorNormal = ["url('images/grab.cur'),move", 'grab', '-moz-grab', 'move'];
        this.cursorDrag = ["url('images/grabbing.cur'),move", 'grabbing', '-moz-grabbing', 'move'];
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    activateTool : function()
    {
        //console.log('Pan.activateTool');
        this.getMap().activateWidget(this);
    },
    
    activate : function()
    {
        this.activateRectTool();
        this.getMap().setCursor(this.cursorNormal);
        /*button*/
        this._oButton.activateTool()
    },
    
    deactivate: function() {
        //console.log('Pan.deactivate');
        this.deactivateRectTool();
        this.getMap().setCursor('auto');
        /*icon button*/
        this._oButton.deactivateTool();
    },

    execute : function(nX, nY)
    {
        var sGeoPoint = this.getMap().pixToGeo(nX,nY);
        this.getMap().zoom(sGeoPoint.x, sGeoPoint.y, 1);
    },

    /**
     * (private) gPan.MouseDown(e)
     *
     * handle mouse down events on the mapObj
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseDown: function(e) {
        if (Event.isLeftClick(e)) {
            this.getMap().setCursor(this.cursorDrag);
            var p = this.getMap().getEventPosition(e);    
            this.startPos = p;
        }
        Event.stop(e);
    },

    /**
     * (private) gPan.MouseUp(e)
     *
     * handle mouseup events on the mapObj
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseUp: function(e) {
        if (this.startPos) {
            this.getMap().setCursor(this.cursorNormal);

            var p = this.getMap().getEventPosition(e);

            var dx = p.x - this.startPos.x;
            var dy = p.y - this.startPos.y;

            var size = this.getMap().getPixelSize();

            var t = -dy;
            var l = -dx;
            var r = l + size.width;
            var b = t + size.height; 

            var min = this.getMap().pixToGeo(l,b);
            var max = this.getMap().pixToGeo(r,t);
            this.startPos = null;
            this.getMap().setExtents([min.x,min.y,max.x,max.y]);
            Event.stop(e);
        }
    },

    /**
     * (private) gPan.MouseMove(e)
     *
     * handle mousemove events on the mapObj by moving the
     * map image inside its parent object
     *
     * @param e Event the event that happened on the mapObj
     */
    mouseMove: function(e) {
        if (!this.startPos) {
            return false;
        }
        var p = this.getMap().getEventPosition(e);

        var dx = p.x - this.startPos.x;
        var dy = p.y - this.startPos.y;

        this.getMap()._oImg.style.top = dy + 'px';
        this.getMap()._oImg.style.left = dx + 'px';

        Event.stop(e);
    }
};