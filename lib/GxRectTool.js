/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Utility class to do a rect on the map
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
 * Utility class to draw a rectangle on the map and return the coordinates
 * through the doAction function.
 * All classes should redifine the doAction function
 * **********************************************************************/
var GxRectTool = Class.create();
GxRectTool.prototype = {
    _oMap : null,
    oRectDiv : null,
    _sStartPos : null,

    /**
     * constructor
     * @param oMap {Object} a map widget
     */
    initialize : function(oMap)
    {
        console.log('GxRectTool.initialize');
        this._oMap = oMap;
        this.oRectDiv = document.createElement('div');
        this.oRectDiv.style.position = 'absolute';
        this.oRectDiv.style.border = '1px solid red';
        this.oRectDiv.style.top = '0px';
        this.oRectDiv.style.left = '0px';
        this.oRectDiv.style.width = '1px';
        this.oRectDiv.style.height = '1px';
        this.oRectDiv.style.visibility = 'hidden';
        this.oRectDiv.style.zIndex = 99;

        this.mouseMoveCB = this.mouseMove.bindAsEventListener(this);
        this.mouseUpCB = this.mouseUp.bindAsEventListener(this);
        this.mouseDownCB = this.mouseDown.bindAsEventListener(this);
    },

    execute : function(l,b,r,t)
    {
    },

    activateRectTool : function()
    {
        console.log('GxRectTool.activateRectTool');
        var oDomElem =  this._oMap._oEventDiv; //getDomObj();
        oDomElem.appendChild(this.oRectDiv);
        this._oMap.observeEvent('mousemove', this.mouseMoveCB);
        this._oMap.observeEvent('mouseup', this.mouseUpCB);
        this._oMap.observeEvent('mousedown', this.mouseDownCB);
    },

    deactivateRectTool : function()
    {
        console.log('GxRectTool.deactivateRectTool');
        var oDomElem =  this._oMap._oEventDiv;//.getDomObj();
        oDomElem.removeChild(this.oRectDiv);
        this._oMap.stopObserveEvent('mousemove', this.mouseMoveCB);
        this._oMap.stopObserveEvent('mouseup', this.mouseUpCB);
        this._oMap.stopObserveEvent('mousedown', this.mouseDownCB);
    },

    mouseDown : function (e)
    {
        var p = this._oMap.getEventPosition(e);
        this._sStartPos = p;

        this.oRectDiv.style.left = p.x + 'px';
        this.oRectDiv.style.top = p.y + 'px';
        this.oRectDiv.style.width = '1px';
        this.oRectDiv.style.height = '1px';
        this.oRectDiv.style.visibility = 'visible';
        Event.stop(e);
    },

    mouseUp : function(e)
    {
        var t = parseInt(this.oRectDiv.style.top);
        var l = parseInt(this.oRectDiv.style.left);
        var r = l + parseInt(this.oRectDiv.style.width);
        var b = t + parseInt(this.oRectDiv.style.height);

        this.execute(l,b,r,t);

        this.oRectDiv.style.left = '0px';
        this.oRectDiv.style.top = '0px';
        this.oRectDiv.style.width = '1px';
        this.oRectDiv.style.height = '1px';
        this.oRectDiv.style.visibility = 'hidden';
    
        this._sStartPos = null;
        Event.stop(e);
    },

    mouseMove : function(e)
    {
        console.log('mouse move');
        if (this._sStartPos != null)
        {
            var p = this._oMap.getEventPosition(e);
            var l = this._sStartPos.x;
            var t = this._sStartPos.y;
            var r = p.x;
            var b = p.y;

            this.oRectDiv.style.left = Math.min(l,r) + 'px';
            this.oRectDiv.style.top = Math.min(t,b) + 'px';
            this.oRectDiv.style.width = Math.abs(r-l) + 'px';
            this.oRectDiv.style.height = Math.abs(t-b) + 'px';
        }
        Event.stop(e);
    }
        
};
