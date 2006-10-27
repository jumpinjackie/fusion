/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose ZoomOut
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
 * extended description
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');
Fusion.require('widgets/GxClickTool.js');
 
var ZoomOut = Class.create();
ZoomOut.prototype = 
{
    nFactor: -2,
    initialize : function(oCommand)
    {
        //console.log('ZoomOut.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ZoomOut', true]);
        Object.inheritFrom(this, GxClickTool.prototype, []);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        this.asCursor = ["url('images/zoomout.cur'),auto",'-moz-zoom-out', 'auto'];
    },

    activateTool : function()
    {
        //console.log('ZoomOut.activateTool');
        this.getMap().activateWidget(this);
    },

    activate : function()
    {
        //console.log('ZoomOut.activate');
        this.activateClickTool();
        this.getMap().setCursor(this.asCursor);
        /*button*/
        this._oButton.activateTool()
    },

    deactivate : function()
    {
        //console.log('ZoomOut.deactivate');
        
         this.deactivateClickTool();
         this.getMap().setCursor('auto');

          /*icon button*/
         this._oButton.deactivateTool();
    },

    execute : function(nX, nY)
    {
        //console.log('ZoomOut.execute');
        
        var sGeoPoint = this.getMap().pixToGeo(nX,nY);
        this.getMap().zoom(sGeoPoint.x, sGeoPoint.y, this.nFactor);
    }
};
