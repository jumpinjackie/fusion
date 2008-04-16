/**
 * Fusion.Widget.SelectionPanel
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
 * Class: Fusion.Widget.SelectionPanel
 *
 * A widget to display information about the currently selected set of features.
 *
 * **********************************************************************/


Fusion.Widget.SelectionPanel = OpenLayers.Class(Fusion.Widget,
{
    initialize : function(widgetTag) {
        //console.log('SelectionPanel.initialize');

        Fusion.Widget.prototype.initialize.apply(this, [widgetTag, false]);
        
        this.defPrevTaskIcon = 'images/icon_back.gif';
        this.defNextTaskIcon = 'images/icon_forward.gif';

        var json = widgetTag.extension;
        
        this.getMap().registerForEvent(Fusion.Event.MAP_SELECTION_ON, 
                        OpenLayers.Function.bind(this.updateSelection, this));
        this.getMap().registerForEvent(Fusion.Event.MAP_SELECTION_OFF, 
                        OpenLayers.Function.bind(this.clearSelection, this));
        
        var d = document.createElement('div');
        
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'selectionPanelToolbar';
        
        this.layerList = document.createElement('select');
        this.layerList.className = 'layerSelector';
        this.toolbar.appendChild(this.layerList);
        Event.observe(this.layerList, 'change', 
                  OpenLayers.Function.bind(this.renderSelectionFeatures, this));
        
        this.featureList = document.createElement('select');
        this.featureList.className = 'featureSelector';
        this.toolbar.appendChild(this.featureList);
        Event.observe(this.featureList, 'change', 
                  OpenLayers.Function.bind(this.renderFeature, this));

        this.featureDiv = document.createElement('div');
        this.featureDiv.className = 'selectionPanelContent';
        this.clearSelection();

        d.appendChild(this.toolbar);
        d.appendChild(this.featureDiv);
        
        Fusion.addWidgetStyleSheet(widgetTag.location + 'SelectionPanel/SelectionPanel.css');
        
        this.domObj.appendChild(d);
    },
    
    clearSelection: function() {
        this.layerList.options.length = 0;
        this.featureList.options.length = 0;
        this.oSelection = null;
        Element.addClassName(this.featureDiv, 'noSelection');
        this.featureDiv.innerHTML = OpenLayers.i18n('noSelection');
    },
    
    updateSelection: function() {
        //console.log('update selection');
        this.getMap().getSelection(
                    OpenLayers.Function.bind(this.renderSelectionLayers, this));
    },
    
    renderSelectionLayers: function(oSelection) {
        //TODO: this just gets the first map, we need them all
        this.oSelection = null;
        for (var mapName in oSelection) {
            this.oSelection = oSelection[mapName];
            break;
        }
        if (!this.oSelection) {
            return;
        }
        //clear the layer list select box of any previous selections
        Element.removeClassName(this.featureDiv, 'noSelection');
        while (this.layerList.length>0) {
          this.layerList.remove(this.layerList.options[0]);
        }
        var nLayers = this.oSelection.getNumLayers();
        for (var i=0; i<nLayers; i++) {
            var layerObj = this.oSelection.getLayer(i);
            //find the legend label from the Map layer objects
            var mapLayers = this.getMap().aMaps[0].aLayers; //TODO: allow multiple maps
            var labelName = layerObj.getName();
            for (var j=0; j<mapLayers.length; ++j) {
              if (mapLayers[j].layerName == labelName) {
                labelName = mapLayers[j].legendLabel;
                break;
              }
            }
            var opt = new Option(labelName, i);
            this.layerList.options[i] = opt;
        }
        this.layerList.selectedIndex = 0;
        this.renderSelectionFeatures();
    },
    
    renderSelectionFeatures: function() {
        var layerIdx = this.layerList.selectedIndex;
        //clear the feature list select box of any previous selections
        while (this.featureList.length>0) {
          this.featureList.remove(this.featureList.options[0]);
        }
        var layerObj = this.oSelection.getLayer(layerIdx);
        var nElements = layerObj.getNumElements();
        for (var i=0; i<nElements; i++) {
            var opt = new Option(i+1, i);
            this.featureList.options[i] = opt;
        }
        this.featureList.selectedIndex = 0;
        this.renderFeature();
    },
    
    renderFeature: function() {
        var layerIdx = this.layerList.selectedIndex;
        var featureIdx = this.featureList.selectedIndex;
        var layerObj = this.oSelection.getLayer(layerIdx);
        var nProperties = layerObj.getNumProperties();
        var aNames = layerObj.getPropertyNames();
        
        var table = document.createElement('table');

        var thead = document.createElement('thead');
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        th.innerHTML = OpenLayers.i18n('attribute');
        tr.appendChild(th);
        var th = document.createElement('th');
        th.innerHTML = OpenLayers.i18n('value');
        tr.appendChild(th);
        thead.appendChild(tr);
        table.appendChild(thead);
        
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        for (var i=0; i<nProperties; i++) {
            var tr = document.createElement('tr');
            if (i%2) {
                Element.addClassName(tr, 'oddRow');
            }
            var th = document.createElement('th');
            th.innerHTML = aNames[i];
            var td = document.createElement('td');
            td.innerHTML = layerObj.getElementValue(featureIdx, i);
            tr.appendChild(th);
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        this.featureDiv.innerHTML = '';
        this.featureDiv.appendChild(table);
    }
});
