/*****************************************************************************
 *
 *
 * Purpose: Chamelon app initialiization
 *
 * Project: Chameleon interface
 *
 * Author: DM Solutions Group Inc 
 *
 *****************************************************************************
 *
 * Copyright (c) 2005, DM Solutions Group Inc.
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

var chameleon_url = '';

var MGChameleonApp = Class.create();
MGChameleonApp.prototype =
{
    sWebLayout : "",
    oMapConfig : "",
    sServerConfig : "",
    sWebagentURL : "",
    sWebTierURL : "",
    sRedirectScript : "",  
    sScriptLang : "",
    /* broker instance for communicating with the mapagent */
    _oBroker: null,
    oInterval : null,
    aScripts : [],
    
    loadState: null,
    MG_UNLOADED: 0,
    MG_LOAD_CORE: 1,
    MG_LOAD_CONFIG: 2,
    MG_LOAD_WIDGETS: 3,
    MG_LOAD_COMPLETE: 4,

    initialize : function(serverConfig, webLayout, mapConfig)
    {
        this.aScripts = [];
        
        this.sWebLayout = webLayout;
        this.oMapConfig = mapConfig;
        this.sServerConfig = serverConfig;


        //extract from config file
        this.sWebagentURL = "";
        this.sScriptLang = "";

        if (serverConfig != null)
        {
            new Ajax.Request(serverConfig, {method: 'GET', asynchronous: true, onComplete:this.serverSet.bind(this)});
        }
        
        if (!document.__chameleon__) {
            document.__chameleon__ = this;
        }
    },
    setLoadState: function(state) {
        console.log('setLoadState('+state+')');
        this.loadState = state;
        switch(state) {
            case this.MG_LOAD_CORE:
                console.log('load core');
                this.queueScript('lib/MGConfigMgr.js');
                this.queueScript('lib/EventMgr.js');
                this.queueScript('lib/MGWebCommand.js');
                this.queueScript('lib/MGWebCommandBasic.js');
                this.queueScript('lib/MGWebLayout.js');
                this.queueScript('lib/MGBroker.js');
                this.loadQueuedScripts();
                break;
            case this.MG_LOAD_CONFIG:
                console.log('load config');
                this.loadConfig();
                break;
            case this.MG_LOAD_WIDGETS:
                console.log('load widgets');
                this.loadQueuedScripts();
                break;
            case this.MG_LOAD_COMPLETE:
                console.log('load complete');
                this.oConfigMgr.createWidgets();
                break;
        }
    },
    loadQueuedScripts: function() {
        this.aLoadingScripts = [];
        for (var i=0; i<this.aScripts.length; i++) {
            this.aLoadingScripts[i] = this.aScripts[i];
        }
        for (var i=0; i<this.aScripts.length; i++) {
            document.getElementsByTagName('head')[0].appendChild(this.aLoadingScripts[i]);
        }
    },
    /**
   * Dynamically load a script file if it has not already been loaded.
   * @param url The url of the script. Comes from Mapbuilder.
   */
    queueScript : function(url)
    {
        if(!document.getElementById(url) && !this.aScripts[url])
        {
            var script = document.createElement('script');
            script.defer = false;
            script.type = "text/javascript";
            script.src = chameleon_url + url;
            script.id = url;
            script.onload = this.scriptLoaded.bind(this, url);
            this.aScripts[url] = script;
            this.aScripts.push(script);
        }
    },
    scriptLoaded: function(url) {
        console.log('script loaded: '+url);
        for (var i=0; i<this.aScripts.length;i++) {
            if (this.aScripts[i].id == url) {
                this.aScripts[url] = null;
                this.aScripts.splice(i,1);
                this.aLoadingScripts.splice(i,1);
            }
        }
        if (this.aLoadingScripts.length == 0) {
            if (this.aScripts.length > 0) {
                this.loadQueuedScripts();
            } else {
                this.setLoadState(this.loadState+1);
            }
        }
    },
    loadConfig : function()
    {
        this._oBroker = new MGBroker();
        this._oBroker.setSiteURL(this.sRedirectScript + "?s="+this.sWebagentURL, "Administrator", "admin");
        
        this.oConfigMgr = new MGConfigMgr(this.sWebLayout, this.oMapConfig,
                                          this.sWebagentURL, this.sScriptLang,
                                          this.sRedirectScript, this._oBroker);
    },
    
    serverSet : function(r)
    {
        if (r.responseXML)
        {  
            var oNode = new DomNode(r.responseXML.childNodes[0]);

            /*webtier*/
            oString = oNode.getNodeText('webtier_url');
            nLength = oString.length;
            slastChar =  oString.charAt((nLength-1));
            if (slastChar != '/')
            {
                oString = oString + "/";
            }
            this.sWebTierURL = oString;

            /*redirect script*/
            oString = oNode.getNodeText('redirect_script');
            this.sRedirectScript = oString;
            
            /*script language*/
            this.sScriptLang =  oNode.getNodeText('script_lang');

            /*deduce the mapagent url*/
            this.sWebagentURL = this.sWebTierURL + "mapagent/mapagent.fcgi?";

            /*deduce the chameleon url which is set globally*/
            chameleon_url = this.sWebTierURL + "chameleon/";

            //trigger loading stuff ...
            this.setLoadState(this.MG_LOAD_CORE);
        }
    },

   getMapByName : function(sName)
   {
       return this.oConfigMgr.getMapByName(sName);
   },

   getMapById : function(sId)
   {
       return this.oConfigMgr.getMapById(sId);
   },

   getMapByIndice : function(nIndice)
   {
      return this.oConfigMgr.getMapByIndice(nIndice); 
   }   
};



   

function require(url) {
    console.log('require('+url+')');
    if (document.__chameleon__) {
        document.__chameleon__.queueScript(url);
    }
};

Object.inheritFrom = function(destination, source, args) {
    for (property in source) {
        if (typeof destination[property] == 'undefined') {
            destination[property] = source[property];
        }
    }
    source.initialize.apply(destination, args);
};
