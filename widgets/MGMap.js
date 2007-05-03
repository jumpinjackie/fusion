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
var MAP_SELECTION_ON = gnLastEventId++;
var MAP_SELECTION_OFF = gnLastEventId++;
var MAP_ACTIVE_LAYER_CHANGED = gnLastEventId++;
var MAP_LOADED = gnLastEventId++;
var MAP_LOADING = gnLastEventId++;
var MAP_SESSION_CREATED = gnLastEventId++;

var MGMap = Class.create();
MGMap.prototype = {
    arch: 'mapguide',
    session: [null],
    aShowLayers: null,
    aHideLayers: null,
    aShowGroups: null,
    aHideGroups: null,
    aRefreshLayers: null,
    sActiveLayer: null,
    selectionType: 'INTERSECTS',
    bSelectionOn: false,
    oSelection: null,

    //the resource id of the current MapDefinition
    _sResourceId: null,
    
    initialize : function(oCommand, sid) {
        // console.log('MGMap.initialize');
        Object.inheritFrom(this, GxMap.prototype, [oCommand]);
        
        this.registerEventID(MAP_SELECTION_ON);
        this.registerEventID(MAP_SELECTION_OFF);
        this.registerEventID(MAP_ACTIVE_LAYER_CHANGED);
        this.registerEventID(MAP_LOADED);
        this.registerEventID(MAP_LOADING);
        this.registerEventID(MAP_SESSION_CREATED);
        
        //this.registerForEvent(SESSION_CREATED, this.historyChanged.bind(this));
        
        this._oConfigObj = Fusion.oConfigMgr;
        
        this.oSelection = null;

        this.selectionType = oCommand.jsonNode.SelectionType ? oCommand.jsonNode.SelectionType[0] : 'INTERSECTS';
        
        this.sMapResourceId = oCommand.jsonNode.ResourceId ? oCommand.jsonNode.ResourceId[0] : '';

        if (sid) {
            this.session[0] = sid;
            this.mapSessionCreated();
        } else {
            this.createSession();
        }
    },

    createSession: function() {
        if (!this.session[0]) {
            this.session[0] = this;
            var sl = Fusion.getScriptLanguage();
            var scriptURL = this.arch + '/' + sl + '/CreateSession.' + sl;
            var options = {onComplete: this.createSessionCB.bind(this)};
            Fusion.ajaxRequest(scriptURL,options);  
        }
        if (this.session[0] instanceof MGMap) {
            // console.log('register for event');
            this.session[0].registerForEvent(MAP_SESSION_CREATED, this.mapSessionCreated.bind(this));
        }
    },
    
    createSessionCB : function(r) {
        if (r.status == 200) {
            if (r.responseXML) {
                // console.log('setting session id');
                var node = new DomNode(r.responseXML);
                this.session[0] = node.getNodeText('sessionid');
                this.triggerEvent(MAP_SESSION_CREATED);
            }
        }
    },

    mapSessionCreated: function() {
        if (this.sMapResourceId != '') {
            this.loadMap(this.sMapResourceId);
        }
    },

    sessionReady: function() {
        return (typeof this.session[0] == 'string');
    },

    getSessionID: function() {
        return this.session[0];
    },
    
    loadMap: function(resourceId, options) {
        /* don't do anything if the map is already loaded? */
        if (this._sResourceId == resourceId) {
            return;
        }

        if (!this.sessionReady()) {
            this.sMapResourceId = resourceId;
            return;
        }
        
        this.triggerEvent(MAP_LOADING);
        this._addWorker();
        
        this._fScale = -1;
        this._nDpi = 96;
        
        options = options || {};
        
        this._afInitialExtents = null;
        this._afCurrentExtents = options.extents ? [].concat(options.extents) : null;
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
        var loadmapScript = this.arch + '/' + sl  + '/LoadMap.' + sl;
        
        var sessionid = this.getSessionID();
        
        var params = 'mapid='+resourceId+"&session="+sessionid;
        var options = {onSuccess: this.mapLoaded.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    
    mapLoaded: function(r, json) {
        if (json) {
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
            
            if (!this._afCurrentExtents) {
                this._afCurrentExtents = [].concat(this._afInitialExtents);
            }
            this.setExtents(this._afCurrentExtents);
            
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
        var loadmapScript = this.arch + '/' + sl  + '/LoadMap.' + sl;
        
        var sessionid = this.getSessionID();
        
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
                parent = this.layerRoot.findGroupByAttribute('uniqueId', group.parentUniqueId);
            } else {
                parent = this.layerRoot;
            }
            parent.addGroup(group);
        }

        for (var i=0; i<o.layers.length; i++) {
            var layer = new MGLayer(o.layers[i], this);
            var parent;
            if (layer.parentGroup != '') {
                parent = this.layerRoot.findGroupByAttribute('uniqueId', layer.parentGroup);
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

        var r = new MGGetVisibleMapExtent(this.getSessionID(),
                               this._sMapname, cx, cy,
                               this._fScale, null, this._nDpi, nWidth, 
                               nHeight, showLayers, hideLayers, 
                               showGroups, hideGroups, refreshLayers);
        var oBroker = Fusion.getBroker();
        oBroker.dispatchRequest(r, this._requestMapImage.bind(this));
    },

    _requestMapImage : function(r) {
        //console.log("MGMap:: _requestMapImage");
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;

        if (r.responseXML) {
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

            this._nCellSize  =  Math.max( 
                Math.abs((newExtents[2] - newExtents[0])/parseInt(nWidth)),
                Math.abs((newExtents[3] - newExtents[1])/parseInt(nHeight))
                );
        } else {
            //console.log('error');
            return;
        }

        url = Fusion.getConfigurationItem('mapguide', 'mapAgentUrl') + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + this.getSessionID() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();

        //console.log('MGURL ' + url);
        this.setMapImageURL(url);
    },
    
    hasSelection: function() { return this.bSelectionOn; },
    
    getSelectionCB : function(userFunc, r) {
        this._bSelectionIsLoading = false;
        if (r.responseXML) {
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
        this.triggerEvent(MAP_SELECTION_ON);
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
    getSelection : function(userFunc) {
        if (this.oSelection == null) {
            /* if the user wants a callback, register it
             * for when the selection becomes available
             */
            if (userFunc) {
                this.aSelectionCallbacks.push(userFunc);
            }
            if (!this._bSelectionIsLoading) {
                this._addWorker();
                this._bSelectionIsLoading = true;
                var s = this.arch + '/' + Fusion.getScriptLanguage() + "/Selection." + Fusion.getScriptLanguage() ;
                var params = {parameters:'session='+this.getSessionID()+'&mapname='+ this._sMapname, 
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
        this.triggerEvent(MAP_SELECTION_OFF);
        this.drawMap();
        this.oSelection = null;
    },

    /**
       Utility function to clear current selection
    */
    clearSelection : function() {
        var s = this.arch + '/' + Fusion.getScriptLanguage() + "/ClearSelection." + Fusion.getScriptLanguage() ;
        var params = {parameters:'session='+this.getSessionID()+'&mapname='+ this._sMapname, onComplete: this.selectionCleared.bind(this)};
        Fusion.ajaxRequest(s, params);
    },


    /**
       Call back function when slect functions are called (eg queryRect)
    */
    processQueryResults : function(r) {
        this._removeWorker();
        if (r.responseXML) {
            var oNode = new DomNode(r.responseXML);
            if (oNode.getNodeText('Selection') == 'false') {
                this.drawMap();
                return;
            } else {
                this.newSelection();
            }
        }
    },

    /**
       Do a query on the map
    */
    query : function(options) {
        this._addWorker();
        
        var geometry = options.geometry || '';
        var maxFeatures = options.maxFeatures || -1;
        var bPersistant = options.persistent || true;
        var selectionType = options.selectionType || this.selectionType;
        var filter = options.filter ? '&filter='+options.filter : '';
        var layers = options.layers || '';
        var extend = options.extendSelection ? '&extendselection=true' : '';

        var sl = Fusion.getScriptLanguage();
        var loadmapScript = this.arch + '/' + sl  + '/Query.' + sl;

        var sessionid = this.getSessionID();

        var params = 'mapname='+this._sMapname+"&session="+sessionid+'&spatialfilter='+geometry+'&maxfeatures='+maxFeatures+filter+'&layers='+layers+'&variant='+selectionType+extend;
        var options = {onSuccess: this.processQueryResults.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    showLayer: function( layer ) {
        if (this.oMapInfo && this.oMapInfo.layerEvents[layer.layerName]) {
            var layerEvent = this.oMapInfo.layerEvents[layer.layerName];
            for (var i=0; i<layerEvent.onEnable.length; i++) {
                var l = this.layerRoot.findLayer(layerEvent.onEnable[i].name);
                if (l) {
                    if (layerEvent.onEnable[i].enable) {
                        l.show();
                    } else {
                        l.hide();
                    }
                }
            }
        }
        this.aShowLayers.push(layer.uniqueId);
        this.drawMap();
    },
    hideLayer: function( layer ) {
        if (this.oMapInfo && this.oMapInfo.layerEvents[layer.layerName]) {
            var layerEvent = this.oMapInfo.layerEvents[layer.layerName];
            for (var i=0; i<layerEvent.onDisable.length; i++) {
                var l = this.layerRoot.findLayer(layerEvent.onDisable[i].name);
                if (l) {
                    if (layerEvent.onDisable[i].enable) {
                        l.show();
                    } else {
                        l.hide();
                    }
                }
            }
        }        
        this.aHideLayers.push(layer.uniqueId);
        this.drawMap();
    },
    showGroup: function( group ) {
        this.aShowGroups.push(group.uniqueId);
        this.drawMap();
    },
    hideGroup: function( group ) {
        this.aHideGroups.push(group.uniqueId);
        this.drawMap();
    },
    refreshLayer: function( layer ) {
        this.aRefreshLayers.push(layer.uniqueId);        
        this.drawMap();
    },
    setActiveLayer: function( oLayer ) {
        this.oActiveLayer = oLayer;
        this.triggerEvent(MAP_ACTIVE_LAYER_CHANGED, oLayer);
    },
    getActiveLayer: function() {
        return this.oActiveLayer;
    },

    setParameter : function(param, value) {
        if (param == 'SelectionType') {
            this.selectionType = value;
        }
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
        Object.inheritFrom(this, GxGroup.prototype, [o.groupName]);
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
        if (this.visible) {
            return;
        }
        this.oMap.showGroup(this);
        this.visible = true;
        if (this.legend && this.legend.checkBox) {
            this.legend.checkBox.checked = true;
        }
    },
    
    hide: function() {
        if (!this.visible) {
            return;
        }
        this.oMap.hideGroup(this);
        this.visible = false;
        if (this.legend && this.legend.checkBox) {
            this.legend.checkBox.checked = false;
        }
    },
    
    isVisible: function() {
        return this.visible;
    }
};

var MGLAYER_POINT_TYPE = 0;
var MGLAYER_LINE_TYPE = 1;
var MGLAYER_POLYGON_TYPE = 2;
var MGLAYER_SOLID_TYPE = 3;
var MGLAYER_RASTER_TYPE = 4;

var MGLayer = Class.create();
MGLayer.prototype = {
    
    scaleRanges: null,
    
    oMap: null,
    
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, GxLayer.prototype, [o.layerName]);
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
        this.themeIcon = 'images/legend-theme.png';
        this.disabledLayerIcon = 'images/legend-layer.png';
        
        this.parentGroup = o.parentGroup;
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
        if (this.visible) {
            return;
        }
        this.oMap.showLayer(this);
        this.set('visible', true);
        if (this.legend && this.legend.checkBox) {
            this.legend.checkBox.checked = true;
        }
    },

    hide: function() {
        if (!this.visible) {
            return;
        }
        this.oMap.hideLayer(this);
        this.set('visible',false);
        if (this.legend && this.legend.checkBox) {
            this.legend.checkBox.checked = false;
        }
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
        if (!o.styles) {
            return;
        }
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
    getLegendImageURL: function(fScale, layer, map) {
        var url = Fusion.getConfigurationItem('mapguide', 'mapAgentUrl');
        return url + "OPERATION=GETLEGENDIMAGE&SESSION=" + map.getSessionID() + "&VERSION=1.0.0&SCALE=" + fScale + "&LAYERDEFINITION=" + encodeURIComponent(layer.resourceId) + "&THEMECATEGORY=" + this.categoryIndex + "&TYPE=" + this.geometryType;
    }
};
