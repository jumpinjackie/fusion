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
    //array of map widgets. For now only the map from the weblayout is used
    //TODO : use the mapconfig to pass other maps.
    _aoMapWidget : [],

    _aoMapInfo : [],

    webLayout : "",
    webagentURL : "",
    baseURL : "",
    scriptLang : "",
    redirectScript : "",
    createsessionScript : "",
    loadmapScript : "",

    _aWidgetNames : [],
    oInterval : null,

    initialize : function(webLayout, mapConfig, webagentURL, scriptLang)
    {
        this.webLayout = webLayout;
        this.webagentURL = webagentURL;
        this.baseURL = app_base_url;
        this.scriptLang = scriptLang;

        //this.redirectScript = this.baseURL + 'server/' + this.scriptLang  + '/redirect.' + this.scriptLang;
        this.createsessionScript = this.baseURL + 'server/' + this.scriptLang  + '/MGCreateSession.' + this.scriptLang;
        this.loadmapScript =  this.baseURL + 'server/' + this.scriptLang  + '/MGLoadMap.' + this.scriptLang;

        /*create session */
        call(this.createsessionScript, this, this.sessionSet);

         //this.parseWebLayout();
    },

    parseWebLayoutCB : function()
    {
        var mapResourceID = this.webLayout.getMapRessourceId();

        //create session : TODO use mapagent
        //var sUrl = this.createsessionScript;
        //var sUrl = this.redirectScript + '?s='+this.createsessionScript;
        //call(sUrl, this, this.sessionSet);

        /*after the layout is parsed, load the map*/
        this.loadMapDefintions();
        
    },

    parseWebLayout : function()
    {
        //get the xml of the 
        
        this.webLayout = new MGWebLayout(this.webLayout, this.webagentURL, this.sessionID);
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


    loadMapDefintions : function()
    {
        //get initial infos for the map : TODO use mapgaent if possible
      //var sUrl = this.redirectScript + '?s='+this.loadmapScript + '&mapid='+this.webLayout.getMapRessourceId()+"&session="+this.sessionID;
      var sUrl = this.loadmapScript + '&mapid='+this.webLayout.getMapRessourceId()+"&session="+this.sessionID;
         call (sUrl, this, this.mapLoaded);
        
    },

    /**
     * Parse the content of the configuration settings
     */
    mapLoaded : function(r)
    {
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

            this._aoMapInfo.push(new _MapInfo(mapid,mapname,metersperunit,aExtents));

            this.loadWidgets();
        }
    },
    

    /**
     * Parse the content of the configuration settings
     */
    serverSet : function(r)
    {
        if (r.responseXML)
        {       
            var oString;
            var nLength;
            var oNode = new DomNode(r.responseXML.childNodes[0]);
            //oServer = oNode.findFirstNode('serverurl');
        
            oString = oNode.getNodeText('webagent_url');
            nLength = oString.length;
            slastChar =  oString.charAt((nLength-1));

            if (slastChar != '?' && slastChar != '&')
            {
              if (oString.search(/\?/) == -1)
                oString = oString + "?";
              else
               oString = oString + "&";
            }
            this.webagentURL = oString;

            oString = oNode.getNodeText('base_url');
            nLength = oString.length;
            slastChar =  oString.charAt((nLength-1));
            if (slastChar != '/')
            {
              oString = oString + "/";
            }
            this.baseURL = oString;

            this.scriptLang =  oNode.getNodeText('script_lang');

            //this.redirectScript =  this.baseURL + 'server/' + this.scriptLang  + '/redirect.' + this.scriptLang;
            this.createsessionScript = this.baseURL + 'server/' + this.scriptLang  + '/MGCreateSession.' + this.scriptLang;
            this.loadmapScript =  this.baseURL + 'server/' + this.scriptLang  + '/MGLoadMap.' + this.scriptLang;
        
            this.parseWebLayout();
       
        }
    
    },
    
    
    getListofWidgets : function()
    {
        var aAllElements = document.body.getElementsByTagName('*');
        var oCommand = null;
        var sTmp;
        var aCommands = [];
        
        for (var i = 0; i < aAllElements.length; i++) 
        {
            oCommand = this.webLayout.getCommadByName(aAllElements[i].id);
            if (oCommand != null)
            {
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
            if (aCommands[i].getType() == 'BasicCommandType')
            {
                sTmp = "MG" + aCommands[i].getAction(); 
                this._aWidgetNames.push(sTmp);
            }
        }
        
        for (var i=0; i< this._aWidgetNames.length; i++)
        {
            goApp.addToScriptArray(app_base_url + 'widgets/' + this._aWidgetNames[i] + '.js',
                                    this._aWidgetNames[i]);
        }
        goApp.loadScriptArray(this, this.checkScriptsLoaded2);
    },

    createWidgets :  function()
    {
        
        this.createMapWidget();
        
        this.createBasicCommandWidgets();
        //TODO : create all other widgets

    },

    //convension for the widgets :
    // * basic command widgets will be names MG[Action] with file name being MG[Action].js
    //   -ex ZoomIn = MGZoom()
    // *  basic command widgets will be located under base_url/widgets/
    //
    createMapWidget : function()
    {
        var nMaps = this._aoMapInfo.length;
        var oMap;
        for (var i=0; i<nMaps; i++)
        {
            //TODO : expand the weblayout to have a map command
            oMap = new MGMap('mapdiv', this._aoMapInfo[i].mapname,
                             this._aoMapInfo[i].metersperunit, 
                             this._aoMapInfo[i].aExtents,
                             this);
            this._aoMapWidget.push(oMap);
            oMap.drawMap();
        }
    },

    createBasicCommandWidgets : function()
    {
        var aAllElements = document.body.getElementsByTagName('*');
        var oCommand = null;
        var sTmp;

        
        for (var i = 0; i < aAllElements.length; i++) 
        {
            oCommand = this.webLayout.getCommadByName(aAllElements[i].id);
            
            if (oCommand != null && oCommand.getType() == 'BasicCommandType')
            {
                //for now alaws use the first map. When we integrate a map indicator
                //as part of the command, we will use the specified map
                var sTmp = 'new MG' + oCommand.getAction()+ '(this._aoMapWidget[0],oCommand)';
                eval(sTmp);
            }
            oCommand = null;
        }
    },

    sessionSet : function(r)
    {
        if (r.responseXML)
        {
            var sessionNode = new DomNode(r.responseXML.childNodes[0]);
            this.sessionID = sessionNode.getNodeText('sessionid');
        
            if (this.sessionID != '') 
            {
                /* parse layout if session ise set */
                this.parseWebLayout();

                //this.loadMapDefintions();
            }
        }
    }
});

/**
 * _MapInfo
 *
 * Utility class to keep basic initial about the map 
 *
 */
function _MapInfo(mapid,mapname,metersperunit,aExtents)
{
    this.mapid = mapid;
    this.mapname = mapname;
    this.metersperunit = metersperunit;
    this.aExtents = aExtents;
}
