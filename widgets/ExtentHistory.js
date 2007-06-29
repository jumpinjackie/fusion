/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Maintain and navigate through a history of extents
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
 * Maintain and navigate through a history of extents
 * 
 * **********************************************************************/



var HISTORY_CHANGED = 0;

var ExtentHistory = Class.create();
ExtentHistory.prototype = 
{
    events: [],
    aHistory: [],
    sDirection: null,
    initialize : function(oCommand)
    {
        //console.log('FitToWindow.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['ExtentHistory', false, oCommand]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, []);
        
        this.setMap(oCommand.getMap());
        
        var sDirection = oCommand.jsonNode.Direction ? oCommand.jsonNode.Direction[0].toLowerCase() : 'previous';
        if (sDirection != 'previous' && sDirection != 'next') {
            this.sDirection = 'previous';
        } else {
            this.sDirection = sDirection;
        }
        
        if (!this.aHistory['history']) {
            this.aHistory['history'] = [];
            this.aHistory['index'] = -1;
            this.getMap().registerForEvent(Fusion.Event.MAP_EXTENTS_CHANGED, this.extentsChanged.bind(this));
            this.getMap().registerForEvent(MAP_LOADED, this.reset.bind(this));
            
        }
        this.enable = ExtentHistory.prototype.historyChanged;
        
        this.disable = ExtentHistory.prototype.historyChanged;
        
        this.registerEventID(HISTORY_CHANGED);
        
        this.registerForEvent(HISTORY_CHANGED, this.historyChanged.bind(this));
        //console.log(this.events[HISTORY_CHANGED].length);
        this.disable();
    },
    
    reset: function() {
        if (this.getMap().isMapLoaded()) {
            this.aHistory['history'] = [this.getMap().getCurrentExtents()];
            this.aHistory['index'] = 0;
        } else {
            this.aHistory['history'] = [];
            this.aHistory['index'] = -1;
        }
        this.historyChanged();
    },
    
    extentsChanged: function() {
        var extents = this.getMap().getCurrentExtents();
        if (this.aHistory['history'].length == 0) {
            this.aHistory['history'].push(extents);
            this.aHistory['index'] = 0;
        } else {
            var aExtents = this.aHistory['history'][this.aHistory['index']];
            if (aExtents[0] == extents[0] &&
                aExtents[1] == extents[1] &&
                aExtents[2] == extents[2] &&
                aExtents[3] == extents[3]) {
                return;
            }
            //clear forward history if we have gone backwards at some point
            if (this.aHistory['index'] != (this.aHistory['history'].length - 1)) {
                this.aHistory['history'] = this.aHistory['history'].slice(0, this.aHistory['index'] + 1);
            }
            this.aHistory['history'].push(extents);
            this.aHistory['index'] = this.aHistory['history'].length - 1;
        }
        this.triggerEvent(HISTORY_CHANGED);
    },
    
    historyChanged: function() {
        if (this.sDirection == 'previous') {
            if (this.aHistory['index'] > 0) {
                Fusion.Tool.ButtonBase.prototype.enable.apply(this,[]);
            } else {
                Fusion.Tool.ButtonBase.prototype.disable.apply(this,[]);
            }
        } else {
            if (this.aHistory['index'] < (this.aHistory['history'].length - 1)) {
                Fusion.Tool.ButtonBase.prototype.enable.apply(this,[]);
            } else {
                Fusion.Tool.ButtonBase.prototype.disable.apply(this,[]);
            }
        }
    },

    execute: function() {
        if (this.sDirection == 'previous') {
            if (this.aHistory['index'] > 0) {
                this.aHistory['index'] --;
                this.getMap().setExtents(this.aHistory['history'][this.aHistory['index']]);
                this.triggerEvent(HISTORY_CHANGED);
            }
        } else {
            if (this.aHistory['index'] < (this.aHistory['history'].length - 1)) {
                this.aHistory['index'] ++;
                this.getMap().setExtents(this.aHistory['history'][this.aHistory['index']]);
                this.triggerEvent(HISTORY_CHANGED);
            }
        }
    }
};