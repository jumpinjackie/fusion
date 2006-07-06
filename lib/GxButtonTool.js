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
Object.extend(GxButtonTool.prototype, 
{
    _sHtmlId : null,
    _sImageURL : null,
    _sDisabledImageURL : null,
    _nWidth : -1,
    _nHeight : -1,
      
    initialize : function(sHtmlId,  nWidth, nHeight, sImageURL, sDisabledImageURL)
    {
        this._sHtmlId = sHtmlId;
        this._sDisabledImageURL = sDisabledImageURL;
        this._sImageURL = sImageURL;
        this._nWidth = nWidth;
        this._nHeight = nHeight;
      
        this._oDomObj = document.getElementById(sHtmlId);
        this._oDomObj.style.width = nWidth + "px";
        this._oDomObj.style.height = nHeight + "px";
        this._oDomObj.style.float = 'left';
        

        if (sDisabledImageURL != null && sDisabledImageURL.length > 0)
        {
            this._oDomObj.style.backgroundImage = 'url(' + sDisabledImageURL + ')';
        }

        this.clickWatcher = this.clickCB.bind(this);
        Event.observe(this._oDomObj,  'click', this.clickWatcher);
    },

    observeEvent : function(sEvent, fnCB)
    {
         Event.observe(this._oDomObj,  sEvent, fnCB);
    },

    stopObserveEvent : function(sEvent, fnCB)
    {
         Event.stopObserving(this._oDomObj,  sEvent, fnCB);
    },

   

    activateTool : function()
    {
        if (this._sImageURL != null && this._sImageURL.length > 0)
        {
            this._oDomObj.style.backgroundImage = 'url(' + this._sImageURL + ')';
        }
    },

    deactivateTool :  function()
    {
        if (this._sDisabledImageURL != null && this._sDisabledImageURL.length > 0)
        {
            this._oDomObj.style.backgroundImage = 'url(' + this._sDisabledImageURL + ')';
        }
    },

    clickCB : function()
    {
        this.activateTool();
    }


});
