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
    sessionID : null,
    _oBroker: null,
    //array of map widgets. For now only the map from the weblayout is used
    //TODO : use the mapconfig to pass other maps.
    _aoMapWidget : [],

    _aoMapInfo : [],

    webLayout : "",
    webagentURL : "",
    scriptLang : "",
    redirectScript : "",

    _aWidgetNames : [],
    oInterval : null,

    initialize : function(webLayout, mapConfig, webagentURL, scriptLang, redirectScript, oBroker)
    {
        console.log('configuration manager initializing')
        this.webLayout = webLayout;
        this.webagentURL = webagentURL;
        this.scriptLang = scriptLang;
        this.redirectScript = redirectScript;
        
        this._oBroker = oBroker;
        var r = new MGCreateSession();
        this._oBroker.dispatchRequest(r, this.sessionSet.bind(this));

        /*
        var options = {}
        options.method = 'post'
        options.onSuccess = this.sessionSet.bind(this);
        options.parameters = "s=" + chameleon_url + 'server/' + this.scriptLang  + '/MGCreateSession.' + this.scriptLang
        new Ajax.Request(this.redirectScript, options);
        */

         //this.parseWebLayout();
    },

    parseWebLayoutCB : function()
    {
        console.log('MGConfigMgr::parseWebLayout');
        this.loadMapDefintions();
        
    },

    parseWebLayout : function()
    {
        //get the xml of the 
        console.log('MGConfigMgr::parseWebLayout');
        this.webLayout = new MGWebLayout(this.webLayout, this.webagentURL, this.sessionID, this._oBroker);
        this.webLayout.registerForEvent(MGWEBLAYOUT_PARSED, this, this.parseWebLayoutCB);
        this.webLayout.parse();
    },


    getWebagentURL : function()
    {
        return this.webagentURL;
    },

    getSessionId : function()
    {
        return this.sessionID;
    },

    /**
     * load a map definition.  Uses a script on the server because we need
     * to compute some stuff like map units, which aren't available in any
     * of the map agent calls (yet?).
     */
    loadMapDefintions : function()
      {
          console.log('MGConfigMgr::loadMapDefintions');

          var loadmapScript = "s=" + chameleon_url + 'server/' + this.scriptLang  + '/MGLoadMap.' + this.scriptLang;

          /* look for all command maps and load the map info object*/
          var aCommands = this.webLayout.getCommandByType('MapCommandType');
          if (aCommands.length > 0)
          {
              var oCommand = null;
              for (var i=0; i<aCommands.length; i++)
              {
                  oCommand = aCommands[i];
                  //var oElement = getRawObject(oCommand.getName());
                  var oElement =  document.getElementById(oCommand.getName());
                  if (oElement != null)
                  {
                      var mapid = oCommand.oxmlNode.getNodeText('ResourceId');
                      this._aoMapInfo.push(new _MapInfo(mapid, oCommand,
                                                        oCommand.oxmlNode.getNodeText('Width'),
                                                        oCommand.oxmlNode.getNodeText('Height')));
                      var sUrl = loadmapScript + '&mapid='+mapid+"&session="+this.sessionID;
                      var options = {onSuccess: this.mapLoaded.bind(this), parameters: sUrl};
                      new Ajax.Request(this.redirectScript, options );
                  }
              }
          }
          else
          {

              /*If no command is found, use the default map in the mapview.
               Look for an element with the specific id called Map.  */
              var oElement =  document.getElementById('Map');
              if (oElement != null)
              {
                  var mapid = this.webLayout.getMapRessourceId()
                    var sUrl = loadmapScript + '&mapid='+mapid+"&session="+this.sessionID;
                  var options = {onSuccess: this.mapLoaded.bind(this), parameters: sUrl};
                  new Ajax.Request(this.redirectScript, options );
              
                  var oCommand = new MGWebCommand(null, 'MapType');
                  oCommand.setName('Map');
                  this._aoMapInfo.push(new _MapInfo(mapid, oCommand, 400, 400));
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

              for (var i=0; i<this._aoMapInfo.length; i++)
              {
                  if (this._aoMapInfo[i].sMapId == mapid)
                  {
                      this._aoMapInfo[i].setParams(mapname,metersperunit,aExtents);
                  }
              }
        }

        //TODO : if several maps are defined, load them all before loading the widgets
        this.loadWidgets();
    },
    

    
    
    getListofWidgets : function()
    {
        /*
        var aAllElements = document.body.getElementsByTagName('*');
        var oCommand = null;
        var sTmp;
        var aCommands = [];
        
        for (var i = 0; i < aAllElements.length; i++) 
        {
            oCommand = this.webLayout.getCommandByName(aAllElements[i].id);
            if (oCommand != null)
            {
                aCommands.push(oCommand);
            }
        }
        */
        var oCommand = null;
        var sTmp;
        var aCommands = [];
        for (var i=0; i<this.webLayout.commandObj.length; i++) {
            oCommand = this.webLayout.commandObj[i];
            if (document.getElementById(oCommand.getName())) {
                aCommands.push(oCommand);
            }
        }

        return aCommands;
    },


    checkScriptsLoaded2 : function(oObject)
    {
        oObject.createWidgets();
    },

    checkScriptsLoaded : function()
    {
        if(this._aWidgetNames.length > 0)
        {
            var sTmp = "window."+this._aWidgetNames[0];
            if (typeof eval(sTmp) == "function")
            {
                this._aWidgetNames.shift();
            }
        }
        if (this._aWidgetNames.length == 0  && this.oInterval != null)
        {
            clearInterval(this.oInterval);
            this.createWidgets();
            this.oInterval = null;
        }
    },


    loadWidgets : function()
    {
        var aCommands = this.getListofWidgets();  
        this._aWidgetNames[0] = 'MGMap';
        var sTmp;

        for (var i=0; i<aCommands.length; i++)
        {
            sTmp = aCommands[i].getAction(); 
            this._aWidgetNames.push(sTmp);
        }
        
        for (var i=0; i< this._aWidgetNames.length; i++)
        {
            require('widgets/' + this._aWidgetNames[i] + '.js',
                                    this._aWidgetNames[i]);
        }
        document.__chameleon__.setLoadState(document.__chameleon__.MG_LOAD_WIDGETS);
    },

    createWidgets :  function()
    {
        
        this.createMapWidget();
        
        this.createAllWidgets();

    },

    //convension for the widgets :
    // * basic command widgets will be names [Action] with file name being [Action].js
    //   -ex ZoomIn = Zoom()
    // *  basic command widgets will be located under base_url/widgets/
    //
    createMapWidget : function()
    {
        var nMaps = this._aoMapInfo.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = new MGMap(this._aoMapInfo[i].oCommand.getName(), 
                             this._aoMapInfo[i].sMapName,
                             this._aoMapInfo[i].metersperunit, 
                             this._aoMapInfo[i].aExtents,
                             this._aoMapInfo[i].nWidth,
                             this._aoMapInfo[i].nHeight,
                             this);
            this._aoMapWidget.push(oMap);
            oMap.drawMap();
        }
    },

    getMapByName : function(sName)
    {
        var nMaps = this._aoMapWidget.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = this._aoMapWidget[i];
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
        var nMaps = this._aoMapWidget.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            oMap = this._aoMapWidget[i];
            if (oMap.getDomeId() == sId)
            {
                return oMap;
            }
        }
        return null;
    },

    getMapByIndice : function(nIndice)
    {
        if (nIndice < this._aoMapWidget.length)
        {
            var oMap = this._aoMapWidget[nIndice];
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
            oCommand = this.webLayout.getCommandByName(aAllElements[i].id);
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
 
    sessionSet : function(r)
    {
        console.log('session set');
        this.sessionID = r.responseText;
        if (this.sessionID != '') {
            this.parseWebLayout();
        }
    }
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
