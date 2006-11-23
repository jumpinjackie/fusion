/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Save map widget
 * @author zjames@dmsolutions.ca
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
 * save the current map image on the client's computer
 * 
 * **********************************************************************/
Fusion.require('widgets/GxButtonBase.js');

var SaveMap = Class.create();
SaveMap.prototype = {
    iframe : null,
    initialize : function(oCommand)
    {
        this.oCommand = oCommand;
        Object.inheritFrom(this, GxWidget.prototype, ['SaveMap', false]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        this.enable = SaveMap.prototype.enable;
    },
    
    enable: function() {
        GxButtonBase.prototype.enable.apply(this, []);
    },
    
    
    /**
     * called when the button is clicked by the GxButtonBase widget
     * prompts user to save the map.
     */
    activateTool : function()
    {
        if (!this.iframe) {
            this.iframe = document.createElement('iframe');
            this.iframe.style.display = 'none';
            document.body.appendChild(this.iframe);
        }
        var s = Fusion.getWebTierURL() + 'fusion/server/' + Fusion.getScriptLanguage() + "/MGSaveMap." + Fusion.getScriptLanguage() + '?session='+Fusion.getSessionID() + '&mapname=' + this.getMap().getMapName();
        //console.log(s);
        this.iframe.src = s;
    }
};
