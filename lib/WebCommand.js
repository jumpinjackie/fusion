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

var MGWebCommand = Class.create();
MGWebCommand.prototype =
{
    sName : "",
    sLabel : "",
    sTooltip : "",
    sDescription : "",
    sImageurl : "",
    sDisabledImageURL : "",
    sTargetViewer : "",
    sType : 'CommandType',
    oxmlNode : null,
    sAction : "",  
    nWidth : -1,
    nHeight : -1,

    initialize : function(xmldomeNode, sType)
    {
        this.initializeMGWebCommand(xmldomeNode, sType);
    },

    initializeMGWebCommand : function(xmldomeNode, sType)
    {
        this.oxmlNode = xmldomeNode;
        this.sType = 'CommandType';

        if (sType.length > 0)
        {
            this.sType = sType;
        }

        if (xmldomeNode != null)
        {
            this.sName = xmldomeNode.getNodeText('Name');
            this.sLabel = xmldomeNode.getNodeText('Label');
            this.sTooltip = xmldomeNode.getNodeText('Tooltip'); //min occurence 0
            this.sDescription = xmldomeNode.getNodeText('Description'); //min occurence 0
        

            this.sTargetViewer = xmldomeNode.getNodeText('TargetViewer');

            
        
            if (xmldomeNode.getNodeText('Action'))
              {
                  this.sAction = xmldomeNode.getNodeText('Action');
              }

            var sImageurl = xmldomeNode.getNodeText('ImageURL'); //min occurence 0
            if (sImageurl.length > 4 && sImageurl.substring(0,4) == "http")
              this.sImageurl = sImageurl;
            else
              {
                  if (this.sType == 'BasicCommandType')
                    this.sImageurl = chameleon_url + sImageurl;
                  else
                    this.sImageurl = sImageurl;
              }


            var sDisabledImageURL = xmldomeNode.getNodeText('DisabledImageURL'); //min occurence 0
            if (sImageurl.length > 4 && sImageurl.substring(0,4) == "http")
              this.sDisabledImageURL = sDisabledImageURL;
            else
              {
                  if (this.sType == 'BasicCommandType')
                    this.sDisabledImageURL = chameleon_url + sDisabledImageURL;
                  else
                    this.sDisabledImageURL = sDisabledImageURL;
              }
        }
    },

    


    getName : function()
    {
        return this.sName;
    },

    setName : function(sName)
    {
        this.sName = sName;
    },

    getImageURL : function()
    {
        return this.sImageurl;
    },

    getDisabledImageURL : function()
    {
        return this.sDisabledImageURL;
    },

    getType : function()
    {
        return this.sType;
    },

    getAction : function()
    {
        return this.sAction;
    },

    getButtonWidth : function()
    {
        if (this.nWidth > 0)
        {
            return this.nWidth;
        }
        else
        {
            if ( this.oxmlNode != null && this.oxmlNode.getNodeText('Width') != '')
            {
                this.nWidth = parseInt(this.oxmlNode.getNodeText('Width'));
                return this.nWidth;
            }
            else
            {
                return 16; //mapguide default button sizes
            }
        }
    },

    getButtonHeight : function()
    {
        if (this.nHeight > 0)
        {
            return this.nHeight;
        }
        else
        {
            if (this.oxmlNode != null &&  this.oxmlNode.getNodeText('Height') != '')
            {
                this.nHeight = parseInt( this.oxmlNode.getNodeText('Height'));
                return this.nHeight;
            }
            else
            {
                return 16; //mapguide default button sizes
            }
        }
    },

    getMap : function()
    {
        if (this.oxmlNode != null && this.oxmlNode.getNodeText('MapId') != '')
        {
            return document.__chameleon__.getMapById(this.oxmlNode.getNodeText('MapId'));
        }
        else
        {
            //return first map if map id id not defined.
            return document.__chameleon__.getMapByIndice(0);
        }  
    }
    
};
