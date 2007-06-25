/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Zoom the map by a fixed amount when a button is clicked
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
 * Zoom the map by a fixed amount when a button is clicked
 * 
 * **********************************************************************/



var ZoomOnClick = Class.create();
ZoomOnClick.prototype = 
{
    nFactor: 2,
    initialize : function(oCommand)
    {
        //console.log('ZoomOnClick.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ZoomOnClick', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        var json = oCommand.jsonNode;
        this.nFactor = parseFloat(json.Factor ? json.Factor[0] : this.nFactor);
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    execute : function()
    {
        //console.log('ZoomOnClick.activateTool');
        var center = this.getMap().getCurrentCenter();
        this.getMap().zoom(center.x, center.y, this.nFactor);
    },

    setParameter : function(param, value)
    {
        if (param == "Factor" && value > 0)
        {
            this.nFactor = value;
        }
    }
};
