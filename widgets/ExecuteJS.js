/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose execute arbitrary javascript
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
 * execute arbitrary javascript
 * 
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');

var ExecuteJS = Class.create();
ExecuteJS.prototype = 
{
    sScript: null,
    initialize : function(oCommand)
    {
        //console.log('FitToWindow.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ExecuteJS', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.sScript = oCommand.jsonNode.Script ? oCommand.jsonNode.Script[0] : '';
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    execute : function()
    {
        eval(this.sScript);
    }
};