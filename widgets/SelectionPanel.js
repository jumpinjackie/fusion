/***************************************************************************** 
 * $Id: $
 * 
 * The SelectionPanel widget displays attributes for the features that are
 * selected on the map.
 *
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *****************************************************************************
 *
 * To put a SelectionPanel widget in your application, you first need to add
 * a widget to your ApplicationDefinition as follows:
 *
 * <Widget xsi:type="WidgetType"">
 *   <Name>SelectionPanel</Name>
 *   <Type>SelectionPanel</Type>
 *   <Description>Displays the attribute information for selected
 *                features.</Description>
 *   <Extension>
 *   </Extension>
 * </Command>
 *
 * **************************************************************************/

Fusion.Widget.SelectionPanel = Class.create();
Fusion.Widget.SelectionPanel.prototype = {

    initialize : function(widgetTag) {
        //console.log('SelectionPanel.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, [widgetTag, false]);
        
        this.defPrevTaskIcon = 'images/icon_back.gif';
        this.defNextTaskIcon = 'images/icon_forward.gif';

        var json = widgetTag.extension;
        
        this.getMap().registerForEvent(Fusion.Event.MAP_SELECTION_ON, this.updateSelection.bind(this));
        this.getMap().registerForEvent(Fusion.Event.MAP_SELECTION_OFF, this.clearSelection.bind(this));
        
        var d = document.createElement('div');
        
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'selectionPanelToolbar';
        
        this.layerList = document.createElement('select');
        this.layerList.className = 'layerSelector';
        this.toolbar.appendChild(this.layerList);
        Event.observe(this.layerList, 'change', this.renderSelectionFeatures.bind(this));
        
        this.featureList = document.createElement('select');
        this.featureList.className = 'featureSelector';
        this.toolbar.appendChild(this.featureList);
        Event.observe(this.featureList, 'change', this.renderFeature.bind(this));

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
        this.featureDiv.innerHTML = 'No Selection';
    },
    
    updateSelection: function() {
        //console.log('update selection');
        this.getMap().getSelection(this.renderSelectionLayers.bind(this));
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
        Element.removeClassName(this.featureDiv, 'noSelection');
        var nLayers = this.oSelection.getNumLayers();
        for (var i=0; i<nLayers; i++) {
            var layerObj = this.oSelection.getLayer(i);
            var opt = new Option(layerObj.getName(), i);
            this.layerList.options[i] = opt;
        }
        this.layerList.selectedIndex = 0;
        this.renderSelectionFeatures();
    },
    
    renderSelectionFeatures: function() {
        var layerIdx = this.layerList.selectedIndex;
        this.featureList.options.length = 0;
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
        th.innerHTML = 'Attribute';
        tr.appendChild(th);
        var th = document.createElement('th');
        th.innerHTML = 'Value';
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
};
