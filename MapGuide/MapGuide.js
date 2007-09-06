/********************************************************************** * 
 * @project Fusion
 * @purpose this file contains the map widget
 * @author yassefa@dmsolutions.ca
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
 ********************************************************************
 *
 * extended description
 * **********************************************************************/

/**
 * MapGuide : MapGuide map widget 
*/

Fusion.Maps.MapGuide = Class.create();
Fusion.Maps.MapGuide.prototype = {
    arch: 'MapGuide',
    session: [null],
    bSingleTile: null,
    aShowLayers: null,
    aHideLayers: null,
    aShowGroups: null,
    aHideGroups: null,
    aRefreshLayers: null,
    sActiveLayer: null,
    selectionType: 'INTERSECTS',
    bSelectionOn: false,
    oSelection: null,
    bDisplayInLegend: true,   //TODO: set this in AppDef?
    bExpandInLegend: true,   //TODO: set this in AppDef?

    //the resource id of the current MapDefinition
    _sResourceId: null,
    
    initialize : function(map, mapTag) {
        // console.log('MapGuide.initialize');
        Object.inheritFrom(this, Fusion.Lib.EventMgr, []);
                
        this.registerEventID(Fusion.Event.MAP_SESSION_CREATED);

        this.mapWidget = map;
        this.oSelection = null;

        var extension = mapTag.extension; //TBD: this belongs in layer tag?
        this.selectionType = extension.SelectionType ? extension.SelectionType[0] : 'INTERSECTS';
        
        this.sMapResourceId = mapTag.resourceId ? mapTag.resourceId : '';

        this.bSingleTile = mapTag.singleTile;

        if (mapTag.sid) {
            this.session[0] = mapTag.sid;
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
        if (this.session[0] instanceof Fusion.Maps.MapGuide) {
            // console.log('register for event');
            this.session[0].registerForEvent(Fusion.Event.MAP_SESSION_CREATED, this.mapSessionCreated.bind(this));
        }
    },
    
    createSessionCB : function(r) {
        if (r.status == 200) {
            if (r.responseXML) {
                // console.log('setting session id');
                var node = new DomNode(r.responseXML);
                if ( node.findFirstNode('Exception') ) {
                  alert("Error creating MapGuide session:" + r.responseText);
                } else {
                  this.session[0] = node.getNodeText('sessionid');
                  this.triggerEvent(Fusion.Event.MAP_SESSION_CREATED);
                }
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
        
        this.mapWidget.triggerEvent(Fusion.Event.MAP_LOADING);
        this.mapWidget._addWorker();
        
        this._fScale = -1;
        this._nDpi = 96;
        
        options = options || {};
        
        this._oInitialExtents = null;
        this._oCurrentExtents = options.extents ? OpenLayers.Bounds.fromArray(options.extents) : null;
        this.aShowLayers = options.showlayers || [];
        this.aHideLayers = options.hidelayers || [];
        this.aShowGroups = options.showgroups || [];
        this.aHideGroups = options.hidegroups || [];
        this.aRefreshLayers = options.refreshlayers || [];
        this.aLayers = [];
        this.layerRoot = new Fusion.Widget.Map.Group();
        this.layerRoot.displayInLegend = this.bDisplayInLegend;
        this.layerRoot.expandInLegend = this.bExpandInLegend;
        
        this.oSelection = null;
        this.aSelectionCallbacks = [];
        this._bSelectionIsLoading = false;

        var sl = Fusion.getScriptLanguage();
        var loadmapScript = this.arch + '/' + sl  + '/LoadMap.' + sl;
        
        var sessionid = this.getSessionID();
        
        var params = 'mapid='+resourceId+"&session="+sessionid;
        var options = {onSuccess: this.mapLoaded.bind(this), parameters:params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    
    mapLoaded: function(r, json) {
        if (json) {
            var o;
            eval('o='+r.responseText);
            this._sResourceId = o.mapId;
            this._sMapname = o.mapName;
            this._fMetersperunit = o.metersPerUnit;

            if (!this._oInitialExtents) {
                this._oInitialExtents = OpenLayers.Bounds.fromArray(o.extent);
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
            
            //TODO: get this from the layerTag.extension
            //this.oMapInfo = Fusion.oConfigMgr.getMapInfo(this._sResourceId);

            var oMapOptions = {};
            if ( !this.mapWidget.getInitialExtents() ) {  //setting up the baselayer for OpenLayers
              oMapOptions.maxExtent = this._oInitialExtents
            }

            //set projection units and code if supplied
            if (o.metersPerUnit == 1) {
              oMapOptions.units = 'm';
              //oMapOptions.projection = 'EPSG:42304';  //TBD not necessary, but can this be supplied by LoadMap?
            } else {
              //TBD need to do anything here? OL defaults to degrees
            }

            //add in scales array if supplied
            if (o.FiniteDisplayScales && o.FiniteDisplayScales.length>0) {
              oMapOptions.scales = o.FiniteDisplayScales;
            } else {
              oMapOptions.maxScale = 1;     //TODO: Get these values form the Map info
            }
            this.mapWidget.setMapOptions(oMapOptions);  //TODO: only do this for BaseLayers

            if (!this.bSingleTile) {
              if (o.groups.length >0) {
                this.bSingleTile = false;
              } else {
                this.bSingleTile = true;
              }
            }

            //create the OL layer for this Map layer
            var params = {};
            var options = {};
            if ( this.bSingleTile ) {
              params = {        //single tile params
                session : this.getSessionID(),
                mapname : this._sMapname,
              };
              options = {
                singleTile: true,   
                showLayers : this.aShowLayers.length > 0 ? this.aShowLayers.toString() : null,
                hideLayers : this.aHideLayers.length > 0 ? this.aHideLayers.toString() : null,
                showGroups : this.aShowGroups.length > 0 ? this.aShowGroups.toString() : null,
                hideGroups : this.aHideGroups.length > 0 ? this.aHideGroups.toString() : null,
                refreshLayers : this.aRefreshLayers.length > 0 ? this.aRefreshLayers.toString() : null
              }

            } else {
              params = {      //tiled version
                mapdefinition: this._sResourceId,
                basemaplayergroupname: o.groups[0].groupName  //assumes only one group for now
              };
              options = {
                singleTile: false,   
              }
            }
            var url = Fusion.getConfigurationItem('mapguide', 'mapAgentUrl');
            this.oLayerOL = new OpenLayers.Layer.MapGuide( "MapGuide OS layer", url, params, options );
            this.mapWidget.addMap(this);

            if (!this._oCurrentExtents) {
                this._oCurrentExtents = this._oInitialExtents;
            }
            this.mapWidget.setExtents(this._oCurrentExtents);
            
            //this._calculateScale();
            this.mapWidget.triggerEvent(Fusion.Event.MAP_LOADED);
        } else {
            //TBD: something funky going on with Fusion.Error object
            //Fusion.reportError( new Fusion.Error(Fusion.Error.FATAL, 'Failed to load requested map:\n'+r.responseText));
            alert( 'Failed to load requested map:\n'+r.responseText );
        }
        this.mapWidget._removeWorker();
    },

//TBD: this function not yet converted for OL    
    reloadMap: function() {
        
        this.mapWidget._addWorker();
        //console.log('loadMap: ' + resourceId);
        this.aShowLayers = [];
        this.aHideLayers = [];
        this.aShowGroups = [];
        this.aHideGroups = [];
        this.aRefreshLayers = [];
        this.layerRoot = new Fusion.Widget.Map.Group();
        this.layerRoot.displayInLegend = this.bDisplayInLegend;
        this.layerRoot.expandInLegend = this.bExpandInLegend;
        this.aLayers = [];
        
        var sl = Fusion.getScriptLanguage();
        var loadmapScript = this.arch + '/' + sl  + '/LoadMap.' + sl;
        
        var sessionid = this.getSessionID();
        
        var params = 'mapname='+this._sMapname+"&session="+sessionid;
        var options = {onSuccess: this.mapReloaded.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },

//TBD: this function not yet converted for OL    
    mapReloaded: function(r,json) {
        if (json) {
            var o;
            eval('o='+r.responseText);
            this.parseMapLayersAndGroups(o);
            this.mapWidget.triggerEvent(Fusion.Event.MAP_RELOADED);
        } else {
            Fusion.reportError( new Fusion.Error(Fusion.Error.FATAL, 'Failed to load requested map:\n'+r.responseText));
        }
        this.mapWidget._removeWorker();
    },
    
    parseMapLayersAndGroups: function(o) {
        for (var i=0; i<o.groups.length; i++) {
            var group = new Fusion.Maps.MapGuide.Group(o.groups[i], this);
            var parent;
            if (group.parentUniqueId != '') {
                parent = this.layerRoot.findGroupByAttribute('uniqueId', group.parentUniqueId);
            } else {
                parent = this.layerRoot;
            }
            parent.addGroup(group);
        }

        for (var i=0; i<o.layers.length; i++) {
            var layer = new Fusion.Maps.MapGuide.Layer(o.layers[i], this);
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
    
    drawMap: function() {
        if (!this._oCurrentExtents) return;
        
        var options = {
          showLayers : this.aShowLayers.length > 0 ? this.aShowLayers.toString() : null,
          hideLayers : this.aHideLayers.length > 0 ? this.aHideLayers.toString() : null,
          showGroups : this.aShowGroups.length > 0 ? this.aShowGroups.toString() : null,
          hideGroups : this.aHideGroups.length > 0 ? this.aHideGroups.toString() : null,
          refreshLayers : this.aRefreshLayers.length > 0 ? this.aRefreshLayers.toString() : null
        }
        this.aShowLayers = [];
        this.aHideLayers = [];
        this.aShowGroups = [];
        this.aHideGroups = [];
        this.aRefreshLayers = [];

        this.oLayerOL.addOptions(options);
        this.oLayerOL.redraw();
    },

    
    hasSelection: function() { return this.bSelectionOn; },
    
    getSelectionCB : function(userFunc, r) {
        this._bSelectionIsLoading = false;
        if (r.responseXML) {
            this.oSelection = new GxSelectionObject(r.responseXML);
            for (var i=0; i<this.aSelectionCallbacks.length; i++) {
                this.aSelectionCallbacks[i](this.oSelection);
            }
            this.aSelectionCallbacks = [];

        }       
        this.mapWidget._removeWorker();
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
        this.mapWidget.triggerEvent(Fusion.Event.MAP_SELECTION_ON);
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
                this.mapWidget._addWorker();
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
        this.mapWidget.triggerEvent(Fusion.Event.MAP_SELECTION_OFF);
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
        this.mapWidget._removeWorker();
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
        this.mapWidget._addWorker();
        
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
        this.mapWidget.triggerEvent(Fusion.Event.MAP_ACTIVE_LAYER_CHANGED, oLayer);
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
    
Fusion.Maps.MapGuide.Group = Class.create();
Fusion.Maps.MapGuide.Group.prototype = {
    oMap: null,
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, Fusion.Widget.Map.Group.prototype, [o.groupName]);
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

Fusion.Maps.MapGuide.Layer = Class.create();
Fusion.Maps.MapGuide.Layer.prototype = {
    
    scaleRanges: null,
    
    oMap: null,
    
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, Fusion.Widget.Map.Layer.prototype, [o.layerName]);
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
            var scaleRange = new Fusion.Maps.MapGuide.ScaleRange(o.scaleRanges[i]);
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

Fusion.Maps.MapGuide.ScaleRange = Class.create();
Fusion.Maps.MapGuide.ScaleRange.prototype = {
    styles: null,
    initialize: function(o) {
        this.minScale = o.minScale;
        this.maxScale = o.maxScale;
        this.styles = [];
        if (!o.styles) {
            return;
        }
        for (var i=0; i<o.styles.length; i++) {
            var styleItem = new Fusion.Maps.MapGuide.StyleItem(o.styles[i]);
            this.styles.push(styleItem);
        }
    },
    contains: function(fScale) {
        return fScale >= this.minScale && fScale <= this.maxScale;
    }
};

Fusion.Maps.MapGuide.StyleItem = Class.create();
Fusion.Maps.MapGuide.StyleItem.prototype = {
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
    getLegendImageURL: function(fScale, layer) {
        var url = Fusion.getConfigurationItem('mapguide', 'mapAgentUrl');
        return url + "OPERATION=GETLEGENDIMAGE&SESSION=" + layer.oMap.getSessionID() + "&VERSION=1.0.0&SCALE=" + fScale + "&LAYERDEFINITION=" + encodeURIComponent(layer.resourceId) + "&THEMECATEGORY=" + this.categoryIndex + "&TYPE=" + this.geometryType;
    }
};
