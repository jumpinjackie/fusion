/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Utility class used by button type widgets
 * @author yassefa@dmsolutions.ca
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 ********************************************************************
 *
 * extended description
 *
 ***********************************************************************/
 
Fusion.Tool.Button = Class.create();
Fusion.Tool.Button.prototype = {
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
  
    initialize : function(widgetTag)  {
        //console.log('Fusion.Tool.Button.initialize');
        this._sHtmlId = widgetTag.name;
        this._sDisabledImageURL = widgetTag.DisabledImageURL ? widgetTag.DisabledImageURL[0]: '';
        this._sImageURL = widgetTag.ImageURL ? widgetTag.ImageURL[0] : '';
        
        if (this._sDisabledImageURL == '' && this._sImageURL != '') {
            this._sDisabledImageURL = this._sImageURL;
        } else if (this._sImageURL == '' && this._sDisabledImageURL != '') {
            this._sImageURL = this._sDisabledImageURL;
        }
        this._nWidth = widgetTag.Width ? parseInt(widgetTag.Width[0]) : null;
        this._nHeight = widgetTag.Height ? parseInt(widgetTag.Height[0]) : null;

        this._sTooltip = widgetTag.Tooltip ? widgetTag.Tooltip[0] : '';
        this._sDescription = widgetTag.Description ? widgetTag.Description[0] : '';
        this._sLabel = widgetTag.Label ? widgetTag.Label[0] : '';
        
        this.sImageClass = widgetTag.ImageClass ? widgetTag.ImageClass[0] : '';
        this.sActiveClass = widgetTag.ActiveClass ? widgetTag.ActiveClass[0] : 'jxButtonActive';
        
        this.sDisabledClass = widgetTag.DisabledClass ? widgetTag.DisabledClass[0] : 'jxButtonDisabled';
        
        this.buttonAction = new Jx.Action(this.buttonClicked.bind(this));
        
        if (widgetTag.name != '') {
            this._oDomObj = $(this._sHtmlId);
        }
        
        
        if (this._oDomObj) {
            var options = {};
            options.imgPath = this._sDisabledImageURL;
            options.imgClass = this.sImageClass;
            options.tooltip = this._sTooltip;
            options.label = this._sLabel;
            options.disabledClass = this.sDisabledClass;
            this._oButton = new Jx.Button(this.buttonAction, options);
            this._oDomObj.appendChild(this._oButton.domObj);
        }
        
        this.bActive = false;
        this.bEnabled = true;
        
        var startDisabled = widgetTag.Disabled ? widgetTag.Disabled[0] : 'false';
        if (startDisabled == 'true' || startDisabled == '1') {
            this.disableTool();
        }
    },
    
    buttonClicked: function() {
        
    },

    observeEvent : function(sEvent, fnCB) {
        if (this._oButton) {
             Event.observe(this._oButton.domObj, sEvent, fnCB);
        }
    },
    
    stopObserveEvent : function(sEvent, fnCB) {
        if (this._oButton) {
             Event.stopObserving(this._oButton.domObj, sEvent, fnCB);
        }
    },
    
    enableTool : function() {
        this.buttonAction.setEnabled(true);
    },

    disableTool : function() {
        this.buttonAction.setEnabled(false);
    },

    activateTool : function() {
        //console.log('Fusion.Tool.Button.activateTool');
        this.bActive = true;
        if (!this._oButton) {
            return;
        }
        if (this._sImageURL != null && this._sImageURL.length > 0) {
            this._oButton.setImage(this._sImageURL);
        }
        if (this.sActiveClass != '') {
            Element.addClassName(this._oButton.domA, this.sActiveClass);
        }
    },

    deactivateTool :  function()
    {
        //console.log('Fusion.Tool.Button.deactivateTool');
        this.bActive = false;
        if (!this._oButton) {
            return;
        }
        
        if (this._sDisabledImageURL != null && this._sDisabledImageURL.length > 0) {
            this._oButton.setImage(this._sDisabledImageURL);
        }
        
        if (this.sActiveClass != '') {
            Element.removeClassName(this._oButton.domA, this.sActiveClass);
        }
    },

    clickCB : function(e) { this.activateTool(); },
    isActive: function() {return this.bActive;}
};
