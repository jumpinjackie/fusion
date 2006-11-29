/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: MGConfigMgr handles communication with the MapGuide server
 *          during initialization, and triggers loading of the WebLayout
 *
 * Project: Fusion
 *
 * Author: DM Solutions Group Inc 
 *
 *****************************************************************************
 *
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
 *
 *****************************************************************************/
/**
 * MGConfigMgr
 *
 * Configuration class for fusion mapguide using a map guide web layout.
 * This is one of the configuarion 
 *
 */


var MGConfigMgr = Class.create();
Object.extend(MGConfigMgr.prototype, 
{
    oApp: null,
    sessionID : null,
    oBroker: null,
    //array of map widgets. For now only the map from the weblayout is used
    //TODO : use the mapconfig to pass other maps.
    aoMapWidget : null,

    aoMapInfo : null,
    oWebLayout: null,
    
    oWebLayout : null,

    aWidgetNames : [],
    
    aWidgets: null,

    /**
     * construct a new configuration manager.  This triggers a request to
     * the server to get a session.
     *
     * @param app {Object} the application object
     */
    initialize : function(app, sessionid)
    {
        //console.log('configuration manager initializing');
        this.oApp = app;
        this.aoMapWidget = [];
        this.aoMapInfo = [];
        this.aWidgets = [];
        
        this.scriptLang = app.getScriptLanguage();
        this.redirectScript = app.getRedirectScript();
        
        if (!sessionid || sessionid == "")
        {
            /*
            this.oBroker = app.getBroker();
            var r = new MGCreateSession();
            this.oBroker.dispatchRequest(r, this.sessionSet.bind(this));
            */
            var scriptURL = 'server/'+this.scriptLang+'/MGCreateSession.'+this.scriptLang;
            var options = {onComplete: this.sessionSet.bind(this)};
            app.ajaxRequest(scriptURL,options);
        }
        else
        {
            this.sessionID = sessionid;
            this.createWebLayout();
        }
    },

    /**
     * create an object to manage the web layout.  When it has
     * finished loading and parsing the web layout, it will
     * emit an event.  We load the map definitions when this
     * event is triggered.
     */
    createWebLayout : function()
    {
        //console.log('MGConfigMgr::parseWebLayout');
        this.oWebLayout = new MGWebLayout(this.oApp);
        this.oWebLayout.registerForEvent(MGWEBLAYOUT_PARSED, this.loadWidgets.bind(this));
        this.oWebLayout.parse();
    },

    /**
     * return the session ID
     */
    getSessionId : function()
    {
        return this.sessionID;
    },

    getListofWidgets : function()
    {
        var oCommand = null;
        var sTmp;
        var aCommands = [];
        for (var i=0; i<this.oWebLayout.commandObj.length; i++) {
            oCommand = this.oWebLayout.commandObj[i];
            if ($(oCommand.getName())) {
                aCommands.push(oCommand);
            }
        }
        return aCommands;
    },
    
    getListofToolbarWidgets: function() {
        var aCommands = [];
        var toolbars = this.oWebLayout.aToolbars;
        for (var i=0; i<toolbars.length; i++) {
            /* test to see if the container for the toolbar is in the page */
            if($(toolbars[i].container)) {
                for (var j=0; j<toolbars[i].buttons.length; j++) {
                    var button = toolbars[i].buttons[j];
                    if (button.func == 'Command') {
                        var oCommand = this.oWebLayout.getCommandByName(toolbars[i].buttons[j].obj.name);
                        if (oCommand) {
                            aCommands.push(oCommand);
                        }
                    } else if (button.func == 'Flyout') {
                        aCommands = aCommands.concat(this.getListofMenuWidgets(button.obj.subItems));
                    }
                }
            }
        }

        return aCommands;
    },
    
    getListofContextMenuWidgets: function() {
        var aCommands = [];
        var menus = this.oWebLayout.aMenus;
        for (var i=0; i<menus.length; i++) {
            /* test to see if the container for the toolbar is in the page */
            if(menus[i].mapName == '' || this.getMapByName(menus[i].mapName)) {
                aCommands = aCommands.concat(this.getListofMenuWidgets(menus[i].items));
            }
        }
        return aCommands;
    },
    
    getListofMenuWidgets: function(menuItems) {
        aCommands = [];
        for (var i=0; i<menuItems.length; i++) {
            var item = menuItems[i];
            switch (item.func) {
                case 'Separator':
                    break;
                case 'Command':
                    var oCommand = this.oWebLayout.getCommandByName(item.obj.name);
                    if (oCommand) {
                        aCommands.push(oCommand);
                    }
                    break;
                case 'Flyout':
                    aCommands = aCommands.concat(this.getListofMenuWidgets(item.obj.subItems));
                    break;
                default:
                
            }
        }
        return aCommands;
    },


    loadWidgets : function()
    {
        //console.log('load widgets');
        var aCommands = this.getListofWidgets();
        aCommands = aCommands.concat(this.getListofToolbarWidgets());
        aCommands = aCommands.concat(this.getListofContextMenuWidgets());
        
        this.aWidgetNames[0] = 'widgets/MGMap';
        var sTmp;

        for (var i=0; i<aCommands.length; i++)
        {
            sTmp = aCommands[i].getAction();
            this.aWidgetNames.push(aCommands[i].sLocation + '/' + sTmp);
        }
        
        for (var i=0; i< this.aWidgetNames.length; i++)
        {
            Fusion.require(this.aWidgetNames[i] + '.js');
        }
        
        this.oApp.setLoadState(this.oApp.MG_LOAD_WIDGETS);
    },

    createWidgets :  function()
    {
        this.createMapWidget();
        this.createAllWidgets();
        this.createToolbars();
        this.createContextMenus();
    },

    /**convension for the widgets :
     * basic command widgets will be names [Action] with file name being [Action].js
     *  -ex ZoomIn = Zoom()
     *  basic command widgets will be located under base_url/widgets/
     */
    createMapWidget : function()
    {
        var aCommands = this.oWebLayout.getCommandByType('MapCommandType');
        if (aCommands.length > 0)
        {
            var oCommand = null;
            for (var i=0; i<aCommands.length; i++)
            {
                oCommand = aCommands[i];
                var oElement =  $(oCommand.getName());
                if (oElement != null)
                {
                    var widget;
                    var sTmp = 'widget = new ' + oCommand.getAction() + '(oCommand)';
                    eval(sTmp);
                    if ($(oCommand.getName())) {
                        $(oCommand.getName()).widget = widget;
                    }
                    this.aoMapWidget.push(widget);
                }
            }
        }
    },

    getMapByName : function(sName)
    {
        var nMaps = this.aoMapWidget.length;
        var oMap = null;
        for (var i=0; i<nMaps; i++)
        {
            if (this.aoMapWidget[i].getMapName() == sName){
                oMap = this.aoMapWidget[i];
                break;
            }
        }
        return oMap;
    },

    /**
      get the map object using the html element id used by the map
    */
    getMapById : function(sId)
    {
        var nMaps = this.aoMapWidget.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = this.aoMapWidget[i];
            if (oMap.getDomId() == sId)
            {
                return oMap;
            }
        }
        return null;
    },

    getMapByIndice : function(nIndice)
    {
        if (nIndice < this.aoMapWidget.length)
        {
            var oMap = this.aoMapWidget[nIndice];
            return oMap;
        }

        return null;
    },

  
    createAllWidgets : function()
    {
        var aCommands = this.getListofWidgets();
        for (var i=0; i<aCommands.length; i++) {
            var oCommand = aCommands[i];
            //console.log('creating ' + oCommand.getAction());
            if (oCommand.getAction() != '' && oCommand.getAction() != 'MGMap') {
                var widget;
                var sTmp = 'widget = new ' + oCommand.getAction() + '(oCommand)';
                eval(sTmp);
                this.aWidgets.push(widget);
                if ($(oCommand.getName())) {
                    $(oCommand.getName()).widget = widget;
                }
            }
        }

    },
    
    createToolbars: function() {
        //console.log('searching for toolbars to create');
        var dummyAction = new JxAction(null);
        var toolbars = this.oWebLayout.aToolbars;
        if (toolbars.length > 0) {
            for (var i=0; i<toolbars.length; i++) {
                toolbarObj = $(toolbars[i].container);
                if (toolbarObj) {
                    //console.log('creating toolbar');
                    var toolbar = toolbars[i];
                    var tb = new JxToolbar(toolbarObj);
                    tb.domObj.id = toolbar.name;
                    for (var j=0; j<toolbar.buttons.length; j++) {
                        var id = 'toolbar'+i+'command'+j;
                        //console.log('creating item ' + id );
                        var button = toolbar.buttons[j];
                        var tbItem = null;
                        switch (button.func) {
                            case 'Separator':
                                tb.add(new JxToolbarSeparator());
                                break;
                            case 'Command':
                                var oCommand = this.oWebLayout.getCommandByName(button.obj.name);

                                tbItem = new JxToolbarItem();
                                tbItem.domObj.id = id;
                                tb.add(tbItem);

                                var oldName = oCommand.getName();
                                oCommand.setName(id);
                                var widget;
                                var sTmp = 'widget = new ' + oCommand.getAction() + '(oCommand)';
                                eval(sTmp);
                                this.aWidgets.push(widget);
                                oCommand.setName(oldName);                                
                                break;
                            case 'Flyout':
                                var menu = new JxButtonMenu(button.obj.label);
                                
                                this.processMenuUiItems(button.obj.subItems, menu, null)
                                
                                var action = new JxAction(menu.show.bind(menu));
                                
                                var options = {};
                                options.label = button.obj.label;
                                options.tooltip = button.obj.tooltip
                                if (button.obj.imageUrl != '') {
                                    options.imgPath = button.obj.imageUrl;
                                }
                                var menuButton = new JxButton(action, options);
                                Element.addClassName(menuButton.domObj, 'jxButtonMenu');
                                
                                var tbItem = new JxToolbarItem(menuButton);
                                tbItem.domObj.appendChild(menu.domObj);
                                tbItem.domObj.id = id;
                                menu.domObj.id = id+'menu';
                                tb.add(tbItem);
                                break;
                            default:
                                /* TODO: this could be an exception? */
                                tb.add(new JxToolbarSeparator());
                        }
                    }
                }
                else { console.log ('toolbar ' + toolbars[i].name + ' not found'); }
            }

        }
    },
    
    createContextMenus: function() {
        /*console.log('createContextMenus');*/
        var menus = this.oWebLayout.aMenus;
        if (menus.length > 0) {
            for (var i=0; i<menus.length; i++) {
                var oMap = null;
                if (menus[i].mapName != '') {
                    oMap = this.getMapByName(menus[i].mapName);
                } else {
                    oMap = this.getMapByIndice(0);
                }
                var menu = new JxContextMenu();
                this.processMenuUiItems(menus[i].items, menu, oMap);
                oMap.setContextMenu(menu);
            }
        }
    },
    
    processMenuUiItems: function(menuItems, menu, oMap) {
        for (var i=0; i<menuItems.length; i++) {
            var item = menuItems[i];
            switch (item.func) {
                case 'Separator':
                    break;
                case 'Command':
                    var widget = this.createWidgetFromCommandName(item.obj.name, '');
                    if (widget) {
                        var action;
                        if (oMap) {
                            action = new JxAction(oMap.executeFromContextMenu.bind(oMap, widget));
                            widget.registerForEvent(WIDGET_STATE_CHANGED, 
                                function(eventID, aWidget) {
                                    this.setEnabled(aWidget.isEnabled())
                                }.bind(action));                        
                        } else {
                            action = new JxAction(widget.activateTool.bind(widget));
                            
                        }

                        var options = {};
                        options.label = widget._oCommand.sLabel;
                        options.image = widget._oCommand.sImageurl;
                        menu.add(new JxMenuItem(action, options));
                    }
                    break;
                case 'Flyout':
                    var options = {};
                    options.label = item.obj.label;
                    if (item.obj.imageUrl != '') {
                        options.image = item.obj.imageUrl;
                    }
                    var subMenu = new JxMenu(options);
                    this.processMenuUiItems(item.obj.subItems, subMenu, oMap);
                    menu.add(subMenu);
                    break;
                default:
            
            }
        }
    },
    
    createWidgetFromCommandName: function(name, id) {
        var widget = null;
        var oCommand = this.oWebLayout.getCommandByName(name);
        if (oCommand) {
            var oldName = oCommand.getName();
            oCommand.setName('');
            var widget;
            var sTmp = 'widget = new ' + oCommand.getAction() + '(oCommand)';
            eval(sTmp);
            this.aWidgets.push(widget);
            oCommand.setName(oldName);
        }
        return widget;
    },
    
    getWidgetById: function(id) {
        return $(id).widget;
    },
    
    getWidgetsByType: function(type) {
        var a = [];
        for (var i=0; i<this.aWidgets.length; i++) {
            if (this.aWidgets[i].sName == type) {
                a.push(this.aWidgets[i]);
            }
        }
        return a;
    },
    
    sessionSet : function(r) {
        if (r.status == 200) {
            if (r.responseXML) {
                var node = new DomNode(r.responseXML);
                this.sessionID = node.getNodeText('sessionid');
            }
            if (this.sessionID != '') {
                this.createWebLayout();
            } else {
            }
        } else {
        }
    },
    
    getWebLayout: function() {return this.oWebLayout;},
    getWebAgentURL: function() {return this.oApp.getWebAgentURL();},
    getSessionID: function() {return this.sessionID;}
});

/**
 * _MapInfo
 *
 * Utility class to keep basic initial about the map 
 *
 */
function _MapInfo(mapid, oCommand, nWidth, nHeight)
{
    this.sMapId = mapid;
    this.oCommand = oCommand;
    this.nWidth = nWidth;
    this.nHeight = nHeight;
    
    this.sMapName = '';
    this.metersperunit = -1;
    this.aExtents = [];
}

_MapInfo.prototype.setParams = function(mapname, metersperunit, aExtents)
{
    this.sMapName = mapname;
    this.metersperunit = metersperunit;
    this.aExtents = aExtents;
}
