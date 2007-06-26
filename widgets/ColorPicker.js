/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Select a color for some purpose
 * @author pspencer@dmsolutions.ca
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
 * The user can pick from a palette of web-safe colors or enter a hex value
 *
 * **********************************************************************/


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
    
    picker: null,
    
    initialize : function(oCommand) {
        Object.inheritFrom(this, Fusion.Widget.prototype, ['ColorPicker', false, oCommand]);
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
            this.colorInput.widget = this;
        }
        
        this.picker = new Jx.ColorPicker({color: this.color, alpha: this.alpha});
        this.picker.addColorChangeListener(this);
        
        this._oButton._oButton.domObj.parentNode.replaceChild(this.picker.domObj, this._oButton._oButton.domObj);
    },
    
    colorChanged: function(picker) {
        var a = parseInt(this.picker[0].alpha*255).toString(16);
        var c = a + this.picker[0].color.substring(1);
        if (this.colorInput) {
            this.colorInput.value = c;
        }
    },
    
    execute: function() {
        this.picker.addColorChangeListener(this);
        this.picker.setAlpha(this.alpha);
        this.picker.setColor(this.color);
        this.picker.show();
    }
};