/*****************************************************************************
 * $Id$
 * Purpose: Fusion
 * Project: Fusion
 * Author: DM Solutions Group Inc 
 *****************************************************************************
 * Copyright (c) 2006, DM Solutions Group Inc.
 *
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
 *****************************************************************************/

/**
 * MGWebLayout
 *
 * Utility class to parse a web layout
 *
 */



var MGWEBLAYOUT_PARSED = 1;
var MGWebLayout = Class.create();
Object.extend(MGWebLayout.prototype, EventMgr.prototype);
Object.extend(MGWebLayout.prototype, {   
    mapId : '',
    aMaps: null,
    commandObj : null,
    aToolbars: null,
    aMenus: null,
    webLayout : null,
    oBroker: null,
    oConfigManager: null,

    initialize: function(app) {   
        EventMgr.prototype.initialize.apply(this, []);
        this.app = app
        this.oBroker = app.getBroker();
        this.webLayout =  app.getWebLayout();
        
        this.commandObj = [];
        this.aMaps = [];
        this.registerEventID(MGWEBLAYOUT_PARSED);
    },

    parse : function() {
        /* if the web layout is not in the mapguide server, 
           just load the xml*/
        
        if (this.webLayout.match('Library://') == null) {
            var options = {};
            //options.method = 'get';
            options.onSuccess = this.parseXML.bind(this);
            options.parameters = 'content-type=json';
            //new Ajax.Request(this.webLayout, options);
            var url = Fusion.getRedirectScript() + '?s=' + this.webLayout;
            new Ajax.Request( url, options);
            return;
        } else {
            var r = new MGGetResourceContent(this.webLayout);
            this.oBroker.dispatchRequest(r, this.parseXML.bind(this));
            return;
        }
    },
     
    

    parseXML: function(r, json) {
        if (json) {
            var mainNode;
            eval("mainNode="+r.responseText);
            
            var webLayout = mainNode.WebLayout;
            /* process Map nodes */
            
            if (webLayout.Map instanceof Array) {
                var maps = webLayout.Map;
                for (var i=0; i<maps.length; i++) {
                    var map = maps[i];
                    var mapObj = {};
                    mapObj.resourceId = map.ResourceId;
                    mapObj.referenceImageUrl = map.ReferenceImageUrl;
                    mapObj.links = {layers:[], groups: []};
                    if (map.Links) {
                        /* process Groups */
                        if (map.Links.Group instanceof Array) {
                            for (var j=0; j<map.Links.Group.length; i++) {
                                var group = map.Links.Group[i];
                                mapObj.links.groups.push({name:group.Name,url:group.Url});
                            }
                        }
                        if (map.Links.Layer instanceof Array) {
                            for (var j=0; j<map.Links.Layer.length; i++) {
                                var layer = map.Links.Layer[i];
                                mapObj.links.layer.push({name:layer.Name,url:layer.Url});
                            }
                        }
                    }
                }
            }
            
            var commandSet = webLayout.CommandSet;
            if (commandSet instanceof Array) {
                var commands = commandSet[0].Command;
                if (commands instanceof Array) {
                    for (var i=0; i<commands.length; i++) {
                        this.commandObj.push(new MGWebCommand(commands[i]));
                    }
                }
            }
            
            /* process toolbars */
            this.aToolbars = [];

            if (webLayout.ToolBar instanceof Array) {
                var toolbars = webLayout.ToolBar;
                for (var i=0; i<toolbars.length; i++) {
                    this.aToolbars.push( new MgToolbar(toolbars[i]) );
                }
            }
            
            /* process context menus */
            this.aMenus = [];

            if (webLayout.ContextMenu instanceof Array) {
                var menus = webLayout.ContextMenu;
                for (var i=0; i<menus.length; i++) {
                    this.aMenus.push( new MgContextMenu(menus[i]) );
                }
            }
            
            /* process search definitions */
            this.aSearchCategories = {};
            this.aSearchDefinitions = {};
            if (webLayout.SearchDefinitions instanceof Array) {
                var categories = webLayout.SearchDefinitions[0];
                if (categories.SearchCategory instanceof Array) {
                    for (var i=0; i<categories.SearchCategory.length; i++) {
                        var oCategory = {};
                        var category = categories.SearchCategory[i];
                        oCategory.id = category['@id'];
                        oCategory.name = category['@name'];
                        oCategory.layer = category.Layer ? category.Layer[0] : '';
                        oCategory.searchDefinitions = [];
                        var defns = category.SearchDefinition;
                        for (var k=0; k<defns.length; k++) {
                            var defn = new MgSearchDefinition(defns[k]);
                            defn.category = oCategory;
                            oCategory.searchDefinitions[defn.id] = defn;
                            this.aSearchDefinitions[defn.id] = defn;
                        }
                    }
                }
            }
            this.triggerEvent(MGWEBLAYOUT_PARSED);
        }
    },
    
    getMapResourceId : function() {
        return this.mapId;
    },

    getCommandByName : function(sName) {
        var oCommand;
        for (var i=0; i<this.commandObj.length; i++) {
            oCommand = this.commandObj[i];

            if (oCommand.getName() == sName) {
                return this.commandObj[i];
            }
        }
    },

    getCommandByType : function(sType) {
        var oCommand;
        var aReturn = [];

        for (var i=0; i<this.commandObj.length; i++) {
            oCommand = this.commandObj[i];

            if (oCommand.getType() == sType) {
                aReturn.push(oCommand);
            }
        }

        return aReturn;
    }
});

var MgToolbar = Class.create();
MgToolbar.prototype = {
    buttons: null,
    name: null,
    container: null,
    initialize: function(jsonNode) {
        this.name = jsonNode.Name ? jsonNode.Name[0] : '';
        this.container = jsonNode.Container ? jsonNode.Container[0] : '';
        this.buttons = [];
        if (jsonNode.Button instanceof Array) {
            for (var i=0; i<jsonNode.Button.length; i++) {
                this.buttons.push(new MgUiItem(jsonNode.Button[i]));
            }
        }
    }
};

var MgContextMenu = Class.create();
MgContextMenu.prototype = {
    items: null,
    mapName: null,
    initialize: function(jsonNode) {
        this.mapName = jsonNode.Map ? jsonNode.Map[0] : '';
        this.items = [];
        if (jsonNode.MenuItem instanceof Array) {
            for (var i=0; i<jsonNode.MenuItem.length; i++) {
                this.items.push(new MgUiItem(jsonNode.MenuItem[i]));
            }
        }
    }
};

var MgUiItem = Class.create();
MgUiItem.prototype = {
    func: null,
    obj: null,
    initialize: function(jsonNode) {
        this.func = jsonNode.Function[0];
        switch(this.func) {
            case 'Separator':
                break;
            case 'Command':
                this.obj = new MgCommand(jsonNode);
                break;
            case 'Flyout':
                this.obj = new MgFlyout(jsonNode);
                break;
            default:
                /* TODO: this could be an exception? */
        }
    }
};

var MgCommand = Class.create();
MgCommand.prototype = {
    name: null,
    initialize: function(jsonNode) {
        this.name = jsonNode.Command[0];
    }
};

var MgFlyout = Class.create();
MgFlyout.prototype = {
    label: null,
    tooltip: null,
    description: null,
    imageUrl: null,
    disabledImageUrl: null,
    /* TODO add active class, disabled class */
    subItems: null,
    
    initialize: function(jsonNode) {
        this.label = jsonNode.Label ? jsonNode.Label[0] : '';
        this.tooltip = jsonNode.Tooltip ? jsonNode.Tooltip[0] : '';
        this.description = jsonNode.Description ? jsonNode.Description[0] : '';
        this.imageUrl = jsonNode.ImageURL ? jsonNode.ImageURL[0] : '';
        this.disabledImageUrl = jsonNode.DisabledImageURL ? jsonNode.DisabledImageURL[0] : '';
        this.subItems = [];
        if (jsonNode.SubItem instanceof Array) {
            for (var i=0; i<jsonNode.SubItem.length; i++) {
                this.subItems.push(new MgUiItem(jsonNode.SubItem[i]));
            }
        }
    }
};

var MgSearchDefinition = Class.create();
MgSearchDefinition.prototype = {
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
            this.join = new MgSearchJoin(json.Join[0]);
        }
        this.parameters = [];
        if (json.Parameter instanceof Array) {
            for (var i=0; i<json.Parameter.length; i++) {
                this.parameters.push(json.Parameter[i]['@name']);
            }
        }
        var rule;
        if (json.SearchAnd instanceof Array) {
            this.rule = new MgSearchRule('AND');
            rule = json.SearchAnd[0];
        } else if (json.SearchOr instanceof Array) {
            this.rule = new MgSearchRule('OR');
            rule = json.SearchOr[0];
        }
        if (rule && rule.SearchCondition instanceof Array) {
            for (var i=0; i<rule.SearchCondition.length; i++) {
                this.rule.add(new MgSearchCondition(rule.SearchCondition[i]));
            }
        }
    },
    
    getJoinUrl: function(params) {
        if (this.join) {
            return '&joinlayer='+this.join.layer+'&joinpk='+this.join.primaryKey+'&joinfk='+this.join.foriegnKey;
        } else {
            return '';
        }
    },
    
    getFilterUrl: function(params) {
        return '&filter='+this.rule.toString(params);
    }
};

var MgSearchJoin = Class.create();
MgSearchJoin.prototype = {
    layer: null,
    primaryKey: null,
    foriegnKey: null,
    initialize: function(json) {
        this.layer = json.Layer ? json.Layer[0] : '';
        this.primaryKey = json.PrimaryKey ? json.PrimaryKey[0] : '';
        this.foriegnKey = json.ForeignKey ? json.ForeignKey[0] : '';
    }
}

var MgSearchRule = Class.create();
MgSearchRule.prototype = {
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
        for (var i=0; i<this.conditions.length; i++) {
            this.conditions[i].setParams(params);
        }
        return '(' + this.conditions.join(') ' + this.type + ' (') + ')';
    }
};

var MgSearchCondition = Class.create();
MgSearchCondition.prototype = {
    column: null,
    operator: null,
    parameter: null,
    quote: null,
    value: null,
    operators: {eq:'=', like:'like', lt:'<', lte:'<=', gt:'>', gte:'>=', neq:'<>'},
    
    initialize: function(json) {
        this.column = json.Column[0];
        this.operator = this.operators[json.Operator[0].toLowerCase()];
        this.parameter = json.Parameter[0];
        this.quote = json['@quote'] ? json['@quote'] : '';
    },
    
    setParams: function(p) {
        if (p[this.parameter]) {
            this.value = p[this.parameter];
        }
    },
    
    toString: function() {
        var value = this.value ? this.value : '';
        var wildcard = this.operator == 'like' ? '*' : '';
        return this.column + ' ' + this.operator + ' ' + this.quote + wildcard + value + wildcard + this.quote;
    }
};