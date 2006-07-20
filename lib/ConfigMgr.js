/*****************************************************************************
 *
 *
 * Purpose: Chamelon app
 *
 * Project: MapGuide Open Source : Chameleon
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
/*
* $Id$
*/


/**
 * MGConfigMgr
 *
 * Configuration class for chameleon mapguide using a map guide web layout.
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

    /**
     * construct a new configuration manager.  This triggers a request to
     * the server to get a session.
     *
     * @param app {Object} the application object
     */
    initialize : function(app)
    {
        console.log('configuration manager initializing');
        this.oApp = app;
        this.aoMapWidget = [];
        this.aoMapInfo = [];
        
        this.scriptLang = app.getScriptLanguage();
        this.redirectScript = app.getRedirectScript();
        
        this.oBroker = app.getBroker();
        var r = new MGCreateSession();
        this.oBroker.dispatchRequest(r, this.sessionSet.bind(this));
    },

    /**
     * create an object to manage the web layout.  When it has
     * finished loading and parsing the web layout, it will
     * emit an event.  We load the map definitions when this
     * event is triggered.
     */
    createWebLayout : function()
    {
        console.log('MGConfigMgr::parseWebLayout');
        this.oWebLayout = new MGWebLayout(this.oApp);
        this.oWebLayout.registerForEvent(MGWEBLAYOUT_PARSED, this, this.loadMapDefinitions.bind(this));
        this.oWebLayout.parse();
    },

    /**
     * return the session ID
     */
    getSessionId : function()
    {
        return this.sessionID;
    },

    /**
     * load a map definition.  Uses a script on the server because we need
     * to compute some stuff like map units, which aren't available in any
     * of the map agent calls (yet?).
     */
    loadMapDefinitions : function()
      {
          console.log('MGConfigMgr::loadMapDefintions');
          var sl = this.oApp.getScriptLanguage();
          var loadmapScript = 'server/' + sl  + '/MGLoadMap.' + sl;

          /* look for all command maps and load the map info object*/
          var aCommands = this.oWebLayout.getCommandByType('MapCommandType');
          if (aCommands.length > 0)
          {
              var oCommand = null;
              for (var i=0; i<aCommands.length; i++)
              {
                  oCommand = aCommands[i];
                  //var oElement = getRawObject(oCommand.getName());
                  var oElement =  $(oCommand.getName());
                  if (oElement != null)
                  {
                      var mapid = oCommand.oxmlNode.getNodeText('ResourceId');
                      var size = Element.getDimensions(oElement);
                      if (size.width < 10 || size.height < 10) {
                          size.width = oCommand.oxmlNode.getNodeText('Width');
                          size.height = oCommand.oxmlNode.getNodeText('Height');
                          oElement.style.width = size.width + "px";
                          oElement.style.height = size.height + "px";
                      }
                      this.aoMapInfo.push(new _MapInfo(mapid, oCommand, size.width,
                                                       size.height));
                      var params = 'mapid='+mapid+"&session="+this.sessionID;
                      var options = {onSuccess: this.mapLoaded.bind(this), 
                                     parameters: params};
                      this.oApp.ajaxRequest(loadmapScript, options);
                  }
              }
          }
          else
          {

              /*If no command is found, use the default map in the mapview.
               Look for an element with the specific id called Map.  */
              var oElement =  $('Map');
              if (oElement != null)
              {
                  var mapid = this.oWebLayout.getMapRessourceId()
                  var params = 'mapid='+mapid+"&session="+this.sessionID;
                  var options = {onSuccess: this.mapLoaded.bind(this), 
                                 parameters: params};
                  this.oApp.ajaxRequest(loadmapScript, options);
              
                  var oCommand = new MGWebCommand(null, 'MapType');
                  oCommand.setName('Map');
                  var size = Element.getDimensions(oElement);
                  if (size.height < 10 || size.width < 10) {
                      size.height = 400;
                      size.width = 400;
                      oElement.style.width = size.width + "px";
                      oElement.style.height = size.height + "px";
                  }
                  this.aoMapInfo.push(new _MapInfo(mapid, oCommand, size.width, size.height));
              }
      
          }
      },

    /**
     * Parse the content of the configuration settings
     */
    mapLoaded : function(r)
    {
        console.log('MGConfigMgr::mapLoaded');
        if (r.responseXML)
        {
            var oNode = new DomNode(r.responseXML.childNodes[0]);
            var mapid = oNode.findFirstNode('mapid').textContent;
            var mapname = oNode.findFirstNode('mapname').textContent;
            var metersperunit = oNode.findFirstNode('metersperunit').textContent;

            var aExtents = [
                                 parseFloat(oNode.getNodeText('minx')),
                                 parseFloat(oNode.getNodeText('miny')),
                                 parseFloat(oNode.getNodeText('maxx')),
                                 parseFloat(oNode.getNodeText('maxy'))
              ];
              this.currentExtents = aExtents;

              for (var i=0; i<this.aoMapInfo.length; i++)
              {
                  if (this.aoMapInfo[i].sMapId == mapid)
                  {
                      this.aoMapInfo[i].setParams(mapname,metersperunit,aExtents);
                  }
              }
        } else {
            console.log( "Error parsing map ... " + r.responseText);
        }
        
        //TODO : if several maps are defined, load them all before loading the widgets
        this.loadWidgets();
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


    loadWidgets : function()
    {
        var aCommands = this.getListofWidgets();  
        this.aWidgetNames[0] = 'widgets/MGMap';
        var sTmp;

        for (var i=0; i<aCommands.length; i++)
        {
            sTmp = aCommands[i].getAction(); 
            this.aWidgetNames.push(aCommands[i].sLocation + sTmp);
        }
        
        for (var i=0; i< this.aWidgetNames.length; i++)
        {
            require(this.aWidgetNames[i] + '.js');
        }
        this.oApp.setLoadState(this.oApp.MG_LOAD_WIDGETS);
    },

    createWidgets :  function()
    {
        this.createMapWidget();
        this.createAllWidgets();
    },

    /**convension for the widgets :
     * basic command widgets will be names [Action] with file name being [Action].js
     *  -ex ZoomIn = Zoom()
     *  basic command widgets will be located under base_url/widgets/
     */
    createMapWidget : function()
    {
        var nMaps = this.aoMapInfo.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = new MGMap(this.aoMapInfo[i].oCommand.getName(), 
                             this.aoMapInfo[i].sMapName,
                             this.aoMapInfo[i].metersperunit, 
                             this.aoMapInfo[i].aExtents,
                             this.aoMapInfo[i].nWidth,
                             this.aoMapInfo[i].nHeight,
                             this);
            this.aoMapWidget.push(oMap);
            oMap.drawMap();
        }
    },

    getMapByName : function(sName)
    {
        var nMaps = this.aoMapWidget.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = this.aoMapWidget[i];
            if (oMap.getMapName == sName)
            {
                return oMap;
            }
        }
        return null;
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
            if (oMap.getDomeId() == sId)
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
        var aAllElements = document.body.getElementsByTagName('*');
        var oCommand = null;
        var sTmp;

        for (var i = 0; i < aAllElements.length; i++) 
        {
            oCommand = this.oWebLayout.getCommandByName(aAllElements[i].id);
            if (oCommand != null)  
            {
                if (oCommand.getAction() != '' && oCommand.getAction() != 'MGMap')
                {
                    var sTmp = 'new ' + oCommand.getAction()+ '(oCommand)';
                    eval(sTmp);
                }
            }
            oCommand = null;
        }
    },
 
    sessionSet : function(r) {
        console.log('session set');
        this.sessionID = r.responseText;
        if (this.sessionID != '') {
            this.createWebLayout();
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
