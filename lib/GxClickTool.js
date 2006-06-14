/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Utility class to do a click on the map
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
 * Utility class to manage a click on the map (mouse up event).
 *
 * All classes using this shoudl redifine the doAction function
 * **********************************************************************/
var GxClickTool = Class.create();
Object.extend(GxClickTool.prototype, 
{
    _oMap : null,

    /**
     * constructor
     * @param oMap {Object} a map widget
     */
    initialize : function(oMap)
    {
        this._oMap = oMap;
        this.initializeMGClickTool(oMap);
    },

    initializeGxClickTool : function(oMap)
    {
        this.mouseUpCB = this.mouseUp.bindAsEventListener(this);
    },

    execute : function(x,y)
    {
    },

    activateClickTool : function()
    {
        this._oMap.observeEvent('mouseup', this.mouseUpCB);
    },

    deactivateClickTool : function()
    {
        this._oMap.stopObserveEvent('mouseup', this.mouseUpCB);
    },


    mouseUp : function(e)
    {
        var sPixPoint = this._oMap.getEventPosition(e);
        this.execute(sPixPoint.x, sPixPoint.y);

    }
        
});
