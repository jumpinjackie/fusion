/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose this file contains the map widget
 * @author yassefa@dmsolutions.ca
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
 * extended description
 * **********************************************************************/
/**
 * MGMap : MapGuide map widget Based on generic class GxMap
*/
Fusion.require('widgets/GxMap.js');

var gnLastEventId = 10;
var MGMAP_SELECTION_ON = gnLastEventId++;
var MGMAP_SELECTION_OFF = gnLastEventId++;
var MGMAP_ACTIVE_LAYER_CHANGED = gnLastEventId++;
var MAP_LOADED = gnLastEventId++;
var MAP_LOADING = gnLastEventId++;

var MGMap = Class.create();

//TODO: what is this doing here???
Object.extend(MGWebLayout.prototype, EventMgr.prototype);

MGMap.prototype =
{
    aShowLayers: null,
    aHideLayers: null,
    aShowGroups: null,
    aHideGroups: null,
    aRefreshLayers: null,
    sActiveLayer: null,
    bSelectionOn: false,
    oSelection: null,

    //the resource id of the current MapDefinition
    _sResourceId: null,
    
    initialize : function(oCommand)
    {
        //console.log('MGMap.initialize');
        Object.inheritFrom(this, GxMap.prototype, [oCommand]);
        
        this.registerEventID(MGMAP_SELECTION_ON);
        this.registerEventID(MGMAP_SELECTION_OFF);
        this.registerEventID(MGMAP_ACTIVE_LAYER_CHANGED);
        this.registerEventID(MAP_LOADED);
        this.registerEventID(MAP_LOADING);
        
        this._oConfigObj = Fusion.oConfigMgr;
        
        this.oSelection = null;

        this.sMapResourceId = oCommand.jsonNode.ResourceId ? oCommand.jsonNode.ResourceId[0] : '';
        //console.log('resource id is ' + this.sMapResourceId);
        if (this.sMapResourceId != '') {
            this.loadMap(this.sMapResourceId);
        }
        
    },
    
    loadMap: function(resourceId, options) {
        this.triggerEvent(MAP_LOADING);
        
        this._addWorker();
        //console.log('loadMap: ' + resourceId);
        /* don't do anything if the map is already loaded? */
        if (this._sResourceId == resourceId) {
            return;
        }
        
        this._fScale = -1;
        this._nDpi = 96;
        
        options = options || {};
        
        this._afInitialExtents = options.extents || null;
        this._afCurrentExtents = options.extents || null;
        this.aShowLayers = options.showlayers || [];
        this.aHideLayers = options.hidelayers || [];
        this.aShowGroups = options.showgroups || [];
        this.aHideGroups = options.hidegroups || [];
        this.aRefreshLayers = options.refreshlayers || [];
        this.aLayers = [];
        this.layerRoot = new GxGroup();
        
        this.oSelection = null;
        this.aSelectionCallbacks = [];
        this._bSelectionIsLoading = false;

        var sl = Fusion.getScriptLanguage();
        var loadmapScript = 'server/' + sl  + '/MGLoadMap.' + sl;
        
        var sessionid = Fusion.getSessionID();
        
        var params = 'mapid='+resourceId+"&session="+sessionid;
        var options = {onSuccess: this.mapLoaded.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    
    mapLoaded: function(r, json) {
        //console.log('mapLoaded: ' + json);
        if (json) {
            //console.log('processing json: '+r.responseText);
            var o;
            eval('o='+r.responseText);
            this._sResourceId = o.mapId;
            this._sMapname = o.mapName;
            this._fMetersperunit = o.metersPerUnit;

            if (!this._afInitialExtents) {
                this._afInitialExtents = [].concat(o.extent);
            }
            
            this.parseMapLayersAndGroups(o);
            
            for (var i=0; i<this.aShowLayers.length; i++) {
                var layer =  this.layerRoot.findLayerByAttribute('layerName', this.aShowLayers[i]);
                if (layer) {
                    this.aShowLayers[i] = layer.uniqueId;
                } else {
                    this.aShowLayers[i] = '';
                }
            }
            for (var i=0; i<this.aHideLayers.length; i++) {
                var layer =  this.layerRoot.findLayerByAttribute('layerName', this.aHideLayers[i]);
                if (layer) {
                    this.aHideLayers[i] = layer.uniqueId;
                } else {
                    this.aHideLayers[i] = '';
                }
            }
            
            for (var i=0; i<this.aShowGroups.length; i++) {
                var group =  this.layerRoot.findGroupByAttribute('groupName', this.aShowGroups[i]);
                if (group) {
                    this.aShowGroups[i] = group.uniqueId;
                } else {
                    this.aShowGroups[i] = '';
                }
            }
            
            for (var i=0; i<this.aHideGroups.length; i++) {
                var group =  this.layerRoot.findGroupByAttribute('groupName', this.aHideGroups[i]);
                if (group) {
                    this.aHideGroups[i] = group.uniqueId;
                } else {
                    this.aHideGroups[i] = '';
                }
            }
            
            this.oMapInfo = Fusion.oConfigMgr.getMapInfo(this._sResourceId);
            
            this.setExtents(this._afInitialExtents);
            
            //this._calculateScale();
            this.triggerEvent(MAP_LOADED);
        } else {
            Fusion.error( new GxError(FUSION_ERROR_FATAL, 'Failed to load requested map:\n'+r.responseText));
        }
        this._removeWorker();
    },
    
    reloadMap: function() {
        
        this._addWorker();
        //console.log('loadMap: ' + resourceId);
        this.aShowLayers = [];
        this.aHideLayers = [];
        this.aShowGroups = [];
        this.aHideGroups = [];
        this.aRefreshLayers = [];
        this.layerRoot = new GxGroup();
        this.aLayers = [];
        
        var sl = Fusion.getScriptLanguage();
        var loadmapScript = 'server/' + sl  + '/MGLoadMap.' + sl;
        
        var sessionid = Fusion.getSessionID();
        
        var params = 'mapname='+this._sMapname+"&session="+sessionid;
        var options = {onSuccess: this.mapReloaded.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    
    mapReloaded: function(r,json) {
        if (json) {
            var o;
            eval('o='+r.responseText);
            this.parseMapLayersAndGroups(o);
            this.triggerEvent(MAP_LOADED);
        } else {
            Fusion.error( new GxError(FUSION_ERROR_FATAL, 'Failed to load requested map:\n'+r.responseText));
        }
        this._removeWorker();
    },
    
    parseMapLayersAndGroups: function(o) {
        for (var i=0; i<o.groups.length; i++) {
            var group = new MGGroup(o.groups[i], this);
            var parent;
            if (group.parentUniqueId != '') {
                parent = this.layerRoot.findGroup(group.parentUniqueId);
            } else {
                parent = this.layerRoot;
            }
            parent.addGroup(group);
        }

        for (var i=0; i<o.layers.length; i++) {
            var layer = new MGLayer(o.layers[i], this);
            var parent;
            if (layer.parentGroup != '') {
                parent = this.layerRoot.findGroup(layer.parentGroup);
            } else {
                parent = this.layerRoot;
            }
            parent.addLayer(layer);
            this.aLayers.push(layer);
        }
    },
    
    isMapLoaded: function() {
        return (this._afCurrentExtents) ? true : false;
    },

    setExtents : function(aExtents) {
        this.setExtentsGxMap(aExtents);
        this.drawMap();
    },

    getScale : function() {
        return this._fScale;
    },
    
    drawMap: function() {
        //console.log('MGMap.drawMap');
        this._addWorker();
        var cx = (this._afCurrentExtents[0] + this._afCurrentExtents[2])/2;
        var cy = (this._afCurrentExtents[1] + this._afCurrentExtents[3])/2;   

        var nWidth = this._nWidth;
        var nHeight = this._nHeight;
        
        var showLayers = this.aShowLayers.length > 0 ? 
                              this.aShowLayers.toString() : null;
        var hideLayers = this.aHideLayers.length > 0 ? 
                              this.aHideLayers.toString() : null;
        var showGroups = this.aShowGroups.length > 0 ? 
                              this.aShowGroups.toString() : null;
        var hideGroups = this.aHideGroups.length > 0 ? 
                              this.aHideGroups.toString() : null;
        var refreshLayers = this.aRefreshLayers.length > 0 ? 
                              this.aRefreshLayers.toString() : null;
        this.aShowLayers = [];
        this.aHideLayers = [];
        this.aShowGroups = [];
        this.aHideGroups = [];
        this.aRefreshLayers = [];

        var r = new MGGetVisibleMapExtent(this._oConfigObj.getSessionId(),
                               this._sMapname, cx, cy,
                               this._fScale, null, this._nDpi, nWidth, 
                               nHeight, showLayers, hideLayers, 
                               showGroups, hideGroups, refreshLayers);
        var oBroker = this._oConfigObj.oApp.getBroker();
        oBroker.dispatchRequest(r, this._requestMapImage.bind(this));
    },

    _requestMapImage : function(r)
    {
        //console.log("MGMap:: _requestMapImage");
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;

        if (r.responseXML)
        {
              //parse the new extent
            var newExtents = [];

            var xmlroot = r.responseXML.documentElement;
            var xs = xmlroot.getElementsByTagName("X");
            var ys = xmlroot.getElementsByTagName("Y");
            newExtents[0] = parseFloat(xs[0].childNodes[0].nodeValue);
            newExtents[1] = parseFloat(ys[0].childNodes[0].nodeValue);
            newExtents[2] = parseFloat(xs[1].childNodes[0].nodeValue);
            newExtents[3] = parseFloat(ys[1].childNodes[0].nodeValue);
            

            this._afCurrentExtents = newExtents;

            this._nCellSize  = 
              Math.max( Math.abs((this._afCurrentExtents[2] - this._afCurrentExtents[0])/
                                 parseInt(nWidth)),
                        Math.abs((this._afCurrentExtents[3] - this._afCurrentExtents[1])/
                                 parseInt(nHeight)));
        }
        else
        {
            //alert("non valid");
        }

        url = this._oConfigObj.getWebAgentURL() + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + this._oConfigObj.getSessionId() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();

        //console.log('MGURL ' + url);
        this.setMapImageURL(url);
    },
    
    hasSelection: function() { return this.bSelectionOn; },
    
    getSelectionCB : function(userFunc, r)
    {
        this._bSelectionIsLoading = false;
        if (r.responseXML)
        {
            this.oSelection = new MGSelectionObject(r.responseXML);
            for (var i=0; i<this.aSelectionCallbacks.length; i++) {
                this.aSelectionCallbacks[i](this.oSelection);
            }
            this.aSelectionCallbacks = [];

        }       
        this._removeWorker();
    },
    
    /**
     * advertise a new selection is available and redraw the map
     */
    newSelection: function() {
        if (this.oSelection) {
            this.oSelection = null;
        }
        this.bSelectionOn = true;
        this.drawMap();
        this.triggerEvent(MGMAP_SELECTION_ON);
    },

    /**
     * asynchronously load the current selection.  When the current
     * selection changes, the selection is not loaded because it
     * could be a lengthy process.  The user-supplied function will
     * be called when the selection is available.
     *
     * @param userFunc {Function} a function to call when the
     *        selection has loaded
     */
    getSelection : function(userFunc)
    {

        if (this.oSelection == null)
        {
            /* if the user wants a callback, register it
             * for when the selection becomes available
             */
            if (userFunc) {
                this.aSelectionCallbacks.push(userFunc);
            }
            if (!this._bSelectionIsLoading) {
                this._addWorker();
                this._bSelectionIsLoading = true;
                var s = 'server/' + Fusion.getScriptLanguage() + "/MGSelection." + Fusion.getScriptLanguage() ;
                var params = {parameters:'session='+Fusion.getSessionID()+'&mapname='+ this._sMapname, 
                              onComplete: this.getSelectionCB.bind(this, userFunc)};
                Fusion.ajaxRequest(s, params);
            }
        } else if (userFunc){
            userFunc(this.oSelection);
        }
    },

    /**
       Call back function when selection is cleared
    */
    selectionCleared : function()
    {
        this.bSelectionOn = true;
        this.triggerEvent(MGMAP_SELECTION_OFF);
        this.drawMap();
        this.oSelection = null;
    },

    /**
       Utility function to clear current selection
    */
    clearSelection : function()
    {
        var s = 'server/' + Fusion.getScriptLanguage() + "/MGClearSelection." + Fusion.getScriptLanguage() ;
        var params = {parameters:'session='+Fusion.getSessionID()+'&mapname='+ this._sMapname, onComplete: this.selectionCleared.bind(this)};
        Fusion.ajaxRequest(s, params);
    },


    /**
       Call back function when slect functions are called (eg queryRect)
    */
    processQueryResults : function(r)
    {
        if (r.responseXML)
        {
            var oNode = new DomNode(r.responseXML);
            if (oNode.getNodeText('Selection') == 'false')
            {
                this.drawMap();
                return;
            }
            else
            {
                this.newSelection();
            }
        }
        this._removeWorker();
    },

    /**
       Do a query on the map
    */
    query : function(options)
    {
        this._addWorker();
        
        var geometry = options.geometry || '';
        var maxFeatures = options.maxFeatures || -1;
        var bPersistant = options.persistent || true;
        var selectionType = options.selectionType || 'INTERSECTS';
        var filter = options.filter ? '&filter='+options.filter : '';
        var layers = options.layers || '';
        var extend = options.extendSelection ? '&extendselection=true' : '';

        var sl = Fusion.getScriptLanguage();
        var loadmapScript = 'server/' + sl  + '/MGQuery.' + sl;

        var sessionid = Fusion.getSessionID();

        var params = 'mapname='+this._sMapname+"&session="+sessionid+'&spatialfilter='+geometry+'&maxfeatures='+maxFeatures+filter+'&layers='+layers+'&variant='+selectionType+extend;
        var options = {onSuccess: this.processQueryResults.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    showLayer: function( sLayer ) {
        this.aShowLayers.push(sLayer);
        this.drawMap();
    },
    hideLayer: function( sLayer ) {
        this.aHideLayers.push(sLayer);
        this.drawMap();
    },
    showGroup: function( sGroup ) {
        this.aShowGroups.push(sGroup);
        this.drawMap();
    },
    hideGroup: function( sGroup ) {
        this.aHideGroups.push(sGroup);
        this.drawMap();
    },
    refreshLayer: function( sLayer ) {
        this.aRefreshLayers.push(sLayer);        
        this.drawMap();
    },
    setActiveLayer: function( oLayer ) {
        this.oActiveLayer = oLayer;
        this.triggerEvent(MGMAP_ACTIVE_LAYER_CHANGED, oLayer);
    },
    getActiveLayer: function() {
        return this.oActiveLayer;
    },

    getSessionId: function() {
        return this._oConfigObj.getSessionId()
    }
};


/**
 * SelectionObject
 *
 * Utility class to hold slection information
 *
 */
var MGSelectionObject = Class.create();
MGSelectionObject.prototype = 
{
    aLayers : null,

    initialize: function(oXML) 
    {
        this.aLayers = [];
        this.nTotalElements =0;

        var root = new DomNode(oXML);
        
        var node  = root.getNodeText('minx');
        if (node)
        {
            this.fMinX =  parseFloat(root.getNodeText('minx'));
            this.fMinY =  parseFloat(root.getNodeText('miny'));
            this.fMaxX =  parseFloat(root.getNodeText('maxx'));
            this.fMaxY =  parseFloat(root.getNodeText('maxy'));
        }
    
        //this is only available when the property mapping is set
        //on the layer. TODO : review
        var oTmpNode = root.findFirstNode('TotalElementsSelected');
        if (oTmpNode)
        {
            this.nTotalElements = parseInt(oTmpNode.textContent);
            if (this.nTotalElements > 0)
            {
                this.nLayers =  root.getNodeText('NumberOfLayers');
                var layerNode = root.findFirstNode('Layer');
                var iLayer=0;             
                while(layerNode) 
                {
                    this.aLayers[iLayer++] = new MGSelectionObjectLayer(layerNode);
                
                    layerNode =  root.findNextNode('Layer');
                }
            }
        }
    },

    getNumElements : function()
    {
        return this.nTotalElements;
    },

    getLowerLeftCoord : function()
    {
        return {x:this.fMinX, y:this.fMinY};
    },

    getUpperRightCoord : function()
    {
        return {x:this.fMaxX, y:this.fMaxY};
    },

    getNumLayers : function()
    {
        return this.nLayers;
    },
    
    getLayerByName : function(name)
    {
        var oLayer = null;
        for (var i=0; i<this.nLayers; i++)
        {
            if (this.aLayers[i].getName() == name)
            {
                oLayer = this.aLayers[i];
                break;
            }
        }
        return oLayer;
    },

    getLayer : function(iIndice)
    {
        if (iIndice >=0 && iIndice < this.nLayers)
        {
            return this.aLayers[iIndice];
        }
        else
        {
            return null;
        }
            
    }
};


var MGSelectionObjectLayer = Class.create();
MGSelectionObjectLayer.prototype = {

    sName: null,
    nElements: null,
    aElements: null,
    nProperties: null,
    aPropertiesName: null,
    aPropertiesTypes: null,

    type: null,
    area: null,
    distance: null,
    bbox: null,
    center: null,
    
    initialize: function(oNode) 
    {
        this.sName =  oNode.getNodeText('Name');
        this.nElements =  oNode.getNodeText('ElementsSelected');

        this.aElements = [];

        this.nProperties = oNode.getNodeText('PropertiesNumber');

        this.aPropertiesName = [];
        var oTmp = oNode.getNodeText('PropertiesNames');
        this.aPropertiesName = oTmp.split(",");

        this.aPropertiesTypes = [];
        oTmp = oNode.getNodeText('PropertiesTypes');
        this.aPropertiesTypes = oTmp.split(",");
        
        var oValueCollection = oNode.findNextNode('ValueCollection');
        
        this.area = 0;
        this.distance = 0;
        
        var iElement=0;
        while(oValueCollection) 
        {
            this.aElements[iElement] = [];
            for (var i=0; i<oValueCollection.childNodes.length; i++)
            {
                oTmp = oValueCollection.childNodes[i].findFirstNode('v');
                this.aElements[iElement][i] = oTmp.textContent;
                
            }
            var type = oValueCollection.attributes['type'];
            var area = oValueCollection.attributes['area'];
            var distance = oValueCollection.attributes['distance'];
            var bbox = oValueCollection.attributes['bbox'];
            var center = oValueCollection.attributes['center'];
            
            this.aElements[iElement]['attributes'] = {};
            this.aElements[iElement]['attributes'].type = type;
            this.aElements[iElement]['attributes'].bbox = bbox;
            this.aElements[iElement]['attributes'].center = bbox;
            //console.log('type is ' + type);
            if (type > 1) {
                this.area += parseFloat(area);
                this.aElements[iElement]['attributes'].area = area;
            }
            if (type > 0) {
                this.aElements[iElement]['attributes'].distance = distance;
                this.distance += parseFloat(distance);
            }
            oValueCollection = oNode.findNextNode('ValueCollection');
            iElement++;
        }
        //console.log( 'final area is ' + this.area);
        //console.log( 'final distance is ' + this.distance);
        
    },

    getName : function()
    {
        return this.sName;
    },

    getNumElements : function()
    {
        return this.nElements;
    },

    getNumProperties : function()
    {
        return this.nProperties;
    },

    getPropertyNames : function()
    {
        return this.aPropertiesName;
    },

    getPropertyTypes : function()
    {
        return this.aPropertiesTypes;
    },

    getElementValue : function(iElement, iProperty)
    {
        if (iElement >=0 && iElement < this.nElements &&
            iProperty >=0 && iProperty < this.nProperties)
        {
            return this.aElements[iElement][iProperty];
        }
        else
        {
            return null;
        }
    }
};
    
var MGGroup = Class.create();
MGGroup.prototype = {
    oMap: null,
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, GxGroup.prototype, [this.uniqueId]);
        this.oMap = oMap;
        this.groupName = o.groupName;
        this.legendLabel = o.legendLabel;
        this.parentUniqueId = o.parentUniqueId;
        this.groupType = o.groupType;
        this.displayInLegend = o.displayInLegend;
        this.expandInLegend = o.expandInLegend;
        this.visible = o.visible;
        this.actuallyVisible = o.actuallyVisible;
    },
    
    show: function() {
        this.oMap.showGroup(this.uniqueId);
        this.visible = true;
    },
    
    hide: function() {
        this.oMap.hideGroup(this.uniqueId);
        this.visible = false;
    },
    
    isVisible: function() {
        return this.visible;
    }
};

var MGLAYER_POINT_TYPE = 0;
var MGLAYER_LINE_TYPE = 1;
var MGLAYER_POLYGON_TYPE = 2;
var MGLAYER_SOLID_TYPE = 3;

var MGLayer = Class.create();
MGLayer.prototype = {
    
    scaleRanges: null,
    
    oMap: null,
    
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, GxLayer.prototype, [this.uniqueId]);
        this.oMap = oMap;
        this.layerName = o.layerName;
        this.uniqueId = o.uniqueId;
        this.resourceId = o.resourceId;
        this.legendLabel = o.legendLabel;
        this.selectable = o.selectable;
        this.layerTypes = [].concat(o.layerTypes);
        this.displayInLegend = o.displayInLegend;
        this.expandInLegend = o.expandInLegend;
        this.visible = o.visible;
        this.actuallyVisible = o.actuallyVisible;
        this.editable = o.editable;
        //TODO: make this configurable
        this.themeIcon = 'images/tree_theme.png';
        this.disabledLayerIcon = 'images/tree_layer.png';
        
        this.parentGroup = o.parentGroup
        this.scaleRanges = [];
        for (var i=0; i<o.scaleRanges.length; i++) {
            var scaleRange = new MGScaleRange(o.scaleRanges[i]);
            this.scaleRanges.push(scaleRange);
        }
    },
    
    supportsType: function(type) {
        for (var i=0; i<this.layerTypes.length; i++) {
            if (this.layerTypes[i] == type) {
                return true;
            }
        }
        return false;
    },
    
    getScaleRange: function(fScale) {
        for (var i=0; i<this.scaleRanges.length; i++) {
            if (this.scaleRanges[i].contains(fScale)) {
                return this.scaleRanges[i];
            }
        }
        return null;
    },

    show: function() {
        this.oMap.showLayer(this.uniqueId);
        this.set('visible', true);
    },

    hide: function() {
        this.oMap.hideLayer(this.uniqueId);
        this.set('visible',false);
    },

    isVisible: function() {
        return this.visible;
    }
};

var MGScaleRange = Class.create();
MGScaleRange.prototype = {
    styles: null,
    initialize: function(o) {
        this.minScale = o.minScale;
        this.maxScale = o.maxScale;
        this.styles = [];
        for (var i=0; i<o.styles.length; i++) {
            var styleItem = new MGStyleItem(o.styles[i]);
            this.styles.push(styleItem);
        }
    },
    contains: function(fScale) {
        return fScale >= this.minScale && fScale <= this.maxScale;
    }
};

var MGStyleItem = Class.create();
MGStyleItem.prototype = {
    initialize: function(o) {
        this.legendLabel = o.legendLabel;
        this.filter = o.filter;
        this.geometryType = o.geometryType;
        if (this.geometryType == '') {
            this.geometryType = -1;
        }
        this.categoryIndex = o.categoryIndex;
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
