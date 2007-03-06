/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Select a color for some purpose
 * @author pspencer@dmsolutions.ca
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
 * The user can pick from a palette of web-safe colors or enter a hex value
 *
 * **********************************************************************/
Fusion.require('widgets/GxButtonBase.js');

var ColorPicker = Class.create();
ColorPicker.prototype = 
{
    /* HTML input element that is used to store both the initial
       value for this widget and receives the color value as the
       color changes */
    colorInput: null,

    /* Int (0-100) containing the alpha chosen by the user */
    alpha: 100,
    
    /* String containing the HEX value of the color chosen by the
       user, in RRGGBB format */
    color: '#000000',
    
    /* shared reference to the color picker object */
    picker: [null],
    
    /* shared reference to the current instance of this widget that is using the color picker */
    currentPicker: [null],
    
    initialize : function(oCommand) {
        Object.inheritFrom(this, GxWidget.prototype, ['ColorPicker', false, oCommand]);
        /* override the image !!! */
        oCommand.jsonNode.DisabledImageURL = ['images/a_pixel.png'];
        oCommand.jsonNode.ImageURL = ['images/a_pixel.png'];
        
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        
        if (oCommand.jsonNode.ColorInputId) {
            this.colorInput = $(oCommand.jsonNode.ColorInputId[0]);
        }
        
        if (this.colorInput) {
            this.alpha = 100 * parseInt('0x'+this.colorInput.value.substring(0,2))/255;
            this.color = '#'+this.colorInput.value.substring(2);
            //Event.observe(this.colorInput, 'change', this.inputChanged.bind(this));
            this.colorInput.widget = this;
        }
        
        if(!this.picker[0]) {
            this.picker[0] = new JxColorPicker({color: this.color, alpha: this.alpha});
        }
        
        this._oButton._oButton.domImg.style.backgroundColor = this.color;
        Element.addClassName(this._oButton._oButton.domImg, "jxButtonSwatch");
    },
    
    colorChanged: function(picker) {
        this._oButton._oButton.domImg.style.backgroundColor = this.picker[0].color;
        var a = parseInt(this.picker[0].alpha*255).toString(16);
        var c = a + this.picker[0].color.substring(1);
        if (this.colorInput) {
            this.colorInput.value = c;
        }
    },
    
    inputChanged: function() {
        var value = this.colorInput.value.toUpperCase();
        var alpha = value.substring(0,2);
        var color = value.substring(2);
        this.alpha = 100 * parseInt('0x'+alpha)/255;
        this.color = '#'+color;
        this.picker[0].setAlpha(this.alpha);
        this.picker[0].setColor(this.color);
    },
    
    execute: function() {
        if (this.currentPicker[0] != this) {
            if (this.currentPicker[0]) {
                this.picker[0].removeColorChangeListener(this.currentPicker[0]);
            }
            this.currentPicker[0] = this;
            this.picker[0].addColorChangeListener(this);
            this._oDomObj.appendChild(this.picker[0].domObj);
            this.picker[0].setAlpha(this.alpha);
            this.picker[0].setColor(this.color);
        }
        this.picker[0].show();
    }
};