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
  
    initialize : function(oCommand)  {
        //console.log('Fusion.Tool.Button.initialize');
        var json = oCommand.jsonNode;
        this._sHtmlId = oCommand.getName();
        this._sDisabledImageURL = json.DisabledImageURL ? json.DisabledImageURL[0]: '';
        this._sImageURL = json.ImageURL ? json.ImageURL[0] : '';
        
        if (this._sDisabledImageURL == '' && this._sImageURL != '') {
            this._sDisabledImageURL = this._sImageURL;
        } else if (this._sImageURL == '' && this._sDisabledImageURL != '') {
            this._sImageURL = this._sDisabledImageURL;
        }
        this._nWidth = json.Width ? parseInt(json.Width[0]) : null;
        this._nHeight = json.Height ? parseInt(json.Height[0]) : null;

        this._sTooltip = json.Tooltip ? json.Tooltip[0] : '';
        this._sDescription = json.Description ? json.Description[0] : '';
        this._sLabel = json.Label ? json.Label[0] : '';
        
        this.sImageClass = json.ImageClass ? json.ImageClass[0] : '';
        this.sActiveClass = json.ActiveClass ? json.ActiveClass[0] : 'jxButtonActive';
        
        this.sDisabledClass = json.DisabledClass ? json.DisabledClass[0] : 'jxButtonDisabled';
        
        this.buttonAction = new Jx.Action(this.buttonClicked.bind(this));
        
        if (oCommand.getName() != '') {
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
        
        var startDisabled = json.Disabled ? json.Disabled[0] : 'false';
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
