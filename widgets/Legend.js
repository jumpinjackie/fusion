/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Legend widget
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
 * Legend and layer control
 *
 * To put a Legend control in your application, you first need to add a
 * widget to your WebLayout as follows:
 *
 * <Command xsi:type="LegendCommandType">
 *   <Name>MyLegend</Name>
 *   <Label>Legend</Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>Legend</Action>
 *   <ShowRootFolder>false</ShowRootFolder>
 *   <LayerThemeIcon>images/tree_map.png</LayerThemeIcon>
 *   <DisabledLayerIcon>images/tree_layer.png</DisabledLayerIcon>
 *   <RootFolderIcon>images/tree_map.png</RootFolderIcon>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyLegend"></div>
 *
 * The legend will appear inside the element you provide.
 *
 * ShowRootFolder (boolean, optional)
 *
 * This controls whether the tree will have a single root node that
 * contains the name of the map as its label.  By default, the root
 * node does not appear.  Set to "true" or "1" to make the root node
 * appear.
 *
 * RootFolderIcon: (string, optional)
 *
 * The url to an image to use for the root folder.  This only has an
 * affect if ShowRootFolder is set to show the root folder.
 *
 * LayerThemeIcon: (string, optional)
 *
 * The url to an image to use for layers that are currently themed.
 * 
 * DisabledLayerIcon: (string, optional)
 *
 * The url to an image to use for layers that are out of scale.
 *
 * **********************************************************************/
//Fusion.require('jx/tree/jxtree.js');

var Legend = Class.create();
Legend.prototype = 
{
    currentNode: null,
    bIsDrawn: false,
    initialize : function(oCommand)
    {
        
        this.defLayerThemeIcon = Fusion.getFusionURL() + 'images/tree_theme.png';
        this.defDisabledLayerIcon = Fusion.getFusionURL() + 'images/tree_layer.png';
        this.defRootFolderIcon = Fusion.getFusionURL() + 'images/tree_map.png';

        //console.log('Legend.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Zoom', true]);
        this.setMap(oCommand.getMap());
        
        this._oDomObj = $(oCommand.getName());
        
        var img = oCommand.oxmlNode.getNodeText('LayerThemeIcon');
        this.imgLayerThemeIcon = (img != '') ? img : this.defLayerThemeIcon;

        img = oCommand.oxmlNode.getNodeText('DisabledLayerIcon');
        this.imgDisabledLayerIcon = (img != '') ? img : this.defDisabledLayerIcon;
        
        this.selectedLayer = null;
        
        this.oTree = new JxTree(this._oDomObj);
        
        var showMapFolder = oCommand.oxmlNode.getNodeText('ShowRootFolder');
        if (showMapFolder == 'true' || showMapFolder == '1') {
            var opt = {};
            opt.label = this.getMap().getMapName();
            opt.data = null;
            img = oCommand.oxmlNode.getNodeText('RootFolderIcon');
            opt.imgTreeFolder = (img != '') ? img : defRootFolderIcon;
            opt.imgTreeFolderOpen = opt.imgTreeFolder;
            opt.isOpen = true;
            this.oRoot = new JxTreeFolder(opt);
            this.oTree.append(this.oRoot);
        } else {
            this.oRoot = this.oTree;
        }
        
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.update.bind(this));
        this.getMap().registerForEvent(MAP_LOADED, this.draw.bind(this));
        
        //this.getLayers();
    },
    /**
     * the map state has become invalid in some way (layer added, removed,
     * ect).  For now, we just re-request the map state from the server
     * which calls draw which recreates the entire legend from scratch
     *
     * TODO: more fine grained updating of the legend would be nice
     */
    invalidate: function() {
        this.draw();
    },
    
    /**
     * Callback for legend XML response. Creates a list of layers and sets up event
     * handling. Create groups if applicable.
     * TODO: error handling 
     *
     * @param r Object the reponse xhr object
     */
    draw: function(r)
    {
        console.log('draw');
        this.bIsDrawn = false;
        this.clear();
        var map = this.getMap();
        for (var i=0; i<map.layerRoot.groups.length; i++) {
            console.log('draw group ' + map.layerRoot.groups[i].groupName);
            this.processMapGroup(map.layerRoot.groups[i], this.oRoot);
        }
        for (var i=0; i<map.layerRoot.layers.length; i++) {
            console.log('draw layer ' + map.layerRoot.layers[i].layerName);
            this.processMapLayer(map.layerRoot.layers[i], this.oRoot);
        }
        this.bIsDrawn = true;
        this.update();
    },
    
    processMapGroup: function(group, folder) {
        console.log('processing map group ' + group.groupName);
        if (group.displayInLegend) {
            console.log('group in legend');
            /* make a 'namespace' on the group object to store legend-related info */
            group.legend = {};
            var opt = {};
            opt.label = group.legendLabel;
            opt.data = group;
            opt.isOpen = group.expandInLegend;
            group.legend.treeItem = new JxTreeFolder(opt);
            folder.append(group);
            var checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.checked = group.visible?true:false;
            Event.observe(checkBox, 'click', this.stateChanged.bind(this));
            group.legend.treeItem.domObj.insertBefore(checkBox, group.legend.treeItem.domObj.childNodes[1]);
            if (this.oSelectionListener) {
                group.legend.treeItem.addSelectionListener(this);
            }
            for (var i=0; i<group.groups.length; i++) {
                console.log('draw group ' + group.groups[i].groupName);
                this.processMapGroup(group.groups[i], group.legend.treeItem);
            }
            for (var i=0; i<group.layers.length; i++) {
                console.log('draw layer ' + group.layers[i].layerName);
                this.processMapLayer(group.layers[i], group.legend.treeItem);
            }
        }
    },
    
    processMapLayer: function(layer, folder) {
        /* make a 'namespace' on the layer object to store legend-related info */
        console.log('processing map layer ' + layer.layerName);
        layer.legend = {};
        layer.legend.parentItem = folder;
        layer.legend.checkBox = document.createElement('input');
        layer.legend.checkBox.type = 'checkbox';
        layer.legend.currentRange = null;
    },

    update: function() {
        if (this.bIsDrawn) {
            window.setTimeout(this._update.bind(this), 1);
        }
    },
    
    /**
     * update the tree when the map scale changes
     */
    _update: function() {
        //console.log('Legend.update');
        var currentScale = this.getMap().getScale();
        var map = this.getMap();
        for (var i=0; i<map.layerRoot.groups.length; i++) {
            this.updateGroupLayers(map.layerRoot.groups[i], currentScale);
        }
        for (var i=0; i<map.layerRoot.layers.length; i++) {
            this.updateLayer(map.layerRoot.layers[i], currentScale);
        }
    },
    
    /**
     * remove the dom objects representing the legend layers and groups
     */
    clear: function() {
        while (this.oRoot.nodes.length > 0) {
            this.oRoot.remove(this.oRoot.nodes[0]);
        }
    },
    selectionChanged: function(o) {
        if (this.currentNode) {
            Element.removeClassName(this.currentNode.domObj.childNodes[3], 'jxTreeSelectedNode')
        }
        this.currentNode = o;
        Element.addClassName(this.currentNode.domObj.childNodes[3], 'jxTreeSelectedNode')
        
        if (o.data instanceof MGGroup) {
            this.getMap().setActiveLayer(null);
        } else {
            this.getMap().setActiveLayer(o.data);
        }
    },
    updateGroupLayers: function(group, fScale) {
        for (var i=0; i<group.groups.length; i++) {
            this.updateGroupLayers(group.groups[i], fScale);
        }
        for (var i=0; i<group.layers.length; i++) {
            this.updateLayer(group.layers[i], fScale);
        }    
    },
    updateLayer: function(layer, fScale) {
        var bFirstDisplay = false;
        if (!layer.displayInLegend) {
            return;
        }
        var range = layer.getScaleRange(fScale);
        if (range == layer.legend.currentRange && layer.legend.treeItem) {
            return;
        }
        
        layer.currentRange = range;
        if (range != null) {
            
            layer.legend.checkBox.disabled = false;
            if (range.styles.length > 1) {
                //tree item needs to be a folder
                if (!layer.legend.treeItem) {
                    bFirstDisplay = true;
                    layer.legend.treeItem = this.createFolderItem(layer);
                    layer.parentGroup.legend.treeItem.append(layer.legend.treeItem);
                } else if (layer.legend.treeItem instanceof JxTreeItem) {
                    this.clearTreeItem(layer);
                    layer.legend.treeItem = this.createFolderItem(layer);
                    layer.parentGroup.legend.treeItem.append(layer.legend.treeItem);
                } else {
                    while(layer.legend.treeItem.nodes.length > 0) {
                        layer.legend.treeItem.remove(layer.legend.treeItem.nodes[0]);
                    }
                }
                for (var i=0; i<range.styles.length; i++) {
                    var item = this.createTreeItem(range.styles[i], 
                                               range.styles[i], fScale, false);
                    layer.legend.treeItem.append(item);
                }
            } else {
                
                //tree item is really a tree item
                if (!layer.legend.treeItem) {
                    bFirstDisplay = true;
                    layer.legend.treeItem = this.createTreeItem(layer, range.styles[0], fScale, true);
                    layer.parentGroup.legend.treeItem.append(layer.legend.treeItem);                    
                } else if (layer.legend.treeItem instanceof JxTreeFolder) {
                    this.clearTreeItem(layer);
                    layer.legend.treeItem = this.createTreeItem(layer, range.styles[0], fScale, true);
                    layer.parentGroup.legend.treeItem.append(layer.legend.treeItem);
                } else {                    
                    layer.legend.treeItem.domObj.childNodes[2].src = range.styles[0].getLegendImageURL(fScale, layer.resourceId);
                }
            }
            
        } else {
            layer.legend.checkBox.disabled = true;
            layer.legend.clearTreeItem();
            layer.legend.treeItem = this.createTreeItem(layer.legendLabel, null, null, true);
            layer.parentGroup.legend.treeItem.append(layer.legend.treeItem);
        }
        if (bFirstDisplay) {
            layer.legend.checkBox.checked = layer.visible?true:false;
        }
    },
    createFolderItem: function(layer) {
        var opt = {};
        opt.label = layer.legendLabel == '' ? '&nbsp;' : layer.legendLabel;
        opt.data = layer;
        opt.isOpen = layer.expandInLegend;
        opt.imgTreeFolderOpen = layer.themeIcon;
        opt.imgTreeFolder = layer.themeIcon;
        var folder = new JxTreeFolder(opt);
        folder.domObj.insertBefore(layer.legend.checkBox, folder.domObj.childNodes[1]);
        
        folder.addSelectionListener(this);
        
        return folder;
    },
    createTreeItem: function(layer, style, scale, bCheckBox) {
        var opt = {}
        opt.label = layer.legendLabel == '' ? '&nbsp;' : layer.legendLabel;
        opt.data = layer;
        if (!style) {
            opt.imgIcon = layer.disabledLayerIcon;
        } else {
            opt.imgIcon = style.getLegendImageURL(scale, layer.resourceId);
        }
        
        var item = new JxTreeItem(opt);
        
        if (bCheckBox) {
            item.domObj.insertBefore(layer.legend.checkBox, item.domObj.childNodes[1]);
        }

        item.addSelectionListener(this);
        
        return item;
    },
    clearTreeItem: function(layer) {
        if (layer.legend.treeItem) {
            layer.legend.treeItem.parent.remove(layer.legend.treeItem);
            layer.legend.treeItem.finalize();
            layer.legend.treeItem = null;
        }
    },
    stateChanged: function() {
        console.log('stateChanged');
    }
};