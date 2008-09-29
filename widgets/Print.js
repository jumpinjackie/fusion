/**
 * Fusion.Widget.Print
 *
 * $Id$
 *
 * Copyright (c) 2007, DM Solutions Group Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

 /********************************************************************
 * Class: Fusion.Widget.Print
 *
 * Print the current map.
 *
 * **********************************************************************/

Fusion.Widget.Print = OpenLayers.Class(Fusion.Widget, {
    uiClass: Jx.Button,
    initializeWidget: function(widgetTag) {
        var json = widgetTag.extension;
        
        var showPrintUI = json.ShowPrintUI ? json.ShowPrintUI[0] : 'false';
        this.showPrintUI = (showPrintUI.toLowerCase() == 'true' || showPrintUI == '1');
        
        var showTitle = json.ShowTitle ? json.ShowTitle[0] : 'false';
        this.showTitle = (showTitle.toLowerCase() == 'true' || showTitle == '1');

        this.pageTitle = json.PageTitle ? json.PageTitle[0] : '';
        
        this.resultsLayer = json.ResultsLayer ? json.ResultsLayer[0] : null;

        var showLegend = json.ShowLegend ? json.ShowLegend[0] : 'false';
        this.showLegend = (showLegend.toLowerCase() == 'true' || showLegend == '1');
        
        var showNorthArrow =json.ShowNorthArrow ? json.ShowNorthArrow[0] : 'false';
        this.showNorthArrow = (showNorthArrow.toLowerCase() == 'true' || showNorthArrow == '1');
        
        this.imageBaseUrl = json.ImageBaseUrl ? json.ImageBaseUrl[0] : null;
        
        this.dialogContentURL = Fusion.getFusionURL() + widgetTag.location + 'Print/Print.html';
        this.printablePageURL = Fusion.getFusionURL() + widgetTag.location + 'Print/printablepage.php';
        Fusion.addWidgetStyleSheet(widgetTag.location + 'Print/Print.css');
        
        /*
         * TODO: this is bad, why did we do this?
         this.getMap().registerForEvent(Fusion.Event.SELECTION_COMPLETE, OpenLayers.Function.bind(this.getSelection, this));
         */
        
    },
    /**
     * load an interface that builds a printable version of
     * the current map view
     */
    activate: function() {
        if (this.showPrintUI) {
            this.openPrintUI();
        } else {
            this.openPrintable();
        }
    },
    
    openPrintUI: function() {
        if (!this.dialog) {

            var size = Element.getPageDimensions();
            var toolbar = new Jx.Toolbar({position: 'bottom'});
            var o = {
                label: OpenLayers.i18n('printTitle'),
                id: 'printablePage',
                contentURL : this.dialogContentURL,
                onContentLoad: OpenLayers.Function.bind(this.contentLoaded, this),
                imageBaseUrl: this.imageBaseUrl,
                width: 350,
                height: 250,
                resize: true,
                top: (size.height-250)/2,
                left: (size.width-350)/2,
                toolbars: [toolbar]
            };
            var d = new Jx.Dialog(o);
            toolbar.add(
                new Jx.Button({
                    label: 'Generate',
                    onClick: OpenLayers.Function.bind(this.generate, this)
                }),
                new Jx.Button({
                    label: 'Cancel',
                    onClick: function() {
                        d.close();
                    }
                })
            );
            this.dialog = d;
            
        }
        this.dialog.show();
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
    
    contentLoaded: function(dialog) {
        dialog.registerIds(['dialogPrintShowtitle', 
                                 'dialogPrintTitle',
                                 'dialogPrintShowlegend',
                                 'dialogPrintShowNorthArrow'], dialog.content);
        dialog.getObj('dialogPrintShowtitle').checked = this.showTitle;
        dialog.getObj('dialogPrintTitle').value = this.pageTitle;
        dialog.getObj('dialogPrintTitle').disabled = !this.showTitle;
        dialog.getObj('dialogPrintShowlegend').checked = this.showLegend;
        dialog.getObj('dialogPrintShowNorthArrow').checked = this.showNorthArrow;
        
         OpenLayers.Event.observe(dialog.getObj('dialogPrintShowtitle'), 'click', OpenLayers.Function.bind(this.controlTitle, this));
    },
    
    controlTitle: function() {
        this.dialog.getObj('dialogPrintTitle').disabled = !this.dialog.getObj('dialogPrintShowtitle').checked;
        
    },
    
    generate: function() {
        this.showTitle = this.dialog.getObj('dialogPrintShowtitle').checked;
        this.pageTitle = this.dialog.getObj('dialogPrintTitle').value;
        this.showLegend = this.dialog.getObj('dialogPrintShowlegend').checked;
        this.showNorthArrow = this.dialog.getObj('dialogPrintShowNorthArrow').checked;
        this.openPrintable();
    },
    
    openPrintable: function() {
        var mainMap = this.getMap();
        var url = this.printablePageURL+'?';
        var extents = mainMap.getCurrentExtents();
        var centerX = (extents.left + extents.right)/ 2;
        var centerY = (extents.top + extents.bottom)/ 2;
        var dpi = mainMap._nDpi;
        var scale = mainMap.getScale();
        var maps = mainMap.getAllMaps();
        url = url + 'MAPNAME=' + mainMap.getMapName();
        url = url + '&SESSION=' + maps[0].getSessionID();
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
});
