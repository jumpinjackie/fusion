/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Fit to window (full extents)Clear current selection
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
 * * 
 * **********************************************************************/

require('widgets/GxButtonBase.js');

var ClearSelection = Class.create();
ClearSelection.prototype = 
{
    nCurrentState: 0,

    initialize : function(oCommand)
    {
        console.log('ClearSelection.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ClearSelection', false]);
        this.setMap(oCommand.getMap());
        
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);

        this.getMap().registerForEvent(MGMAP_SELECTION_ON, this, this.selectionOn.bind(this));
        this.getMap().registerForEvent(MGMAP_SELECTION_OFF, this, this.selectionOff.bind(this));

    },

    selectionOn : function()
    {
        this.nCurrentState = 1;
        this._oButton.activateTool();
     },

    selectionOff : function()
    {
        this.nCurrentState = 0;
        this._oButton.deactivateTool();
     },

    
    /**
     * clears slection on map.
     */
    activateTool : function()
    {
        this.getMap().clearSelection();
        
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    
    clickCB : function()
    {
        if (this.nCurrentState == 1)
        {
            this._oButton.deactivateTool();
            this.activateTool();
            this.nCurrentState = 0;
        }
    }
};
