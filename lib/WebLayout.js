/*****************************************************************************
 *
 *
 * Purpose: Chameleon app 
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
    webagentURL : '',
    sessionId : '',
    _oBroker: null,  

    initialize: function(webLayout, webagentURL, sessionId, oBroker)
    {   
        this._oBroker = oBroker;
        this.webLayout =  webLayout;
        this.webagentURL = webagentURL;
        this.sessionId = sessionId;

        this.registerEventID(MGWEBLAYOUT_PARSED);
 
    },

    parse : function()
    {
      var r = new MGGetResourceContent(this.webLayout);
        this._oBroker.dispatchRequest(r, this.parseXML.bind(this));
        return;
        
        //call the web agent
        var options = {};
        options.parameters = "VERSION=1.0.0&OPERATION=GETRESOURCECONTENT&RESOURCEID="+this.webLayout+"&session="+this.sessionId;
        options.onSuccess = this.parseXML.bind(this);
        new Ajax.Request(this.webagentURL, options)
        //var url = this.webagentURL+"VERSION=1.0.0&OPERATION=GETRESOURCECONTENT&RESOURCEID="+this.webLayout+"&session="+this.sessionId;
        //call(url, this, this.parseXML);
    },
     
    

    parseXML: function(r)
    {
        if (r.responseXML)
        {
            //alert(r.responseXML.childNodes[0].attributes['xmlns:xsd'].value);
            var mainNode = new DomNode(r.responseXML.childNodes[0]);
            var mapNode = mainNode.findFirstNode("Map");
            this.mapId = mapNode.getNodeText('ResourceId');

  
            var commandSet = mainNode.findFirstNode("CommandSet");
       
            var command = commandSet.findFirstNode('Command');
        
            //TODO : just get the basic commands for now. Other Commands include :
            // CustomCommandType, TargetedCommandType, SearchCommandType,
            //InvokeURLCommandType, BufferCommandType", SelectWithinCommandType,
            //MeasureCommandType, ViewOptionsCommandType, HelpCommandType"
            //InvokeScriptCommandType
            if (command )
            {
                oCommand = new MGWebCommand(command, command.attributes[0].value);
                this.commandObj.push(oCommand);
            
            }

            while ((command = commandSet.findNextNode('Command')))
            {
                this.commandObj.push(new MGWebCommand(command, command.attributes[0].value));
            
            }
            

            this.triggerEvent(MGWEBLAYOUT_PARSED);

            //this.cbObj.parseWebLayoutCB();
            //var ttt = this.cbObj + '.' +  this.cbFunc + '();';
            //alert(ttt);
            //eval('this.cbObj.'+this.cbFunc+'()');
            //this.initialized = 1;
    
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

