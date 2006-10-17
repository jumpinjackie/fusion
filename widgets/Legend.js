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
//require('jx/tree/jxtree.js');

var Legend = Class.create();
Legend.prototype = 
{
    currentNode: null,
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

        this.mapLayers = [];
        this.mapGroups = [];
        
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
        
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this, this.update);
        this.getMap().registerForEvent(MAP_LOADED, this, this.getLayers);
        
        //this.getLayers();
    },
    
    /**
     * Calls the server-side script which provides XML for legend content.
     */
    getLayers: function()
    {
        var s = 'server/' + Fusion.getScriptLanguage() + '/MGLegend.' + Fusion.getScriptLanguage();
        var params = {parameters:'session='+Fusion.getSessionID()+'&mapname='+ this.getMap()._sMapname, onComplete: this.draw.bind(this)};
        Fusion.ajaxRequest(s, params);
    },
    
    /**
     * the map state has become invalid in some way (layer added, removed,
     * ect).  For now, we just re-request the map state from the server
     * which calls draw which recreates the entire legend from scratch
     *
     * TODO: more fine grained updating of the legend would be nice
     */
    invalidate: function() {
        this.getLayers();
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
        this.clear();
        if (r.responseXML)
        {
            var root = new DomNode(r.responseXML.childNodes[0]);
            var groupNode = root.findFirstNode('group');
            while(groupNode) {
                //TODO: group object?
                var group = new MGGroup(groupNode, this.getMap(), this);
                if (group.parentUniqueId != '') {
                    group.parent = this.mapGroups[group.parentUniqueId];
                } else {
                    group.parent = null;
                }

                this.mapGroups[group.uniqueId] = group;
                
                if (group.parent) {
                    group.parent.treeItem.append(group.treeItem)
                } else {
                    this.oRoot.append(group.treeItem);
                }
                
                group.checkBox.checked = group.visible?true:false;
                
                groupNode = root.findNextNode('group');
            }
            var layerNode = root.findFirstNode('layer');
            while(layerNode) {
                var layer = new MGLayer(layerNode, this.getMap(), this);
                layer.themeIcon = this.imgLayerThemeIcon;
                layer.disabledLayerIcon = this.imgDisabledLayerIcon;
                if (layer.parentGroup != '') {
                    layer.groupItem = this.mapGroups[layer.parentGroup].treeItem;
                } else {
                    layer.groupItem = this.oRoot;
                }
                
                this.mapLayers.push(layer);
                layerNode = root.findNextNode('layer');
            }
        }
        this.update();
    },
    
    update: function() {
        window.setTimeout(this._update.bind(this), 1);
    },
    
    /**
     * update the tree when the map scale changes
     */
    _update: function() {
        //console.log('Legend.update');
        var currentScale = this.getMap().getScale();
        for (var i=0; i<this.mapLayers.length; i++) {
            this.mapLayers[i].updateTreeItemForScale(currentScale);
        }
    },
    
    /**
     * remove the dom objects representing the legend layers and groups
     */
    clear: function() {
        while (this.oRoot.nodes.length > 0) {
            this.oRoot.remove(this.oRoot.nodes[0]);
        }
        this.mapGroups = [];
        this.mapLayers = [];
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
    }
};

var MGGroup = Class.create();
MGGroup.prototype = {
    oMap: null,
    oSelectionListener: null,
    initialize: function(groupNode, oMap, selectionListener) {
        this.oSelectionListener = selectionListener;
        this.oMap = oMap;
        this.name = groupNode.getNodeText('groupname');
        this.legendLabel = groupNode.getNodeText('legendlabel');
        this.uniqueId = groupNode.getNodeText('uniqueid');
        this.parentUniqueId = groupNode.getNodeText('parentuniqueid');
        this.groupType = groupNode.getNodeText('layergrouptype');
        this.displayInLegend = groupNode.getNodeText('displayinlegend');
        this.expandInLegend = groupNode.getNodeText('expandinlegend');
        this.visible = groupNode.getNodeText('visible');
        this.actuallyVisible = groupNode.getNodeText('actuallyvisible');
        if (this.displayInLegend) {
            var opt = {};
            opt.label = this.legendLabel;
            opt.data = this;
            opt.isOpen = this.expandInLegend;
            this.treeItem = new JxTreeFolder(opt);
            this.checkBox = document.createElement('input');
            this.checkBox.type = 'checkbox';
            this.checkBox.checked = this.visible?true:false;
            Event.observe(this.checkBox, 'click', this.stateChanged.bind(this));
            this.treeItem.domObj.insertBefore(this.checkBox, this.treeItem.domObj.childNodes[1]);
            if (this.oSelectionListener) {
                this.treeItem.addSelectionListener(this.oSelectionListener);
            }
        } else {
            this.treeItem = null;
        }
    },
    stateChanged: function() {
        if (this.checkBox.checked) {
            this.oMap.showGroup(this.uniqueId);
        } else {
            this.oMap.hideGroup(this.uniqueId);
        }
    }
};

var MGLayer = Class.create();
MGLayer.prototype = {
    
    scaleRanges: null,
    
    oMap: null,
    
    currentRange: -1,
    
    bFirstDisplay: null,
    
    oSelectionListener: null,
    
    initialize: function(layerNode, oMap, selectionListener) {
        this.oSelectionListener = selectionListener;
        this.oMap = oMap;
        this.layerName = layerNode.getNodeText('layername');
        this.uniqueId = layerNode.getNodeText('uniqueid');
        this.resourceId = layerNode.getNodeText('rid');
        this.legendLabel = layerNode.getNodeText('legendlabel');
        this.selectable = layerNode.getNodeText('selectable');
        this.layerType = layerNode.getNodeText('layertype');
        this.displayInLegend = layerNode.getNodeText('displayinlegend');
        this.expandInLegend = layerNode.getNodeText('expandinlegend');
        this.visible = layerNode.getNodeText('visible') == 'true' ? true : false;
        this.actuallyVisible = layerNode.getNodeText('actuallyvisible') == 'true' ? true : false;
        //TODO: make this configurable
        this.themeIcon = 'images/tree_theme.png';
        this.disabledLayerIcon = 'images/tree_layer.png';
        
        this.parentGroup = layerNode.getNodeText('parentgroup');
        this.scaleRanges = [];
        var scaleRangeNode = layerNode.findFirstNode('scalerange');
        while(scaleRangeNode) {
            var scaleRange = new MGScaleRange(scaleRangeNode);
            this.scaleRanges.push(scaleRange);
            scaleRangeNode = layerNode.findNextNode('scalerange');
        }
        this.checkBox = document.createElement('input');
        this.checkBox.type = 'checkbox';
        this.checkBox.checked = this.visible?true:false;
        
        this.bFirstDisplay = true;
        Event.observe(this.checkBox, 'click', this.stateChanged.bind(this));
    },
    getScaleRange: function(fScale) {
        for (var i=0; i<this.scaleRanges.length; i++) {
            if (this.scaleRanges[i].contains(fScale)) {
                return this.scaleRanges[i];
            }
        }
        return null;
    },
    updateTreeItemForScale: function(fScale) {
        var range = this.getScaleRange(fScale);
        if (range == this.currentRange && !this.bFirstDisplay) {
            return;
        }
        
        this.currentRange = range;
        if (range != null) {
            
            this.checkBox.disabled = false;
            if (range.styles.length > 1) {
                //tree item needs to be a folder
                if (!this.treeItem) {
                    this.treeItem = this.createFolderItem();
                    this.groupItem.append(this.treeItem);
                } else if (this.treeItem instanceof JxTreeItem) {
                    this.clearTreeItem();
                    this.treeItem = this.createFolderItem();
                    this.groupItem.append(this.treeItem);
                } else {
                    while(this.treeItem.nodes.length > 0) {
                        this.treeItem.remove(this.treeItem.nodes[0]);
                    }
                }
                for (var i=0; i<range.styles.length; i++) {
                    var item = this.createTreeItem(range.styles[i].label, 
                                               range.styles[i], fScale, false);
                    this.treeItem.append(item);
                }
            } else {
                
                //tree item is really a tree item
                if (!this.treeItem) {
                    this.treeItem = this.createTreeItem(this.legendLabel, range.styles[0], fScale, true);
                    this.groupItem.append(this.treeItem);                    
                } else if (this.treeItem instanceof JxTreeFolder) {
                    this.clearTreeItem();
                    this.treeItem = this.createTreeItem(this.legendLabel, range.styles[0], fScale, true);
                    this.groupItem.append(this.treeItem);
                } else {                    
                    this.treeItem.domObj.childNodes[2].src = range.styles[0].getLegendImageURL(fScale, this.resourceId);
                }
            }
            
        } else {
            this.checkBox.disabled = true;
            this.clearTreeItem();
            this.treeItem = this.createTreeItem(this.legendLabel, null, null, true);
            this.groupItem.append(this.treeItem);
        }
        if (this.bFirstDisplay) {
            this.bFirstDisplay = false;
            this.checkBox.checked = this.visible?true:false;
        }
    },
    createFolderItem: function() {
        var opt = {};
        opt.label = this.legendLabel == '' ? '&nbsp;' : this.legendLabel;
        opt.data = this;
        opt.isOpen = this.expandInLegend;
        opt.imgTreeFolderOpen = this.themeIcon;
        opt.imgTreeFolder = this.themeIcon;
        var folder = new JxTreeFolder(opt);
        folder.domObj.insertBefore(this.checkBox, folder.domObj.childNodes[1]);
        
        if (this.oSelectionListener) {
            folder.addSelectionListener(this.oSelectionListener);
        }
        
        return folder;
    },
    createTreeItem: function(label, style, scale, bCheckBox) {
        var opt = {}
        opt.label = label == '' ? '&nbsp;' : label;
        opt.data = this;
        if (!style) {
            opt.imgIcon = this.disabledLayerIcon;
        } else {
            opt.imgIcon = style.getLegendImageURL(scale, this.resourceId);
        }
        
        var item = new JxTreeItem(opt);
        
        if (bCheckBox) {
            item.domObj.insertBefore(this.checkBox, item.domObj.childNodes[1]);
        }

        if (this.oSelectionListener) {
            item.addSelectionListener(this.oSelectionListener);
        }
        
        return item;
    },
    clearTreeItem: function() {
        if (this.treeItem) {
            this.treeItem.parent.remove(this.treeItem);
            this.treeItem.finalize();
            this.treeItem = null;
        }
    },
    stateChanged: function() {
        if (this.checkBox.checked) {
            this.oMap.showLayer(this.uniqueId);
        } else {
            this.oMap.hideLayer(this.uniqueId);
        }
    }
}

var MGScaleRange = Class.create();
MGScaleRange.prototype = {
    styles: null,
    initialize: function(scaleRangeNode) {
        this.minScale = scaleRangeNode.getNodeText('minscale');
        this.maxScale = scaleRangeNode.getNodeText('maxscale');
        this.styles = [];
        styleItemNode = scaleRangeNode.findFirstNode('styleitem');
        while(styleItemNode) {
            var styleItem = new MGStyleItem(styleItemNode);
            this.styles.push(styleItem);
            styleItemNode = scaleRangeNode.findNextNode('styleitem');
        }
    },
    contains: function(fScale) {
        return fScale >= this.minScale && fScale <= this.maxScale;
    }
};

var MGStyleItem = Class.create();
MGStyleItem.prototype = {
    initialize: function(styleItemNode) {
        this.label = styleItemNode.getNodeText('label');
        this.filter = styleItemNode.getNodeText('filter');
        this.geometryType = styleItemNode.getNodeText('geomtype');
        if (this.geometryType == '') {
            this.geometryType = -1;
        }
        this.categoryIndex = styleItemNode.getNodeText('categoryindex');
        if (this.categoryindex == '') {
            this.categoryindex = -1;
        }
    },
    getLegendImageURL: function(fScale, resourceID) {
        var url = Fusion.getWebAgentURL();
        var session = Fusion.getSessionID();
        return url + "OPERATION=GETLEGENDIMAGE&SESSION=" + session + "&VERSION=1.0.0&SCALE=" + fScale + "&LAYERDEFINITION=" + encodeURIComponent(resourceID) + "&THEMECATEGORY=" + this.categoryIndex + "&TYPE=" + this.geometryType;
    }
};
