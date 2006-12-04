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

    /* String containing the HEX value of the alpha chosen by the
       user */
    alpha: 'FF',
    
    /* String containing the HEX value of the color chosen by the
       user, in RRGGBB format */
    color: '#000000',
    
    /* reference to the color picker object */
    picker: null,
    
    initialize : function(oCommand) {
        Object.inheritFrom(this, GxWidget.prototype, ['ColorPicker', false]);
        /* override the image !!! */
        var imgURL = oCommand.oxmlNode.findFirstNode('DisabledImageURL');
        if (imgURL) {
            imgURL.setTextContent('images/a_pixel.png');
        } else {
            imgURL = oCommand.oxmlNode.findFirstNode('ImageURL');
            if (imgURL) {
                imgURL.setTextContent('images/a_pixel.png');
            } else {
                oCommand.oxmlNode.appendChild(DomNodeFactory.create('ImageURL', 'images/a_pixel.png'));
            }
        }
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        var id = oCommand.oxmlNode.getNodeText('ColorInputId');
        if (id != '') {
            this.colorInput = $(id);
        }
        
        if (this.colorInput) {
            this.alpha = parseInt('0x'+this.colorInput.value.substring(0,2))/255;
            this.color = '#'+this.colorInput.value.substring(2);
        }
        
        this.picker = new JxColorPicker({color: this.color, alpha: this.alpha});
        this._oDomObj.appendChild(this.picker.domObj);
        
        this._oButton._oButton.domImg.style.backgroundColor = this.color;
        this.picker.addColorChangeListener(this);
    },
    
    colorChanged: function(picker) {
        this._oButton._oButton.domImg.style.backgroundColor = this.picker.color;
        var a = parseInt(this.picker.alpha*255).toString(16);
        var c = a + this.picker.color.substring(1);
        if (this.colorInput) {
            this.colorInput.value = c;
        }
    },
    
    execute: function() {
        console.log('ColorPicker.execute()');
        this.picker.show();
    }
};