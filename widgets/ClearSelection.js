/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Fit to window (full extents)Clear current selection
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
 * **********************************************************************/

Fusion.require('widgets/GxButtonBase.js');

var ClearSelection = Class.create();
ClearSelection.prototype = 
{
    initialize : function(oCommand)
    {
        //console.log('ClearSelection.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ClearSelection', false, oCommand]);
        Object.inheritFrom(this, GxButtonBase.prototype, []);
        this.setMap(this._oCommand.getMap());
        
        this.enable = ClearSelection.prototype.enable;
        
        this.getMap().registerForEvent(MAP_SELECTION_ON, this.enable.bind(this));
        this.getMap().registerForEvent(MAP_SELECTION_OFF, this.disable.bind(this));
    },
    
    /**
     * clears slection on map.
     */
    execute : function()
    {
        this.getMap().clearSelection();
        
    },
    
    enable: function() {
        if (this.oMap && this.oMap.hasSelection()) {
            GxButtonBase.prototype.enable.apply(this, []);
        } else {
            this.disable();
        }
    }
};
