/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
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
 * Fusion.Maps.MapServer : MapServer map widget 
*/

Fusion.Maps.MapServer = Class.create();
Fusion.Maps.MapServer.prototype = {
    arch: 'MapServer',
    session: [null],
    aShowLayers: null,
    aHideLayers: null,
    aShowGroups: null,
    aHideGroups: null,
    aRefreshLayers: null,
    sActiveLayer: null,
    selectionType: 'INTERSECTS',
    bSelectionOn: false,
    bDisplayInLegend: true,   //TODO: set this in AppDef?
    bExpandInLegend: true,   //TODO: set this in AppDef?
    oSelection: null,
    _oCurrentExtents : null,

    //the map file
    sMapFile: null,
    
    //imagetype
    _sImageType : 'png',
    
    initialize : function(map, mapTag) {
        //console.log('Fusion.Maps.MapServer.initialize');
        Object.inheritFrom(this, Fusion.Lib.EventMgr, []);
                
        this.registerEventID(Fusion.Event.MAP_SESSION_CREATED);
        this.registerEventID(Fusion.Event.MAP_SELECTION_ON);
        this.registerEventID(Fusion.Event.MAP_SELECTION_OFF);

        this.mapWidget = map;
        this.oSelection = null;
        var extension = mapTag.extension;
        
        //this.selectionType = extension.SelectionType ? extension.SelectionType[0] : 'INTERSECTS';
        
        this.sMapFile = extension.MapFile ? extension.MapFile[0] : '';

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
        if (this.session[0] instanceof Fusion.Maps.MapServer) {
            this.session[0].registerForEvent(Fusion.Event.MAP_SESSION_CREATED, this.mapSessionCreated.bind(this));
        }
    },
    
    createSessionCB : function(r) {
        if (r.status == 200) {
            if (r.responseXML) {
                var node = new DomNode(r.responseXML);
                this.session[0] = node.getNodeText('sessionid');
                this.triggerEvent(Fusion.Event.MAP_SESSION_CREATED);
            }
        }
    },

    mapSessionCreated: function() {
        if (this.sMapFile != '') {
            this.loadMap(this.sMapFile);
        }
    },

    sessionReady: function() {
        return (typeof this.session[0] == 'string');
    },

    getSessionID: function() {
        return this.session[0];
    },
    
    loadMap: function(mapfile, options) {
        console.trace();
        
        //console.log('loadMap: ' + resourceId);
        /* don't do anything if the map is already loaded? */
        if (this._sMapFile == mapfile) {
            return;
        }

        if (!this.sessionReady()) {
            this.sMapFile = mapfile;
            return;
        }
        
        this.mapWidget.triggerEvent(Fusion.Event.MAP_LOADING);
        this.mapWidget._addWorker();
        
        this._fScale = -1;
        this._nDpi = 72;
        
        options = options || {};
        
        this._oInitialExtents = null;
        this._oCurrentExtents = options.extents ? OpenLayers.Bounds.fromArray(options.extents) : null;
        this.aVisibleLayers = options.showlayers || [];
        this.aVisibleGroups = options.showgroups || [];
        this.aLayers = [];
        
        this.oSelection = null;
        this.aSelectionCallbacks = [];
        this._bSelectionIsLoading = false;

        var sl = Fusion.getScriptLanguage();
        var loadmapScript = this.arch + '/' + sl  + '/LoadMap.' + sl;
        
        var sessionid = this.getSessionID();
        
        var params = 'mapfile='+mapfile+"&session="+sessionid;
        var options = {onSuccess: this.mapLoaded.bind(this), 
                                     parameters: params};
        Fusion.ajaxRequest(loadmapScript, options);
    },
    
    mapLoaded: function(r, json) {
        if (json)  
        { 
            var o; 
            eval('o='+r.responseText); 
            this._sMapFile = o.mapId;
            this._sMapname = o.mapName; 
            this._fMetersperunit = o.metersPerUnit; 
            this._sImageType = o.imagetype; 

            if (!this._oInitialExtents) { 
              this._oInitialExtents = OpenLayers.Bounds.fromArray(o.extent); 
            } 
            
            rootOpts = {
              displayInLegend: this.bDisplayInLegend,
              expandInLegend: this.bExpandInLegend,
              legendLabel: this._sMapname
              //TODO: set other opts for group initialization as required
            }
            this.layerRoot = new Fusion.Maps.MapServer.Group(rootOpts,this);

            this.parseMapLayersAndGroups(o);
            for (var i=0; i<this.aLayers.length; i++) {
                if (this.aLayers[i].visible) {
                    this.aVisibleLayers.push(this.aLayers[i].layerName);
                }
            }
            
            if (o.dpi) OpenLayers.DOTS_PER_INCH = o.dpi;

            var oMapOptions = {};
            if ( !this.mapWidget.getInitialExtents() ) {  //setting up the baselayer for OpenLayers
              oMapOptions.maxExtent = this._oInitialExtents;
              oMapOptions.maxResolution = 'auto';
            }

            //set projection units and code if supplied
            if (o.metersPerUnit == 1) {
              oMapOptions.units = 'm';
              //oMapOptions.projection = 'EPSG:42304';  //TBD not necessary, but can this be supplied by LoadMap?
            } else {
              //TBD need to do anything here? OL defaults to degrees
            }

            //add in scales array if supplied
            oMapOptions.maxScale = 1;     //TBD Do a better job of seetting scale ranges, 
                                          //perhaps from layer scale ranges min and max

            this.mapWidget.setMapOptions(oMapOptions);

            //create the OL layer for this Map layer
            var params = {
              layers: this.aVisibleLayers.join(' '),
              session : this.getSessionID(),
              map : this._sMapFile,
              seq : Math.random(),
              map_imagetype : this._sImageType
            };
            var url = Fusion.getConfigurationItem('mapserver', 'cgi');
            if (this.oLayerOL) {
                this.oLayerOL.destroy();
            }
            this.oLayerOL = new OpenLayers.Layer.MapServer( o.mapName, url, params, {singleTile: true} );
            this.mapWidget.addMap(this);

            if (!this._oCurrentExtents) 
            { 
                this._oCurrentExtents = this._oInitialExtents;
            } 

            this.mapWidget.setExtents(this._oCurrentExtents);
            this.mapWidget.triggerEvent(Fusion.Event.MAP_LOADED);
            
        }  
        else 
        {
            Fusion.reportError( new Fusion.Error(Fusion.Error.FATAL, 'Failed to load requested map:\n'+r.responseText));
        }
        this.mapWidget._removeWorker();
    },
    
    reloadMap: function() {
        this.mapWidget._addWorker();
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
    
    mapReloaded: function(r,json) {  /* update this with OL code */
        if (json) {
            var o;
            eval('o='+r.responseText);
            this.parseMapLayersAndGroups(o);
            this.aVisibleLayers = [];
            for (var i=0; i<this.aLayers.length; i++) {
                if (this.aLayers[i].visible) {
                    this.aVisibleLayers.push(this.aLayers[i].layerName);
                }
            }
            this.drawMap();
            this.mapWidget.triggerEvent(Fusion.Event.MAP_RELOADED);
        } else {
            Fusion.reportError( new Fusion.Error(Fusion.Error.FATAL, 'Failed to load requested map:\n'+r.responseText));
        }
        this.mapWidget._removeWorker();
    },
    
    parseMapLayersAndGroups: function(o) {
        for (var i=0; i<o.groups.length; i++) {
            var group = new Fusion.Maps.MapServer.Group(o.groups[i], this);
            var parent;
            if (group.parentUniqueId != '') {
                parent = this.layerRoot.findGroup(group.parentUniqueId);
            } else {
                parent = this.layerRoot;
            }
            parent.addGroup(group);
        }

        for (var i=0; i<o.layers.length; i++) {
            var layer = new Fusion.Maps.MapServer.Layer(o.layers[i], this);
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
        return (this._oCurrentExtents) ? true : false;
    },

    getScale : function() {
        return this.mapWidget.getScale();
    },
    
    updateLayer: function() {   //to be fleshed out, add query file to layer if selection, call this before draw
      if (this.hasSelection()) {
          this.oLayerOL.addOptions({queryfile: this._sQueryfile});
      }
    },
    
    drawMap: function() {
        if (!this._oCurrentExtents) return;

        var params = { layers: this.aVisibleLayers.join(' ') };
        if (this.hasSelection()) {
            params['queryfile']=this._sQueryfile;
        } else {
            params['queryfile'] = '';
        }
        this.oLayerOL.mergeNewParams(params);
    },
    
    showLayer: function( sLayer ) {
        this.aVisibleLayers.push(sLayer);
        this.drawMap();
    },

    hideLayer: function( sLayer ) {
        for (var i=0; i<this.aLayers.length; i++) {
            if (this.aVisibleLayers[i] == sLayer) {
                this.aVisibleLayers.splice(i,1);
                break;
            }
        }
        this.drawMap();
    },

    showGroup: function( sGroup ) {
        this.aVisibleGroups.push(sGroup);
        this.drawMap();
    },

    hideGroup: function( sGroup ) {
        for (var i=0; i<this.aVisibleGroups.length; i++) {
            if (this.aVisibleGroups[i] == sGroup) {
                this.aVisibleGroups.splice(i,1);
                break;
            }
        }        
        this.drawMap();
    },

    refreshLayer: function( sLayer ) {
        this.drawMap();
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
        this.triggerEvent(Fusion.Event.MAP_SELECTION_ON);
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
                var params = {parameters:'session='+this.getSessionID()+'&mapname='+ this._sMapname+'&queryfile='+this._sQueryfile, 
                              onComplete: this.getSelectionCB.bind(this, userFunc)};
                Fusion.ajaxRequest(s, params);
            }
        } else if (userFunc){
            userFunc(this.oSelection);
        }
    },

    /**
       Utility function to clear current selection
    */
    clearSelection : function() 
    {
        
        this.bSelectionOn = false;
        this._sQueryfile = "";
        this.triggerEvent(Fusion.Event.MAP_SELECTION_OFF);
        this.drawMap();
        this.oSelection = null;
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
                this._sQueryfile = oNode.getNodeText('QueryFile');
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
    }
};

    
Fusion.Maps.MapServer.Group = Class.create();
Fusion.Maps.MapServer.Group.prototype = {
    oMap: null,
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, Fusion.Widget.Map.Group.prototype, [this.uniqueId]);
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
        this.oMap.showGroup(this.groupName);
        this.visible = true;
    },
    
    hide: function() {
        this.oMap.hideGroup(this.groupName);
        this.visible = false;
    },
    
    isVisible: function() {
        return this.visible;
    }
};

var MSLAYER_POINT_TYPE = 0;
var MSLAYER_LINE_TYPE = 1;
var MSLAYER_POLYGON_TYPE = 2;
var MSLAYER_SOLID_TYPE = 3;
var MSLAYER_RASTER_TYPE = 4;

Fusion.Maps.MapServer.Layer = Class.create();
Fusion.Maps.MapServer.Layer.prototype = {
    
    scaleRanges: null,
    
    oMap: null,
    
    initialize: function(o, oMap) {
        this.uniqueId = o.uniqueId;
        Object.inheritFrom(this, Fusion.Widget.Map.Layer.prototype, [this.uniqueId]);
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
            var scaleRange = new Fusion.Maps.MapServer.ScaleRange(o.scaleRanges[i]);
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
        this.oMap.showLayer(this.layerName);
        this.set('visible', true);
    },

    hide: function() {
        this.oMap.hideLayer(this.layerName);
        this.set('visible',false);
    },

    isVisible: function() {
        return this.visible;
    }
};

Fusion.Maps.MapServer.ScaleRange = Class.create();
Fusion.Maps.MapServer.ScaleRange.prototype = {
    styles: null,
    initialize: function(o) {
        this.minScale = o.minScale;
        this.maxScale = o.maxScale;
        this.styles = [];
        if (!o.styles) {
            return;
        }
        for (var i=0; i<o.styles.length; i++) {
            var styleItem = new Fusion.Maps.MapServer.StyleItem(o.styles[i]);
            this.styles.push(styleItem);
        }
    },
    contains: function(fScale) {
        return fScale >= this.minScale && fScale <= this.maxScale;
    }
};

Fusion.Maps.MapServer.StyleItem = Class.create();
Fusion.Maps.MapServer.StyleItem.prototype = {
    initialize: function(o) {
        this.legendLabel = o.legendLabel;
        this.filter = o.filter;
        this.index = o.index;
    },
    getLegendImageURL: function(fScale, layer) {
        var sl = Fusion.getScriptLanguage();
        var url = Fusion.getFusionURL() + '/' + layer.oMap.arch + '/' + sl  + '/LegendIcon.' + sl;
        var sessionid = layer.oMap.getSessionID();
        var params = 'mapname='+layer.oMap._sMapname+"&session="+sessionid + '&layername='+layer.resourceId + '&classindex='+this.index;
        return url + '?'+params;
    }
};
