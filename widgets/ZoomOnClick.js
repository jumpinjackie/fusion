/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Zoom the map by a fixed amount when a button is clicked
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
 * Zoom the map by a fixed amount when a button is clicked
 * 
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');

var ZoomOnClick = Class.create();
ZoomOnClick.prototype = 
{
    nFactor: null,
    initialize : function(oCommand)
    {
        //console.log('FitToWindow.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ZoomOnClick', false]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        var factor = oCommand.oxmlNode.getNodeText('Factor');
        if (factor == '') {
            factor = 2;
        }
        this.nFactor = parseFloat(factor);
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    execute : function()
    {
        //console.log('ZoomOnClick.activateTool');
        var center = this.getMap().getCurrentCenter();
        this.getMap().zoom(center.x, center.y, this.nFactor);
    }
};