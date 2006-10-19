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
 * Zoom to the current selection, if any
 *
 * To put a ZoomToSelection control in your application, you first need to add
 * a widget to your WebLayout as follows:
 *
 * <Command xsi:type="FusionCommandType">
 *   <Name>MyZoomToSelection</Name>
 *   <Label>Zoom to Selection</Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>ZoomToSelection</Action>
 *   <ImageURL>images/icon_zoom_selected.png</ImageURL>
 *   <DisabledImageURL>images/icon_zoom_selected_x.png</DisabledImageURL>
 *   <Width>24</Width>
 *   <Height>24</Height>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyZoomToSelection"></div>
 *
 * A button that activates this widget will appear inside the
 * element you provide.
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');

var ZoomToSelection = Class.create();
ZoomToSelection.prototype = {
    initialize : function(oCommand) {
        //console.log('ZoomToSelection.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ZoomToSelection', false]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());

        this.enable = ZoomToSelection.prototype.enable;
        
        this.getMap().registerForEvent(MGMAP_SELECTION_ON, this.enable.bind(this));
        this.getMap().registerForEvent(MGMAP_SELECTION_OFF, this.disable.bind(this));
    },

    /**
     * get the selection from the map (which may not be loaded yet).
     * zoomToSelection is called when the selection is ready.
     */
    activateTool : function() {
        this.getMap().getSelection(this.zoomToSelection.bind(this));
    },

    /**
     * set the extents of the map based on the pixel coordinates
     * passed
     * 
     * @param selection the active selection, or null if there is none
     */
    zoomToSelection : function(selection) {
        var ll = selection.getLowerLeftCoord();
        var ur = selection.getUpperRightCoord();
        //buffer extents (zoom out by factor of two)
        var dX = ur.x - ll.x;
        var dY = ur.y - ll.y;
        ll.x = ll.x - dX;
        ur.x = ur.x + dX;
        ll.y = ll.y - dY;
        ur.y = ur.y + dY;
        this.getMap().setExtents([ll.x,ll.y,ur.x,ur.y]);
    },
    
    enable: function() {
        if (this.oMap && this.oMap.hasSelection()) {
            GxButtonBase.prototype.enable.apply(this, []);
        } else {
            this.disable();
        }
    }

};
