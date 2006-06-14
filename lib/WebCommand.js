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
Object.extend(MGWebCommand.prototype, 
{
    sName : "",
    sLabel : "",
    sTooltip : "",
    sDescription : "",
    sImageurl : "",
    sDisabledImageURL : "",
    sTargetViewer : "",
    sType : 'CommandType',

    initialize : function(xmldomeNode)
    {
        initializeMGWebCommand(xmldomeNode);
    },

    initializeMGWebCommand : function(xmldomeNode)
    {
        this.sName = xmldomeNode.getNodeText('Name');
        this.sLabel = xmldomeNode.getNodeText('Label');
        this.sTooltip = xmldomeNode.getNodeText('Tooltip'); //min occurence 0
        this.sDescription = xmldomeNode.getNodeText('Description'); //min occurence 0
        this.sImageurl = xmldomeNode.getNodeText('ImageURL'); //min occurence 0
        this.sDisabledImageURL = xmldomeNode.getNodeText('DisabledImageURL'); //min occurence 0

        this.sTargetViewer = xmldomeNode.getNodeText('TargetViewer');

        this.sType = 'CommandType';
    },

    getName : function()
    {
        return this.sName;
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
    }
    
});
