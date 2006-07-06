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
Object.extend(MGChameleonApp.prototype, 
{
    aLibScripts : [],
    sWebLayout : "",
    oMapConfig : "",
    sServerConfig : "",
    sWebagentURL : "",
    sWebTierURL : "",
    sRedirectScript : "",  
    sScriptLang : "",
    oInterval : null,

    oInterval2 : null,
    loadScriptCBFct : null,
    loadScriptCBObj : null,
    aScriptClass : [],
    aScriptURL : [],

    initialize : function(serverConfig, webLayout, mapConfig)
    {
        this.aLibScripts = ['MGConfigMgr', 'EventMgr',  'MGWebCommand', 'MGWebCommandBasic',
                            'MGWebLayout']; 


        this.sWebLayout = webLayout;
        this.oMapConfig = mapConfig;
        this.sServerConfig = serverConfig;


        //extract from config file
        this.sWebagentURL = "";
        this.sScriptLang = "";

        if (serverConfig != null)
        {
            call (serverConfig, this, this.serverSet);
        }
    },
    
    checkScriptsLoaded2 : function()
    {
        if (this.aScriptClass.length > 0)
        {
            var sTmp = "window."+this.aScriptClass[0];
            if (typeof eval(sTmp) == "function")
            {
                this.aScriptClass.shift();
            }
        }


        if (this.aScriptClass.length == 0 && this.oInterval2 != null)
        {
            
            clearInterval(this.oInterval2);
            if (this.loadScriptCBFct != null && this.loadScriptCBObj != null)
            {
                eval(this.loadScriptCBFct(this.loadScriptCBObj));
            }
            this.oInterval2 = null;
            this.loadScriptCBFct = null;
            this.loadScriptCBObj = null;
            this.aScriptClass = [];
            
        }
    },

    checkScriptsLoaded : function()
    {
        if (this.aLibScripts.length > 0)
        {
            var sTmp = "window."+this.aLibScripts[0];
            if (typeof eval(sTmp) == "function")
            {
                this.aLibScripts.shift();
            }
        }

        if (this.aLibScripts.length == 0 && this.oInterval != null)
        {
            clearInterval(this.oInterval);
            this.loadConfig();
            this.oInterval = null;
        }
    },

    loadLibScripts : function()
    {
        for (var i=0; i<this.aLibScripts.length; i++)
        {
            this.loadScript(chameleon_url + 'lib/' + this.aLibScripts[i] + '.js');
        }

        this.oInterval = setInterval(this.checkScriptsLoaded.bind(this), 1000);
        //oInterval=setInterval('checkScriptsLoaded()',1000);
        
    },

    
    /**
   * Dynamically load a script file if it has not already been loaded.
   * @param url The url of the script. Comes from Mapbuilder.
   */
    loadScript : function(url)
    {
        if(!document.getElementById(url))
        {
            var script = document.createElement('script');
            script.defer = false;
            script.type = "text/javascript";
            script.src = url;
            script.id = url;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    },

    addToScriptArray : function(url, szFunctionName)
    {
        this.aScriptURL.push(url);
        if (szFunctionName && szFunctionName.length > 0)
        {
              this.aScriptClass.push(szFunctionName);
        }
    },

    loadScriptArray : function(cbObject, cbFunction)
    {
        for (var i=this.aScriptURL.length - 1; i >= 0; i--)
        {
            this.loadScript(this.aScriptURL[i]);
        }
        
        this.aScriptURL = [];

        this.oInterval2 = setInterval(this.checkScriptsLoaded2.bind(this), 1000);

        if (cbFunction != null)
        {
            this.loadScriptCBFct = cbFunction;
            this.loadScriptCBObj = cbObject;
        }
    },

    loadConfig : function()
    {
        this.oConfigMgr = new MGConfigMgr(this.sWebLayout, this.oMapConfig, this.sWebagentURL,
                                          this.sScriptLang, this.sRedirectScript);
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
            var sTmp = this.sWebTierURL + "mapagent/mapagent.fcgi?";
            this.sWebagentURL = this.sRedirectScript +"?s="+sTmp;

            /*deduce the chameleon url which is set globally*/
            chameleon_url = this.sWebTierURL + "chameleon/";

            this.loadLibScripts();
        }
    },
    
});




