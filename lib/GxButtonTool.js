/********************************************************************** * 
 * @project Fusion
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
 *
 ***********************************************************************/
 
var GxButtonTool = Class.create();
GxButtonTool.prototype = {
    _sHtmlId : null,
    _sImageURL : null,
    _sDisabledImageURL : null,
    _nWidth : -1,
    _nHeight : -1,
    _oDomObj : null,
    _oDomImg : null,
    bActive: null,
    sActiveClass: null,
    sDisabledClass: null,
  
    initialize : function(oCommand)  {
        //console.log('GxButtonTool.initialize');
                
        this._sHtmlId = oCommand.getName();
        this._sDisabledImageURL = oCommand.oxmlNode.getNodeText('DisabledImageURL');
        this._sImageURL = oCommand.oxmlNode.getNodeText('ImageURL');
        
        if (this._sDisabledImageURL == '' && this._sImageURL != '') {
            this._sDisabledImageURL = this._sImageURL;
        } else if (this._sImageURL == '' && this._sDisabledImageURL != '') {
            this._sImageURL = this._sDisabledImageURL;
        }
        this._nWidth = oCommand.oxmlNode.getNodeText('Width');
        if (this._nWidth != '') {
            this._nWidth = parseInt(this._nWidth);
        } else {
            this._nWidth = null;
        }
        this._nHeight = oCommand.oxmlNode.getNodeText('Height');
        if (this._nHeight != '') {
            this._nHeight = parseInt(this._nHeight);
        } else {
            this._nHeight = null;
        }
        this._sTooltip = oCommand.oxmlNode.getNodeText('Tooltip');
        this._sDescription = oCommand.oxmlNode.getNodeText('Description');
        this._sLabel = oCommand.oxmlNode.getNodeText('Label');
        
        this.sImageClass = oCommand.oxmlNode.getNodeText('ImageClass');
        this.sActiveClass = oCommand.oxmlNode.getNodeText('ActiveClass');
        this.sDisabledClass = oCommand.oxmlNode.getNodeText('DisabledClass');

        if (oCommand.getName() != '') {
            this._oDomObj = $(this._sHtmlId);
        }
        
        if (this._oDomObj) {
            this._oDomA = document.createElement('A');
            this._oDomA.href= '#';

            this._oDomObj.appendChild(this._oDomA);

            this._oDomSpan = document.createElement('span');

            this._oDomImg = document.createElement( 'img' );
            this._oDomImg.src = this._sDisabledImageURL;
            if (this._nWidth) {
                this._oDomImg.width = this._nWidth;
            }
            if (this._nHeight) {
                this._oDomImg.height = this._nHeight;
            }
            this._oDomImg.style.border = '0';
            this._oDomImg.alt = this._sTooltip;
            this._oDomImg.title = this._sTooltip;
            if (this.sImageClass != '') {
                Element.addClassName(this._oDomImg, this.sImageClass);
            }
            this._oDomSpan.appendChild(this._oDomImg);
            this._oDomA.appendChild(this._oDomSpan);
        }
        
        this.bActive = false;
        this.bEnabled = true;
        
        var startDisabled = oCommand.oxmlNode.getNodeText('Disabled');
        if (startDisabled == 'true' || startDisabled == '1') {
            this.disableTool();
        }
    },

    observeEvent : function(sEvent, fnCB) {
        if (this._oDomA) {
            Event.observe(this._oDomA, sEvent, fnCB);
        }
    },

    stopObserveEvent : function(sEvent, fnCB) {
        if (this._oDomA) {
             Event.stopObserving(this._oDomA, sEvent, fnCB);
        }
    },
    
    enableTool : function() {
        if (this._oDomA && this.sDisabledClass != '') {
            Element.removeClassName(this._oDomImg, this.sDisabledClass);
        }
    },

    disableTool : function() {
        if (this._oDomA && this.sDisabledClass != '') {
            Element.addClassName(this._oDomImg, this.sDisabledClass);
        }
    },

    activateTool : function() {
        //console.log('GxButtonTool.activateTool');
        this.bActive = true;
        if (!this._oDomA) {
            return;
        }
        if (this._sImageURL != null && this._sImageURL.length > 0) {
            this._oDomImg.src = this._sImageURL;
        }
        if (this.sActiveClass != '') {
            Element.addClassName(this._oDomA, this.sActiveClass);
        }
    },

    deactivateTool :  function()
    {
        //console.log('GxButtonTool.deactivateTool');
        this.bActive = false;
        if (!this._oDomA) {
            return;
        }
        
        if (this._sDisabledImageURL != null && this._sDisabledImageURL.length > 0) {
            this._oDomImg.src = this._sDisabledImageURL;
        }
        
        if (this.sActiveClass != '') {
            Element.removeClassName(this._oDomA, this.sActiveClass);
        }
    },

    clickCB : function(e) { this.activateTool(); Event.stop(e)},
    isActive: function() {return this.bActive;}
};
