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
Object.extend(MGWebLayout.prototype, 
{   
    mapId : '',
    commandObj : [],
    webLayout : null,
    oBroker: null,
    oConfigManager: null,

    initialize: function(app)
    {   
        EventMgr.prototype.initialize.apply(this, []);
        this.app = app
        this.oBroker = app.getBroker();
        this.webLayout =  app.getWebLayout();
        this.registerEventID(MGWEBLAYOUT_PARSED);
    },

    parse : function()
    {
        /* if the web layout is not in the mapguide server, 
           just load the xml*/
        
        if (this.webLayout.match('Library://') == null)
        {
            var options = {};
            options.method = 'get';
            options.onSuccess = this.parseXML.bind(this);
            new Ajax.Request(this.webLayout, options);
            return;
        }
        else
        {
            var r = new MGGetResourceContent(this.webLayout);
            this.oBroker.dispatchRequest(r, this.parseXML.bind(this));
            return;
        }
    },
     
    

    parseXML: function(r)
    {
        if (r.responseXML)
        {
            var mainNode = new DomNode(r.responseXML);
            var mapNode = mainNode.findFirstNode("Map");
            if (mapNode) {
                this.mapId = mapNode.getNodeText('ResourceId');
            } else {
                this.mapId = '';
            }
  
            var commandSet = mainNode.findFirstNode("CommandSet");
       
            var command = commandSet.findFirstNode('Command');
        
            //TODO : just get the basic commands for now. Other Commands include :
            // CustomCommandType, TargetedCommandType, SearchCommandType,
            //InvokeURLCommandType, BufferCommandType", SelectWithinCommandType,
            //MeasureCommandType, ViewOptionsCommandType, HelpCommandType"
            //InvokeScriptCommandType
            if (command )
            {
                var oCommand = new MGWebCommand(command, command.attributes[0].value);
                this.commandObj.push(oCommand);
            
            }

            while ((command = commandSet.findNextNode('Command')))
            {
                this.commandObj.push(new MGWebCommand(command, command.attributes[0].value));
            
            }

            this.aToolbars = [];

            var toolbar = mainNode.findFirstNode('ToolBar');
            while (toolbar) {
                this.aToolbars.push( new MgToolbar(toolbar) );
                toolbar = mainNode.findNextNode('ToolBar');
            }
            
            this.aMenus = [];

            var contextMenu = mainNode.findFirstNode('ContextMenu');
            while (contextMenu) {
                console.log('processing context menu');
                this.aMenus.push( new MgContextMenu(contextMenu) );
                contextMenu = mainNode.findNextNode('ContextMenu');
            }

            this.triggerEvent(MGWEBLAYOUT_PARSED);
        }
    },
    
    getMapRessourceId : function()
    {
        return this.mapId;
    },

    getCommandByName : function(sName)
    {
        var oCommand;
        for (var i=0; i<this.commandObj.length; i++)
        {
            oCommand = this.commandObj[i];

            if (oCommand.getName() == sName)
            {
                return this.commandObj[i];
            }
        }
    },

    getCommandByType : function(sType)
    {
        var oCommand;
        var aReturn = [];

        for (var i=0; i<this.commandObj.length; i++)
        {
            oCommand = this.commandObj[i];

            if (oCommand.getType() == sType)
            {
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
    initialize: function(domNode) {
        this.name = domNode.getNodeText('Name');
        this.container = domNode.getNodeText('Container');
        this.buttons = [];
        var button = domNode.findFirstNode('Button');
        while(button) {
            this.buttons.push(new MgUiItem(button));
            button = domNode.findNextNode('Button');
        }
    }
};

var MgContextMenu = Class.create();
MgContextMenu.prototype = {
    items: null,
    mapName: null,
    initialize: function(domNode) {
        this.mapName = domNode.getNodeText('Map');
        this.items = [];
        var item = domNode.findFirstNode('MenuItem');
        while(item) {
            this.items.push(new MgUiItem(item));
            item = domNode.findNextNode('MenuItem');
        }
    }
};

var MgUiItem = Class.create();
MgUiItem.prototype = {
    func: null,
    obj: null,
    initialize: function(domNode) {
        this.func = domNode.getNodeText('Function');
        switch(this.func) {
            case 'Separator':
                this.obj = new MgSeparator();
                break;
            case 'Command':
                this.obj = new MgCommand(domNode.findFirstNode('Command'));
                break;
            case 'Flyout':
                this.obj = new MgFlyout(domNode.findFirstNode('Flyout'));
                break;
            default:
                /* TODO: this could be an exception? */
                this.obj = new MgSeparator();
        }
    }
};

var MgCommand = Class.create();
MgCommand.prototype = {
    name: null,
    initialize: function(domNode) {
        this.name = domNode.textContent;
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
    
    initialize: function(domNode) {
        this.label = domNode.getNodeText('Label');
        this.tooltip = domNode.getNodeText('Tooltip');
        this.description = domNode.getNodeText('Description');
        this.imageUrl = domNode.getNodeText('ImageURL');
        this.disabledImageUrl = domNode.getNodeText('DisabledImageURL');
        this.subItems = [];
        var si = domNode.findFirstNode('SubItem');
        while(si) {
            this.subItems.push(new MgUiItemType(si));
            si = domNode.findNextNode('SubItem');
        }
    }
};