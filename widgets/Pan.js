/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Pan
 * @author pspencer@dmsolutions.ca
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 ********************************************************************
 *
 * extended description
 * **********************************************************************/




var Pan = Class.create();
Pan.prototype = {
    initialize : function(oCommand) {
        //console.log('Pan.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['Pan', true, oCommand]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, []);
        Object.inheritFrom(this, Fusion.Tool.Rectangle.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.cursorNormal = ["url('images/grab.cur'),move", 'grab', '-moz-grab', 'move'];
        this.cursorDrag = ["url('images/grabbing.cur'),move", 'grabbing', '-moz-grabbing', 'move'];
    },

    /**
     * called when the button is clicked by the Fusion.Tool.ButtonBase widget
     */
    activateTool : function() {
        /*console.log('Pan.activateTool');*/
        this.getMap().activateWidget(this);
    },
    
    activate : function() {
        /*console.log('Pan.activate');*/
        this.activateRectTool();
        /* override the default handling of the rect tool */
        this.oMap.stopObserveEvent('mousemove', this.mouseMoveCB);
        this.oMap.stopObserveEvent('mouseup', this.mouseUpCB);
        
        this.getMap().setCursor(this.cursorNormal);
        /*button*/
        this._oButton.activateTool();
    },
    
    deactivate: function() {
        /*console.log('Pan.deactivate');*/
        this.deactivateRectTool();
        this.getMap().setCursor('auto');
        /*icon button*/
        this._oButton.deactivateTool();
    },

    execute : function(nX, nY) {
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
            var p = {x:Event.pointerX(e), y:Event.pointerY(e)};    
            this.startPos = p;
            Event.observe(document, 'mouseup', this.mouseUpCB);
            Event.observe(document, 'mousemove', this.mouseMoveCB);
            Event.observe(document, 'mouseout', this.mouseOutCB);
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

            var p = {x:Event.pointerX(e), y:Event.pointerY(e)};    
            
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
        Event.stopObserving(document, 'mouseup', this.mouseUpCB);
        Event.stopObserving(document, 'mousemove', this.mouseMoveCB);
        Event.stopObserving(document, 'mouseout', this.mouseOutCB);
        
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
        var p = {x:Event.pointerX(e), y:Event.pointerY(e)};    

        var dx = p.x - this.startPos.x;
        var dy = p.y - this.startPos.y;

        this.getMap()._oImg.style.top = dy + 'px';
        this.getMap()._oImg.style.left = dx + 'px';

        Event.stop(e);
    }
};