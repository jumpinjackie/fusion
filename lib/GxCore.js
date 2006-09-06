/*****************************************************************************
 * Purpose: Chamelon application class
 * Project: Chameleon
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

var CHAMELEON_INITIALIZED = 1;

var chameleon_url = '';

var MGChameleonApp = Class.create();
MGChameleonApp.prototype =
{
    /** 
     * resource ID of the WebLayout to use with this application,
     * set when MGChameleonApp is initialized
     */
    sWebLayout : "",

    //not used??
    oMapConfig : "",

    /**
     * URL to the configuration file to use for this application.  The
     * configuration file must be located on the same domain as the
     * application template.
     */
    sConfigFileURL : "",
    
    sWebAgentURL : "",
    sWebTierURL : "",
    sChameleonURL : "",
    sRedirectScript : "",  
    sScriptLang : "",
    
    /* broker instance for communicating with the mapagent */
    oBroker: null,
    
    /** An array of scripts that are queued to be loaded */
    aScripts : null,
    /** An array of scripts that are currently being loaded */
    aLoadingScripts: null,
    /** The current state during initialization of the application */
    loadState: null,
    
    /** API loading has not begun */
    MG_UNLOADED: 0,
    /** Load the core API scripts */
    MG_LOAD_CORE: 1,
    /** Load the configuration file for the application */
    MG_LOAD_CONFIG: 2,
    /** Load the widget files required by the application */
    MG_LOAD_WIDGETS: 3,
    /** Loading is complete */
    MG_LOAD_COMPLETE: 4,

    /**
     * initialize the Chameleon application.
     *
     * @param serverConfig {String} a URL to the configuration file for this
     *        application
     * @param webLayout {String} a Resource ID of a WebLayout that contains
     *        the widget definitions to be used for this application
     * @param mapConfig {String} (optional) a Resource ID of a MapDefinition 
     *        to be used in place of the default MapDefinition specified
     *        in the webLayout.  If not passed, the MapDefinition specified
     *        in the webLayout will be used.
     */
    initialize : function(serverConfig, webLayout, mapConfig)
    {
        Object.inheritFrom(this, EventMgr.prototype, []);
        
        //IE compatibility for logging stuff
        if (typeof console == 'undefined' || !console) {
            console = document.createElement('div');
            console.id = 'console';
            console.style.position = 'absolute';
            console.style.right = '0px';
            console.style.bottom = '0px';
            console.style.width = '300px';
            console.style.height = '500px';
            console.style.border = '1px solid black';
            console.style.overflow = 'scroll';
            console.style.fontFamily = 'Arial';
            console.style.fontSize = '10px';
            console.log = function(s) {this.innerHTML = s+"<BR>" + this.innerHTML};
            document.body.appendChild(console);
        }
        
        this.aScripts = [];
        this.aLoadingScripts = [];
        
        this.sWebLayout = webLayout;
        this.oMapConfig = mapConfig;
        this.sConfigFileURL = serverConfig;

        //extract from config file
        this.sWebagentURL = "";
        this.sScriptLang = "";

        if (serverConfig != null)
        {
            var options = {};
            //POST is default, but won't work for for regular files
            options.method = 'GET';
            options.onSuccess = this.serverSet.bind(this);
            options.onFailure = this.serverFailed.bind(this);
            
            new Ajax.Request(serverConfig, options);
        }
        
        //global reference to the application object
        if (!document.__chameleon__) {
            document.__chameleon__ = this;
        }
        
        this.registerEventID(CHAMELEON_INITIALIZED);
    },
    /**
     * set the current initialization state of the application.
     * Depending on the state, this will cause various scripts
     * to be loaded.
     *
     * @param state {Integer} the new loading state
     */
    setLoadState: function(state) {
        this.loadState = state;
        switch(state) {
            case this.MG_LOAD_CORE:
                //console.log('load core');
                this.queueScript('lib/MGConfigMgr.js');
                this.queueScript('lib/MGWebCommand.js');
                this.queueScript('lib/MGWebCommandBasic.js');
                this.queueScript('lib/MGWebLayout.js');
                this.queueScript('lib/MGBroker.js');
                this.queueScript('lib/utils.js');
                this.queueScript('lib/GxWidget.js');
                this.loadQueuedScripts();
                break;
            case this.MG_LOAD_CONFIG:
                //console.log('load config');
                this.loadConfig();
                break;
            case this.MG_LOAD_WIDGETS:
                //console.log('load widgets');
                this.loadQueuedScripts();
                break;
            case this.MG_LOAD_COMPLETE:
                //console.log('load complete');
                this.oConfigMgr.createWidgets();
                this.triggerEvent(CHAMELEON_INITIALIZED);
                break;
        }
    },
    /**
     * load any scripts that have been queued for loading.  As the
     * scripts load, they are removed.  When all queued scripts have
     * been loaded, the load state is advanced.  If any of the loaded
     * scripts require other scripts (for inheritance), they will be
     * queued and loaded before the load state is advanced.
     */
    loadQueuedScripts: function() {
        this.aLoadingScripts = [];
        //make a separate array of what is actually being loaded to keep track
        //of them (require adds to aScripts so we can't use that array
        //directly).
        for (var i=0; i<this.aScripts.length; i++) {
            this.aLoadingScripts[i] = this.aScripts[i];
        }
        this.aScripts = [];
        //add the script elements to the DOM to cause them to load.
        for (var i=0; i<this.aLoadingScripts.length; i++) {
            document.getElementsByTagName('head')[0].appendChild(this.aLoadingScripts[i]);
        }
        
        //if IE or Safari
        this.checkLoadInterval = window.setInterval(this.checkLoadingScripts.bind(this), 500);
    },
    /**
     * Insert a new script into the loading queue.  The URL should be relative
     * to the Chameleon base url.  The script will not actually be loaded until
     * loadQueuedScripts is called.
    * @param url The url of the script.
    */
    queueScript : function(url)
    {
        if(!document.getElementById(url) && !this.aScripts[url])
        {
            var script = document.createElement('script');
            script.defer = false;
            script.type = "text/javascript";
            //TODO: test url to see if it needs to come from chameleon
            script.id = url;
            script.src = this.getChameleonURL() + url;
            script.onload = this.scriptLoaded.bind(this, url);
            script.onerror = this.scriptFailed.bind(this, url);
            this.aScripts[url] = script;
            this.aScripts.push(script);
        }
    },
    /**
     * Called when a script fails to load for some reason.
     *
     * @param url {String} the url that failed to load
     *
     * TODO: the application probably won't work if a script fails to load
     * so we need to decide how to inform the user and fail gracefully.
     */
    scriptFailed: function(url) {
        //console.log( 'loading script ' + url + ' failed');
    },
    /**
     * a script has loaded.  It is removed from the various tracking
     * arrays.  When all requested scripts have been loaded, we check
     * to see if any scripts where required by the ones just loaded.
     * If yes, then we loadQueuedScripts again, otherwise we advance
     * the load state.
     *
     * @param url {String} the url of the script that was loaded.
     */
    scriptLoaded: function(url) {
        for (var i=0; i<this.aLoadingScripts.length;i++) {
            if (this.aLoadingScripts[i].id == url) {
                this.aLoadingScripts.splice(i,1);
            }
        }
        if (this.aLoadingScripts.length == 0) {
            window.clearInterval(this.checkLoadInterval);
            if (this.aScripts.length > 0) {
                this.loadQueuedScripts();
            } else {
                this.setLoadState(this.loadState+1);
            }
        }
    },
    /**
     * check if scripts have loaded.  In IE, scripts don't seem to fire the onload
     * event.  Safari also seems to have some problems.
     */
    checkLoadingScripts: function() {
        var agt=navigator.userAgent.toLowerCase();
        for (var i=this.aLoadingScripts.length-1; i>=0; i--) {
            var s = this.aLoadingScripts[i];
            if (s.readyState == 'loaded' ||
                s.readyState == 'complete' ||
                (agt.indexOf("safari") != -1 && s.readyState == null)) {
                this.scriptLoaded(s.id);
            }
        }
    },
    /**
     * asynchronously load the web layout through the broker and config
     * manager.
     *
     * TODO: we assume a user/pass here.  This needs to be moved to the
     * server side component (redirect.php?) to ensure security.
     */
    loadConfig : function()
    {
        this.oBroker = new MGBroker();
        this.oBroker.setSiteURL(this.sRedirectScript + "?s="+this.sWebagentURL, "Administrator", "admin");
        
        this.oConfigMgr = new MGConfigMgr(this);
    },
    /**
     * the server has returned the application configuration file that
     * contains enough information to bootstrap the application.
     *
     * @param r {Object} an XMLHttpRequest object
     *
     * TODO: error handling on failure ... if we get here, the file was
     * found but perhaps is not valid XML or is missing required
     * elements.
     */
    serverSet : function(r)
    {
        if (r.responseXML)
        {  
            var oNode = new DomNode(r.responseXML);

            /*webtier*/
            oString = oNode.getNodeText('webtier_url');
            nLength = oString.length;
            slastChar =  oString.charAt((nLength-1));
            if (slastChar != '/')
            {
                oString = oString + "/";
            }
            this.sWebTierURL = oString;
            //console.log('web tier url set to: '+this.sWebTierURL);

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
        } else {
            //console.log('Error parsing configuration file, it is not valid XML');
        }
    },
    /**
     * the application failed to load the application configuration file.
     * Not much point in continuing, but we can inform the user why this
     * happened.
     *
     * @param r {Object} the XMLHttpRequest object
     *
     * TODO: do something more useful in here.
     */
    serverFailed: function(r) {
        //console.log('error loading server configuration file');
    },

    ajaxRequest: function(scriptURL, options) {
        //console.log('options.parameters='+options.parameters);
        var url = this.getRedirectScript() + '?s=' + this.getChameleonURL() + scriptURL;
        new Ajax.Request( url, options);
    },
    

    getMapByName : function(sName) {
       return this.oConfigMgr.getMapByName(sName);
    },

    getMapById : function(sId) {
       return this.oConfigMgr.getMapById(sId);
    },

    getMapByIndice : function(nIndice) {
      return this.oConfigMgr.getMapByIndice(nIndice); 
    },
    getWidgetById: function(id) {
        return this.oConfigMgr.getWidgetById(id);
    },
    
    getWebLayout: function() { return this.sWebLayout; },
    getChameleonURL: function() {return this.sWebTierURL + 'chameleon/';},
    getWebTierURL: function() { return this.sWebTierURL; },
    getWebAgentURL: function() { return this.sWebTierURL + "mapagent/mapagent.fcgi?"; },
    getConfigFileURL: function() { return this.sConfigFileURL; },
    getMapDefinitionID: function() { return this.oMapConfig; },
    getScriptLanguage: function() { return this.sScriptLang; },
    getRedirectScript: function() { return this.sRedirectScript; },
    getBroker: function() { return this.oBroker; },
    getSessionID: function() { return this.oConfigMgr.getSessionID(); }
};

function require(url) {
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
