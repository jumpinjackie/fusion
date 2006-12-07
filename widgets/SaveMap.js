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
        Object.inheritFrom(this, GxWidget.prototype, ['SaveMap', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        this.format = oCommand.oxmlNode.getNodeText('Format');
        if (this.format == '') {
            this.format = 'png';
        }
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
            this.iframe.id = 'w';
            this.iframe.style.visibility = 'hidden';
            document.body.appendChild(this.iframe);
        }
        if(navigator.appVersion.match(/\bMSIE\b/)) {
            //hack to workaround problem with ie download
            //var img = document.getElementById('gMapImg').src;
            //var img = this.getMap()._oImg.src;
            
            var url = Fusion.getWebAgentURL() + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + Fusion.getSessionID() + "&MAPNAME=" + this.getMap().getMapName() + "&SEQ=" + Math.random();
            /*window.w = open(url);*/
            this.iframe.contentWindow.onload = function() {
                alert('iframe onload');
                top.frames.w.document.execCommand("SaveAs", 1, this.getMap().getMapName()+"."+this.format);
            }
            this.iframe.src = url;
            /* window.w = window.frames.w; */
            /*setTimeout('w.document.execCommand("SaveAs", 1, "'+this.getMap().getMapName()+'".'+this.format+')', 1500);*/
            /*setTimeout('w.execCommand("SaveAs", 1, "'+this.getMap().getMapName()+'".'+this.format+')', 1500);*/
        } else {
            var s = Fusion.getWebTierURL() + 'fusion/server/' + Fusion.getScriptLanguage() + "/MGSaveMap." + Fusion.getScriptLanguage() + '?session='+Fusion.getSessionID() + '&mapname=' + this.getMap().getMapName() + '&format=' + this.format;
            //console.log(s);
            this.iframe.src = s;
        }
    }
};
