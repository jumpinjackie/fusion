/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Scalebar
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
 * uses JavaScript Scale Bar for MapServer 
 * (http://mapserver.commenspace.org/tools/scalebar/
 * **********************************************************************/


Fusion.require('widgets/scalebartool.js');

var Scalebar = Class.create();
Scalebar.prototype = 
{
    oCommad : null,

    initialize : function(oCommand)
    {
        //console.log('Scalebar.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Scalebar', false]);
        this.setMap(oCommand.getMap());
        
        this.oCommand = oCommand;

        this.oScaleBar = new ScaleBarTool(this.getMap().getScale());
        this.oScaleBar.place(oCommand.getName());


        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.extentsChangedCB.bind(this));
    },

    extentsChangedCB : function()
    {
        this.oScaleBar.update(this.getMap().getScale());
    }
};
