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
    oMenu : null,
    printLayout : null,
    initialize : function(oCommand)
    {
        this.oCommand = oCommand;
        Object.inheritFrom(this, GxWidget.prototype, ['SaveMap', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        this.format = (oCommand.jsonNode.Format && oCommand.jsonNode.Format[0] != '')?
                       oCommand.jsonNode.Format[0] : 'png';
        
        //for DWF, parse printLayouts and build menu
        if (this.format == 'DWF' && oCommand.jsonNode.PrintLayout.length) {
            var opt = {label:this._sLabel};
            this.oMenu = new JxMenu(opt);
            //this._oDomObj = $(oCommand.getName());
            //this._oDomObj.appendChild(this.oMenu.domObj);
            //Element.addClassName(this._oButton._oButton.domObj, 'jxButtonMenu');
            
            var layouts = oCommand.jsonNode.PrintLayout;
            for (var i = 0; i < layouts.length; i++) {
                var opt = {};
                opt.label = layouts[i].Name[0];
                var data = layouts[i].ResourceId[0];
                var action = new JxAction(this.setLayout.bind(this, data));
                var menuItem = new JxMenuItem(action,opt);
                
                this.oMenu.add(menuItem);
            }
        }

        this.enable = SaveMap.prototype.enable;
    },
    
    setLayout: function(rid) {
        this.printLayout = rid;
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
        var szLayout = '';
        if (this.format === 'dwf') {
            szLayout = '&layout=' + this.printLayout;
        }
        if(navigator.appVersion.match(/\bMSIE\b/)) {
            //var url = Fusion.getWebAgentURL() + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + this.getMap().getSessionID() + "&MAPNAME=" + this.getMap().getMapName() + "&SEQ=" + Math.random();
            
            var url = Fusion.getWebTierURL() + 'fusion/' + this.getMap().arch + '/' + Fusion.getScriptLanguage() + "/SaveMapFrame." + Fusion.getScriptLanguage() + '?session='+this.getMap().getSessionID() + '&mapname=' + this.getMap().getMapName() + '&format=' + this.format + szLayout;
            //this.iframe.src = url;
            w = open(url, "Save", 'menubar=no,height=200,width=300');
        } else {
            var s = Fusion.getWebTierURL() + 'fusion/' + this.getMap().arch + '/' + Fusion.getScriptLanguage() + "/SaveMap." + Fusion.getScriptLanguage() + '?session='+this.getMap().getSessionID() + '&mapname=' + this.getMap().getMapName() + '&format=' + this.format + szLayout;
            //console.log(s);
            
            this.iframe.src = s;
        }
    }
};
