/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Base widget for button type widgets
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
 * Utility base class for a button type widget.
 *
 * Configurations for the buttons come from :
 * - html area : corresponds to the web layout command name
 * - width,height : default are 20,20. Classes should redifine teh
 *   getButtonWidth and getButtonHeight to provide othe values
 * - imageurl : image that will be used when the button is active.
 *   Default value is read from the web layout command imageurl parameter.
 *   Classes can redifine getImageURL.
 * - imageurl : image that will be used when the button is active.
 *   Default value is read from the web layout command disabledimageurl 
 *   parameter.  Classes can redifine getDisabledImageURL.
 * 
 * Clases inheriting should redefine the function activateTool which is
 * called when the button is clicked
 * **********************************************************************/
Fusion.require('widgets/GxButtonTool.js');
 
var GxButtonBase = Class.create();
GxButtonBase.prototype = {
    /**
     * constructor
     * @param oCommand (object) map guide web layout command object
     */
    initialize : function(oCommand) {
        /* overload enable/disable.  Normal inheritance should
         * work but because we use inheritFrom, it doesn't overload
         * GxWidget's enable/disable functions.  We do it manually
         * here.
         */
        this.enable = GxButtonBase.prototype.enable;
        this.disable = GxButtonBase.prototype.disable;

        //console.log('GxButtonBase.initialize');
        this._oCommand = oCommand;
        this._oDomObj = $(oCommand.getName());

        this._oButton = new GxButtonTool(oCommand);
        if (!this.isEnabled()) {
            this._oButton.disableTool();
        }
        this.clickWatcher = this.clickCB.bind(this);
        this._oButton.observeEvent('click', this.clickWatcher);
    },
    
    clickCB : function(e) {
        //console.log('GxButtonBase.clickCB');
        if (this.isEnabled()) {
            this.activateTool();
        }
        Event.stop(e);
        //remove the focus on the button to prevent a problem in IE with some
        //buttons retaining their background colour when they shouldn't
        this._oButton._oButton.domObj.blur();
    },

    activateTool :  function() {
        //console.log('GxButtonBase.activateTool');
        if (this.execute) {
            this.execute();
        }
    },
    
    enable: function() {
        //console.log('button base enable');
        GxWidget.prototype.enable.apply(this,[]);
        this._oButton.enableTool();
    },
    
    disable: function() {
        //console.log('button base disable');
        GxWidget.prototype.disable.apply(this,[]);
        this._oButton.disableTool();
    }
};
