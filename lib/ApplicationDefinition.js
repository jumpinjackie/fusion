/*****************************************************************************
 * $Id: $
 * Purpose: ApplicationDefinition Parser
 * Project: Fusion
 * Author: DM Solutions Group Inc 
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
 *****************************************************************************/

/**
 * ApplicationDefinition
 *
 * Utility class to parse an application definition
 *
 */
Fusion.Lib.ApplicationDefinition = Class.create();
Fusion.Lib.ApplicationDefinition.prototype = {
    /**
     * Property: maps
     * 
     * array of map references, parsed from ApplicationDefinition
     */
    maps: null,
    
    /**
     * Property: widgetSets
     *
     * array of widget sets (each one corresponding to a map) parsed
     * from the ApplicationDefinition.
     */
    widgetSets: null,
    
    /**
     * Property: {Object} oBroker
     *
     * A Broker object that can communicate with a MapGuide instance
     * in the case we are running against a MapGuide server
     */
    oBroker: null,
    
    /**
     * Property: {Array} searchDefinitions
     *
     * An array of search definitions
     */
    searchDefinitions: null,
    
    /**
     * Property: {Array} searchCategories
     *
     * An array of search categories
     */
    searchCategories: null,
    
    /**
     * Constructor: ApplicationDefinition
     *
     * construct a new instance of the ApplicationDefinition object.  While
     * not enforced, this is intended to be a singleton.
     *
     * Parameter: sessionId
     *
     * an optional session id to initialize the application with, passed to
     * the map widgets when they are created.
     */
     
    initialize: function(sessionId) {   
        //console.log('ApplicationDefinition initialize');
        Fusion.Lib.EventMgr.initialize.apply(this, []);
        this.sessionId = sessionId;
        this.oBroker = Fusion.getBroker();
        this.applicationDefinition =  Fusion.getApplicationDefinitionURL();
        
        this.widgetSets = [];
        this.maps = [];
        this.searchDefinitions = [];
        this.searchCategories = [];
        this.parse();
    },

    /**
     * Function: parse
     *
     * start parsing the ApplicationDefinition file.  This happens
     * asynchronously since the ApplicationDefinition has to be
     * retrieved from the server or the MapGuide repository.  When
     * parsing is complete, an APPLICATIONDEFINITION_PARSED event
     * will be emitted.  This function returns true if parsing
     * will start, false if it will not (due to a missing
     * application definition for instance).
     */
    parse : function() {
        if (this.applicationDefinition == '') {
            //TODO: emit an error
            return null;
        }
        /* if the application definition is not in the mapguide server, 
           just load the xml*/
        
        if (this.applicationDefinition.match('Library://') == null) {
            var options = {};
            options.method = 'get';
            options.onSuccess = this.convertXML.bind(this);
            new Ajax.Request( this.applicationDefinition, options);
        } else {
            //TODO: request as JSON format
            var r = new Fusion.Lib.MGRequest.MGGetResourceContent(this.applicationDefinition);
            this.oBroker.dispatchRequest(r, this.parseJSON.bind(this));
        }
        return true;
    },
    
    /**
     * Function: convertXML
     *
     * Optionally convert XML to JSON using a server-side script
     * if the application definition wasn't available in JSON.
     *
     * Parameter: {XmlHttpRequest} r
     *
     * the XmlHttpRequest object
     *
     * Parameter: json
     *
     * boolean indicator if the content is JSON or not.
     */
    convertXML: function(r, json) {
        if (json) {
            this.parseJSON(r, json);
        } else {
            var options = {};
            options.onSuccess = this.parseJSON.bind(this);
            options.parameters = 'xml='+encodeURIComponent(r.responseText.replace(/\\/g, '\\\\\\\\'))+'&ts='+((new Date()).getTime());
            var sl = Fusion.getScriptLanguage();
            Fusion.ajaxRequest('common/'+sl+'/Xml2JSON.'+sl, options);
        }
    },
    
    /**
     * Function: parseJSON
     *
     * parse a JSON string into an ApplicationDefinition
     *
     * Parameter: {XmlHttpRequest} r
     *
     * the XmlHttpRequest object
     *
     * Parameter: json
     *
     * boolean indicator if the content is JSON or not.
     */
     parseJSON: function(r, json) {
        if (json) {
            var mainNode;
            eval("mainNode="+r.responseText);
            
            var appDef = mainNode.ApplicationDefinition;
            /* process Map nodes */
            if (appDef.MapSet) {
                var mapSet = appDef.MapSet[0];
                if (mapSet.Map instanceof Array) {
                    for (var i=0; i<mapSet.Map.length; i++) {
                        var map = new Fusion.Lib.ApplicationDefinition.Map(mapSet.Map[i]);
                        this.maps.push(map);
                    }
                }
            }
            
            /* process widget sets */
            if (appDef.WidgetSet) {
                for (var i=0; i<appDef.WidgetSet.length; i++) {
                    var widgetSet = new Fusion.Lib.ApplicationDefinition.WidgetSet(appDef.WidgetSet[i]);
                    this.widgetSets.push(widgetSet);
                }
            } else {
                //TODO: would this be an error?
            }
            
            /* process extensions */
            if (appDef.Extension) {
                var extension = appDef.Extension[0];
                /* process search definitions */
                if (extension.SearchDefinitions instanceof Array) {
                    var categories = extension.SearchDefinitions[0];
                    if (categories.SearchCategory instanceof Array) {
                        for (var i=0; i<categories.SearchCategory.length; i++) {
                            var oCategory = {};
                            var category = categories.SearchCategory[i];
                            oCategory.id = category['@id'];
                            oCategory.name = category['@name'];
                            oCategory.layer = category.Layer ? category.Layer[0] : '';
                            oCategory.searchDefinitions = [];
                            this.searchCategories[oCategory.id] = oCategory;
                            var defns = category.SearchDefinition;
                            for (var k=0; k<defns.length; k++) {
                                var defn = new Fusion.Lib.ApplicationDefinition.SearchDefinition(defns[k]);
                                defn.category = oCategory;
                                oCategory.searchDefinitions[defn.id] = defn;
                                this.searchDefinitions[defn.id] = defn;
                            }
                        }
                    }
                }
                
            }
        }
        Fusion.setLoadState(Fusion.LOAD_WIDGETS);
    },
    
    /**
     * Function: create
     *
     * Create the application definition.  This actually triggers initializing
     * every widget and container.
     */
    create: function() {
        for (var i=0; i<this.widgetSets.length; i++) {
            this.widgetSets[i].create(this);
        }
    },
    
    /**
     * Function: getMapByName
     *
     * return a map widget with the given name
     *
     * Parameter: {String} name
     *
     * The map name to return
     *
     * Returns: {Object} a map object or null if not found.
     */
    getMapByName : function(name) {
        var map = null;
        for (var i=0; i<this.widgetSets.length; i++) {
            map = this.widgetSets[i].getMapByName(name);
            if (map) {
                break;
            }
        }
        return map;
    },
    
    /**
     * Function: getMapByIndice
     *
     * return the map widget at the given index
     *
     * Parameter: {String} indice
     *
     * The map indice to return
     *
     * Returns: {Object} a map object or null if not found.
     */
     getMapByIndice : function(indice) {
         var map = null;
         if (this.widgetSets.length < indice) {
             map = this.widgetSets[indice].getMap();
         }
         return map;
     },
     
     /**
      * Function getWidgetsByType
      *
      * returns an array of widgets by type.
      *
      * Parameter: {String} type
      *
      * the type of widget to get references to
      *
      * Returns: {Array} an array of widgets, which may be empty
      */
     getWidgetsByType: function(type) {
         var widgets = [];
         for (var i=0; i<this.widgetSets.length; i++) {
             widgets = widgets.concat(this.widgetSets[i].getWidgetsByType(type));
         }
         return widgets;
     }
};

Fusion.Lib.ApplicationDefinition.Map = Class.create();
Fusion.Lib.ApplicationDefinition.Map.prototype = {
    initialView: null,
    layers: null,
    
    initialize: function(jsonNode) {
        this.mapId = jsonNode['@id'][0];
        this.layers = [];
        /* parse InitialView */
        if (jsonNode.InitialView) {
            var iv = jsonNode.InitialView[0];
            if (iv.CenterX && iv.CenterY && iv.Scale) {
                this.setInitialView(parseFloat(iv.CenterX[0]),
                                    parseFloat(iv.CenterY[0]),
                                    parseFloat(iv.Scale[0]));
            } else {
                //TODO: emit warning that the initial view was incomplete
            }
        }
        /* parse layers */
        if (jsonNode.Layer instanceof Array) {
            for (var i=0; i<jsonNode.Layer.length; i++) {
                var l = new Fusion.Lib.ApplicationDefinition.Layer(jsonNode.Layer[i]);
                this.layers.push(l);
            }
        } else {
            //TODO: do we need a warning that there are no layers in this map?
        }
        this.links = {groups:[], layers:[]};
        this.layerEvents = {};
        if (jsonNode.Extension) {
            var extension = jsonNode.Extension[0];
            if (extension.Links) {
                /* process Groups */
                if (extension.Links[0].Group instanceof Array) {
                    for (var j=0; j<extension.Links[0].Group.length; j++) {
                        var group = extension.Links[0].Group[j];
                        this.links.groups.push({name:group.Name,url:group.Url});
                    }
                }
                if (extension.Links[0].Layer instanceof Array) {
                    for (var j=0; j<extension.Links[0].Layer.length; j++) {
                        var layer = extension.Links[0].Layer[j];
                        this.links.layers.push({name:layer.Name,url:layer.Url});
                    }
                }
            }
            /* process layer events */
            if (extension.LayerEvents) {
                if (extension.LayerEvents[0].Layer instanceof Array) {
                    for (var j=0; j<extension.LayerEvents[0].Layer.length; j++) {
                        var layer = extension.LayerEvents[0].Layer[j];
                        var layerObj = {};
                        layerObj.name = layer.Name[0];
                        layerObj.onEnable = [];
                        layerObj.onDisable = [];
                        
                        if (layer.OnEnable instanceof Array) {
                            for (var k=0; k<layer.OnEnable[0].Layer.length; k++) {
                                var kLayer = layer.OnEnable[0].Layer[k];
                                layerObj.onEnable.push({name:kLayer.Name[0], enable: kLayer.Enable[0] == 'true' ? true : false});
                            }
                        }
                        if (layer.OnDisable instanceof Array) {
                            for (var k=0; k<layer.OnDisable[0].Layer.length; k++) {
                                var kLayer = layer.OnDisable[0].Layer[k];
                                layerObj.onDisable.push({name:kLayer.Name[0], enable: kLayer.Enable[0] == 'true' ? true : false});
                            }
                        }
                        this.layerEvents[layerObj.name] = layerObj;
                    }
                }
            }
        } else {
            this.extension = {};
        }
        
    },
    
    getInitialView: function() {
        return this.initialView;
    },
    
    setInitialView: function(x,y,scale) {
        this.initialView = {x:x, y:y, scale:scale};
    }
};

Fusion.Lib.ApplicationDefinition.Layer = Class.create();
Fusion.Lib.ApplicationDefinition.Layer.prototype = {
    type: null,
    singleTile: true,
    extension: null,
    location: 'widgets/',
    initialize: function(jsonNode) {
        /* TODO: type can be any supported OpenLayers type */
        this.type = jsonNode.Type[0];
        this.resourceId = jsonNode.ResourceId[0];
        if (jsonNode.SingleTile) {
            var b = jsonNode.SingleTile[0].toLowerCase();
            this.singleTile = new Boolean(b);
        }
        if (jsonNode.Extension) {
            this.extension = jsonNode.Extension[0];
        } else {
            this.extension = {};
        }
        switch (this.type) {
          case 'MapGuide': this.layerClass = 'MGMap'; break;
          case 'MapServer': this.layerClass = 'MSMap'; break;
          default: alert("layer class not found for: "+this.class);   //TBD: better error reporting
        }
        Fusion.require(this.location + this.layerClass + '.js');
    }
};

Fusion.Lib.ApplicationDefinition.WidgetSet = Class.create();
Fusion.Lib.ApplicationDefinition.WidgetSet.prototype = {
    containers: null,
    widgetTags: null,
    widgetInstances: null,
    mapWidget: null,
    mapType: null,
    mapId: null,
    initialize: function(jsonNode) {
        this.containers = [];
        this.widgetTags = [];
        this.widgetInstances = [];
        /* process widgets */
        if (jsonNode.Widget) {
            for (var i=0; i<jsonNode.Widget.length; i++) {
                var widget = new Fusion.Lib.ApplicationDefinition.Widget(jsonNode.Widget[i]);
                if (widget.type == 'Map') {
                    this.mapWidgetTag = widget;
                } else {
                    this.widgetTags.push(widget);
                }
            }
        }
        /* process containers */
        if (jsonNode.Container) {
            for (var i=0; i<jsonNode.Container.length; i++) {
                var container = new Fusion.Lib.ApplicationDefinition.Container(jsonNode.Container[i]);
                this.containers.push(container);
            }
        }
        
    },
    
    /**
     * Function: addWidgetInstance
     *
     * keep track of live widgets created in this widgetSet
     *
     * Parameter: {<Fusion.Widget>} widget
     *
     * the widget to add
     */
    addWidgetInstance: function(widget) {
        this.widgetInstances.push(widget);
    },
    
    /**
     * Function: getMap
     *
     * return the map widget for this widget set
     *
     * Returns: {<Fusion.Lib.Map>} a map widget or null
     */
    getMap: function() {
        return this.mapWidget;
    },
    
    /**
     * Function: create
     *
     * create all the things required by this widgetSet, including
     * containers and widgets.
     *
     * Parameter: {<Fusion.Lib.ApplicationDefinition>} 
     *
     * the application definition that this widgetSet is part of
     */
    create: function(appDef) {
        var sId = appDef.sessionId ? ',"'+appDef.sessionId+'"': '';
        //eval("this.mapWidget = new Fusion.Widget."+this.mapWidgetTag.type+"(this.mapWidgetTag"+sId+")");

        //find the map definition for the map requested
        var mapDef = null;
        for (var i=0; i<appDef.maps.length; ++i) {
          if (this.mapWidgetTag.extension.MapId[0] == appDef.maps[i].mapId) {
            mapDef = appDef.maps[i];
            break;
          }
        }
        
        for (var i=0; i<mapDef.layers.length; ++i) {
          var layerTag = mapDef.layers[i];
          layerTag.mapWidgetTag = this.mapWidgetTag;
          var mapLayer = eval("new Fusion.Widget."+layerTag.layerClass+"(layerTag"+sId+")");
        }

        for (var i=0; i<this.widgetTags.length; i++) {
            this.widgetTags[i].create(this);
        }
        for (var i=0; i<this.containers.length; i++) {
            this.containers[i].create(this);
        }
    },
    /**
     * Function: getMapByName
     *
     * return the map widget from this widget set if the map's name
     * matches the requested name, or null.
     *
     * Parameter: {String} name
     *
     * The map name to check
     *
     * Returns: {Object} a map object or null.
     */
    getMapByName : function(name) {
        var map = null;
        if (this.mapWidget.getMapName() == name) {
            map = this.mapWidget;
        }
        return map;
    },
    
    /**
     * Function getWidgetsByType
     *
     * returns an array of widgets by type.
     *
     * Parameter: {String} type
     *
     * the type of widget to get references to
     *
     * Returns: {Array} an array of widgets, which may be empty
     */
    getWidgetsByType: function(type) {
        var widgets = [];
        for (var i=0; i<this.widgets.length; i++) {
            if (this.widgetInstances[i].sName == type) {
                widgets.push(this.widgetInstances[i]);
            }
        }
        return widgets;
    }
};

Fusion.Lib.ApplicationDefinition.Container = Class.create();
Fusion.Lib.ApplicationDefinition.Container.prototype = {
    name: null,
    type: null,
    validPositions: ['top', 'left', 'bottom', 'right'],
    position: 'top',
    items: null,
    initialize: function(jsonNode) {
        this.type = jsonNode.Type[0];
        this.name = jsonNode.Name[0];
        var position = jsonNode.Position ? jsonNode.Position[0].toLowerCase() : this.position;
        for (var i=0; i<this.validPositions.length; i++) {
            if (this.validPositions[i] == position) {
                this.position = position;
                break;
            }
        }
        this.items = [];
        if (jsonNode.Item) {
            for (var i=0; i<jsonNode.Item.length; i++) {
                var item = new Fusion.Lib.ApplicationDefinition.Item(jsonNode.Item[i]);
                this.items.push(item);
            }
        } else {
            //TODO: is this a problem if there are no items?
        }
    },
    
    create: function(widgetSet) {
        var container;
        if (this.type == 'Toolbar' || this.type == 'Statusbar') {
            container = new Jx.Toolbar(this.name, this.position);
        } else if (this.type == 'ContextMenu') {
            container = new Jx.ContextMenu();
        }
        for (var i=0; i<this.items.length; i++) {
            this.items[i].create(widgetSet, container);
        }
    }
    
};

Fusion.Lib.ApplicationDefinition.Widget = Class.create();
Fusion.Lib.ApplicationDefinition.Widget.prototype = {
    name: null,
    type: null,
    description: null,
    location: null,
    imageUrl: null,
    imageClass: null,
    tooltip: null,
    label: null,
    disabled: null,
    extension: null,
    initialize: function(jsonNode) {
        if (jsonNode) {
            this.type = jsonNode.Type[0];
            this.name = jsonNode.Name[0];
            this.description = jsonNode.Description ? jsonNode.Description[0] : '';
            //TODO: this may be an extension
            this.location = jsonNode.Location ? jsonNode.Location[0] : 'widgets/';
            this.imageUrl = jsonNode.ImageUrl ? jsonNode.ImageUrl[0] : '';
            this.imageClass = jsonNode.ImageClass ? jsonNode.ImageClass[0] : '';
            this.tooltip = jsonNode.Tooltip ? jsonNode.Tooltip[0] : '';
            this.label = jsonNode.Label ? jsonNode.Label[0] : '';
            this.disabled = jsonNode.Disabled ? (jsonNode.Disabled[0].toLowerCase() == 'true' ? true : false) : false;
            
            console.log('Widget: ' + this.type + ', ' + this.name + ', ' + this.description);
        
            if (jsonNode.Extension) {
                this.extension = jsonNode.Extension[0];
            } else {
                this.extension = {};
            }
            //require the widget code
            //TODO: remove the need for this check
            if (this.type != 'Map') {
              Fusion.require(this.location + this.type + '.js');
            }
        }
    },
    
    getMap: function() {
        if (this.widgetSet) {
            return this.widgetSet.getMap();
        } else {
            return null;
        }
    },
    
    /**
     * Function: create
     *
     * creates a new instance of the widget, optionally using a
     * different name during instantiation to accomodate
     * containers
     *
     * Parameter: name
     *
     * An optional name to use for the widget, overrides the
     * original name temporarily if passed.
     *
     * Returns: an instance of the widget represented by this
     * object.
     */
    create: function(widgetSet, name) {
        this.widgetSet = widgetSet;
        var oldName = this.name;
        this.name = name || this.name;
        var widget = eval("new Fusion.Widget."+this.type+"(this)");
        widgetSet.addWidgetInstance(widget);
        if ($(name)) {
            $(name).widget = widget;
        }
        
        this.name = oldName;
        return widget;
    }
};

Fusion.Lib.ApplicationDefinition.Item = Class.create();
Fusion.Lib.ApplicationDefinition.Item.prototype = {
    uniqueId: [0],
    type: null,
    initialize: function(jsonNode) {
        this.type = jsonNode.Function[0];
        switch(this.type) {
            case 'Widget':
                this.widgetName = jsonNode.Widget[0];
                break;
            case 'Flyout':
                this.flyout = new Fusion.Lib.ApplicationDefinition.Flyout(jsonNode);
                break;
            case 'Separator':   
                break;
        }
    },
    
    create: function(widgetSet, container) {
        switch(this.type) {
            case 'Widget':
                var widget = widgetSet.getWidgetByName(this.widgetName);
                if (widget) {
                    if (container instanceof Jx.Toolbar) {
                        /* create a button for the widget */
                        var name = 'FusionItem'+this.uniqueId[0];
                        this.uniqueId[0]++;
                        var tbItem = new Jx.ToolbarItem();
                        tbItem.domObj.id = name;
                        container.add(tbItem);
                        widget.create(widgetSet, name);
                    } else if (container instanceof Jx.Menu) {
                        var action = new Jx.Action(widget.activateTool.bind(widget));
                        var opt = {};
                        opt.label = widget._oCommand.sLabel;
                        opt.image = widget._oCommand.sImageurl;
                        var menuItem = new Jx.MenuItem(action, opt);
                        container.add(menuItem);
                    }
                }
                break;
            case 'Flyout':
                /* create a menu */
                var menu;
                var opt = {};
                opt.label = this.flyout.label;
                opt.tooltip = this.flyout.tooltip;
                opt.image = this.flyout.image;
                opt.imageClass = this.flyout.imageClass;
                if (container instanceof Jx.Toolbar) {
                    menu = new Jx.Menu(opt);
                } else if (container instanceof Jx.Menu) {
                    menu = new Jx.SubMenu(opt);
                }
                container.add(menu);
                this.flyout.create(widgetSet, menu);
                
                break;
            case 'Separator':
                if (container instanceof Jx.Toolbar) {
                    container.add(new Jx.ToolbarSeparator());
                } else if (container instanceof( Jx.Menu) || 
                           container instanceof(Jx.SubMenu)) {
                    container.add(new Jx.MenuSeparator());
                }
                break;
        }
    }
};

Fusion.Lib.ApplicationDefinition.Flyout = Class.create();
Fusion.Lib.ApplicationDefinition.Flyout.prototype = {
    label: null,
    tooltip: null,
    description: null,
    imageUrl: null,
    items: null,
    
    initialize: function(jsonNode) {
        this.label = jsonNode.Label ? jsonNode.Label[0] : '';
        this.tooltip = jsonNode.Tooltip ? jsonNode.Tooltip[0] : '';
        this.description = jsonNode.Description ? jsonNode.Description[0] : '';
        this.imageUrl = jsonNode.ImageURL ? jsonNode.ImageURL[0] : '';
        this.items = [];
        if (jsonNode.Item instanceof Array) {
            for (var i=0; i<jsonNode.Item.length; i++) {
                this.items.push(new Fusion.Lib.ApplicationDefinition.Item(jsonNode.Item[i]));
            }
        }
    },
    
    create: function(widgetSet, menu) {
        for (var i=0; i<this.items.length; i++) {
            this.items[i].create(widgetSet, menu);
        }
    }
    
};

Fusion.Lib.ApplicationDefinition.SearchDefinition = Class.create();
Fusion.Lib.ApplicationDefinition.SearchDefinition.prototype = {
    id: null,
    name: null,
    category: null,
    parameters: null,
    join: null,
    rule: null,
    
    initialize: function(json) {
        this.id = json['@id'];
        this.name = json['@name'];
        if (json.Join instanceof Array) {
            this.join = new Fusion.Lib.ApplicationDefinition.SearchJoin(json.Join[0]);
        }
        this.parameters = [];
        if (json.Parameter instanceof Array) {
            for (var i=0; i<json.Parameter.length; i++) {
                this.parameters.push(json.Parameter[i]['@name']);
            }
        }
        var rule;
        if (json.SearchAnd instanceof Array) {
            this.rule = new Fusion.Lib.ApplicationDefinition.SearchRule('AND');
            rule = json.SearchAnd[0];
        } else if (json.SearchOr instanceof Array) {
            this.rule = new Fusion.Lib.ApplicationDefinition.SearchRule('OR');
            rule = json.SearchOr[0];
        }
        if (rule && rule.SearchCondition instanceof Array) {
            for (var i=0; i<rule.SearchCondition.length; i++) {
                this.rule.add(new Fusion.Lib.ApplicationDefinition.SearchCondition(rule.SearchCondition[i]));
            }
        }
    },
    
    getJoinUrl: function(params) {
        if (this.join) {
            return '&joinlayer='+this.join.layer+'&joinpk='+this.join.primaryKey+'&joinfk='+this.join.foreignKey;
        } else {
            return '';
        }
    },
    
    getFilterUrl: function(params) {
        return '&filter='+encodeURIComponent(this.rule.toString(params));
    }
};

Fusion.Lib.ApplicationDefinition.SearchJoin = Class.create();
Fusion.Lib.ApplicationDefinition.SearchJoin.prototype = {
    layer: null,
    primaryKey: null,
    foreignKey: null,
    initialize: function(json) {
        this.layer = json.Layer ? json.Layer[0] : '';
        this.primaryKey = json.PrimaryKey ? json.PrimaryKey[0] : '';
        this.foreignKey = json.ForeignKey ? json.ForeignKey[0] : '';
    }
};

Fusion.Lib.ApplicationDefinition.SearchRule = Class.create();
Fusion.Lib.ApplicationDefinition.SearchRule.prototype = {
    type: null,
    conditions: null,
    initialize: function(type) {
        this.type = type;
        this.conditions = [];
    },
    
    add: function(condition) {
        this.conditions.push(condition);
    },
    
    remove: function(condition) {
        for (var i=0; i<this.conditions.length; i++) {
            if (this.conditions[i] == condition) {
                this.conditions.splice(i, 1);
                break;
            }
        }
    },
    
    toString: function(params) {
        var conditions = [];
        for (var i=0; i<this.conditions.length; i++) {
            this.conditions[i].setParams(params);
            var c = this.conditions[i].toString();
            if (c != '') {
                conditions.push(c);
            }
        }
        return '(' + conditions.join(') ' + this.type + ' (') + ')';
    }
};

Fusion.Lib.ApplicationDefinition.SearchCondition = Class.create();
Fusion.Lib.ApplicationDefinition.SearchCondition.prototype = {
    column: null,
    operator: null,
    parameter: null,
    quote: null,
    value: null,
    operators: {eq:'=', like:'like', lt:'<', lte:'<=', gt:'>', gte:'>=', neq:'<>'},
    includeIfEmpty: false,
    
    initialize: function(json) {
        this.column = json.Column[0];
        this.operator = this.operators[json.Operator[0].toLowerCase()];
        this.parameter = json.Parameter[0];
        this.quote = json['@quote'] ? json['@quote'] : '';
        this.wildcard = json['@wildcard'] ? json['@wildcard'] : 'both';
    },
    
    setParams: function(p) {
        if (p[this.parameter]) {
            this.value = p[this.parameter];
        } else {
            this.value = '';
        }
    },
    
    toString: function() {
        var value = this.value ? this.value : '';
        if (value == '' && !this.includeIfEmpty) {
            return '';
        }
        var prewildcard = '';
        var prewildcard = '';
        var postwildcard = '';
        if (this.operator == 'like') {
            if (this.wildcard == 'before' || this.wildcard == 'both') {
                prewildcard = '*';
            }
            if (this.wildcard == 'after' || this.wildcard == 'both') {
                postwildcard = '*';
            }
        }
        var wildcard = this.operator == 'like' ? '*' : '';
        return this.column + ' ' + this.operator + ' ' + this.quote + prewildcard + value + postwildcard + this.quote;
    }
};