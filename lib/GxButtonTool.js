/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Utility class used by button type widgets
 * @author yassefa@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license MIT
 * ********************************************************************
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ********************************************************************
 *
 * extended description
 * **********************************************************************/
var GxButtonTool = Class.create();
GxButtonTool.prototype =
{
    _sHtmlId : null,
    _sImageURL : null,
    _sDisabledImageURL : null,
    _nWidth : -1,
    _nHeight : -1,
    _oDomObj : null,
    _oDomImg : null,
    _bEnabled: null,
  
    initialize : function(sHtmlId,  nWidth, nHeight, sImageURL, sDisabledImageURL)
    {
        console.log('GxButtonTool.initialize');
        this._sHtmlId = sHtmlId;
        this._sDisabledImageURL = sDisabledImageURL;
        this._sImageURL = sImageURL;
        this._nWidth = nWidth;
        this._nHeight = nHeight;
      
        this._oDomObj = $(sHtmlId);
        this._oDomObj.style.width = nWidth + "px";
        this._oDomObj.style.height = nHeight + "px";
        
        this._oDomA = document.createElement('A');
        this._oDomA.href= '#';
        
        this._oDomObj.appendChild(this._oDomA);

        this._oDomImg = document.createElement( 'img' );
        this._oDomImg.src = sDisabledImageURL;
        this._oDomImg.width = nWidth;
        this._oDomImg.height = nHeight;
        this._oDomImg.style.border = '0';
        this._oDomA.appendChild(this._oDomImg );

        this._bEnabled = false;
    },

    observeEvent : function(sEvent, fnCB)
    {
         Event.observe(this._oDomA, sEvent, fnCB);
    },

    stopObserveEvent : function(sEvent, fnCB)
    {
         Event.stopObserving(this._oDomA, sEvent, fnCB);
    },

    activateTool : function()
    {
        console.log('GxButtonTool.activateTool');
        if (this._sImageURL != null && this._sImageURL.length > 0)
        {
            this._oDomImg.src = this._sImageURL;
            this._bEnabled = true;
        }
    },

    deactivateTool :  function()
    {
        console.log('GxButtonTool.deactivateTool');
        if (this._sDisabledImageURL != null && this._sDisabledImageURL.length > 0)
        {
            this._oDomImg.src = this._sDisabledImageURL;
            this._bEnabled = false;
        }
    },

    clickCB : function() { console.log('GxButtonTool.clickCB'); this.activateTool(); },
    isEnabled: function() {return this._bEnabled;}
};
