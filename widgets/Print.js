/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose ZoomToSelection widget
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
 * Print the current map.
 *
 * To put a Print control in your application, you first need to add
 * a widget to your WebLayout as follows:
 *
 * <Command xsi:type="FusionCommandType">
 *   <Name>MyPrint</Name>
 *   <Label>Print/Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>Print</Action>
 *   <ImageURL>images/icon_print.png</ImageURL>
 *   <DisabledImageURL>images/icon_print.png</DisabledImageURL>
 *   <Width>24</Width>
 *   <Height>24</Height>
 *   <ShowPrintUI>false</ShowPrintUI>
 *   <PageTitle>Nanaimo Cemetery</PageTitle>
 *   <ShowLegend>false</ShowLegend>
 *   <ShowNorthArrow>false</ShowNorthArrow>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyPrint"></div>
 *
 * A button that activates this widget will appear inside the
 * element you provide.
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');

var Print = Class.create();
Print.prototype = {
    initialize : function(oCommand) {
        Object.inheritFrom(this, GxWidget.prototype, ['Print', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        
        var json = oCommand.jsonNode;
        
        var showPrintUI = json.ShowPrintUI ? json.ShowPrintUI[0] : 'false';
        this.showPrintUI = (showPrintUI.toLowerCase() == 'true' || showPrintUI == '1');
        
        var showTitle = json.ShowTitle ? json.ShowTitle[0] : 'false';
        this.showTitle = (showTitle.toLowerCase() == 'true' || showTitle == '1');

        this.pageTitle = json.PageTitle ? json.PageTitle[0] : '';
        
        var showLegend = json.ShowLegend ? json.ShowLegend[0] : 'false';
        this.showLegend = (showLegend.toLowerCase() == 'true' || showLegend == '1');
        
        var showNorthArrow =json.ShowNorthArrow ? json.ShowNorthArrow[0] : 'false';
        this.showNorthArrow = (showNorthArrow.toLowerCase() == 'true' || showNorthArrow == '1');
        
        this.dialogContentURL = Fusion.getRedirectScript() + '?s=' + Fusion.getFusionURL() + oCommand.sLocation + '/html/Print.html';
    },
    /**
     * load an interface that builds a printable version of
     * the current map view
     */
    execute : function() {
        if (this.showPrintUI) {
            this.openPrintUI();
        } else {
            this.openPrintable();
        }
    },
    
    openPrintUI: function() {
        if (!this.dialog) {

            var size = Position.getPageDimensions();
            var o = {
                title: 'Printable Page ',
                id: 'printablePage',
                contentURL : this.dialogContentURL,
                onContentLoaded: this.contentLoaded.bind(this),
                width: 320,
                height: 200,
                top: (size.height-200)/2,
                left: (size.width-320)/2,
                buttons: ['generate', 'cancel'],
                handler: this.handler.bind(this)
            };
            this.dialog = new JxDialog(o);
            
        }
        this.dialog.open();
    },
    
    setParameter: function(param, value) {
        switch (param) {
            case 'Print_ShowTitle':
            this.showTitle = value;
            break;
            case 'Print_Title':
            this.pageTitle = value;
            break;
            case 'Print_ShowLegend':
            this.showLegend = value;
            break;
            case 'Print_ShowNorthArrow':
            this.showNorthArrow = value;
            break;
        }
    },
    
    contentLoaded: function() {
        this.dialog.registerIds(['dialog.print.showtitle', 
                                 'dialog.print.title',
                                 'dialog.print.showlegend',
                                 'dialog.print.shownortharrow'], this.dialog.content);
        this.dialog.getObj('dialog.print.showtitle').checked = this.showTitle;
        this.dialog.getObj('dialog.print.title').value = this.pageTitle;
        this.dialog.getObj('dialog.print.title').disabled = !this.showTitle;
        this.dialog.getObj('dialog.print.showlegend').checked = this.showLegend;
        this.dialog.getObj('dialog.print.shownortharrow').checked = this.showNorthArrow;
        
        Event.observe(this.dialog.getObj('dialog.print.showtitle'), 'click', this.controlTitle.bind(this));
    },
    
    controlTitle: function() {
        this.dialog.getObj('dialog.print.title').disabled = !this.dialog.getObj('dialog.print.showtitle').checked;
        
    },
    
    handler: function(button) {
        if (button == 'generate') {
            this.showTitle = this.dialog.getObj('dialog.print.showtitle').checked;
            this.pageTitle = this.dialog.getObj('dialog.print.title').value;
            this.showLegend = this.dialog.getObj('dialog.print.showlegend').checked;
            this.showNorthArrow = this.dialog.getObj('dialog.print.shownortharrow').checked;
            this.openPrintable();
            
        }
        this.dialog.close();
    },
    
    openPrintable: function() {
        var url = Fusion.getWebTierURL() + 'mapviewerphp/printablepage.php?';
        var extents = this.getMap().getCurrentExtents();
        var centerX = (extents[0] + extents[2])/ 2;
        var centerY = (extents[1] + extents[3])/ 2;
        var dpi = this.getMap()._nDpi;
        var scale = this.getMap()._fScale
        url = url + 'MAPNAME=' + this.getMap().getMapName();
        url = url + '&SESSION=' + this.getMap().getSessionId();
        url = url + '&CENTERX='+centerX;
        url = url + '&CENTERY='+centerY;
        url = url + '&DPI='+dpi;
        url = url + '&SCALE='+scale;
        url = url + '&ISTITLE=' + (this.showTitle != '' ? '1' : '0');
        url = url + '&ISLEGEND=' + (this.showLegend ? '1' : '0');
        url = url + '&ISARROW=' + (this.showNorthArrow ? '1' : '0');
        if (this.pageTitle != '') {
            url = url + '&TITLE='+this.pageTitle;
        }
        
        window.open(url, 'printablepage', '');
        
    }
};
