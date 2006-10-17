/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Maintain and navigate through a history of extents
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
 * Maintain and navigate through a history of extents
 * 
 * **********************************************************************/

require('widgets/GxButtonBase.js');

var gnLastEventId = 0;
HISTORY_CHANGED = gnLastEventId ++;

var ExtentHistory = Class.create();
ExtentHistory.prototype = 
{
    events: [],
    aHistory: [],
    sDirection: null,
    initialize : function(oCommand)
    {
        //console.log('FitToWindow.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['ExtentHistory', false]);
        Object.inheritFrom(this, EventMgr.prototype, []);
        
        this.setMap(oCommand.getMap());
        
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        var sDirection = oCommand.oxmlNode.getNodeText('Direction').toLowerCase();
        if (sDirection != 'previous' && sDirection != 'next') {
            this.sDirection = 'previous';
        } else {
            this.sDirection = sDirection;
        }
        
        if (!this.aHistory['history']) {
            this.aHistory['history'] = [];
            this.aHistory['index'] = -1;
            this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, null, this.extentsChanged.bind(this));
            this.getMap().registerForEvent(MAP_LOADED, null, this.reset.bind(this));
            
        }
        
        this.registerEventID(HISTORY_CHANGED);
        
        this.registerForEvent(HISTORY_CHANGED, null, this.historyChanged.bind(this));
        
        this._oButton.disableTool()
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
                //nothing to do
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
                this._oButton.enableTool();
            } else {
                this._oButton.disableTool();
            }
        } else {
            if (this.aHistory['index'] < (this.aHistory['history'].length - 1)) {
                this._oButton.enableTool();
            } else {
                this._oButton.disableTool();
            }
        }
    },

    /**
     * called when the button is clicked by the GxButtonBase widget
     */
    activateTool : function()
    {
        if (this.sDirection == 'previous') {
            if (this.aHistory['index'] > 0) {
                console.log('ExtentHistory: moving to previous extents');
                this.aHistory['index'] --;
                this.getMap().setExtents(this.aHistory['history'][this.aHistory['index']]);
                this.triggerEvent(HISTORY_CHANGED);
            }
        } else {
            if (this.aHistory['index'] < (this.aHistory['history'].length - 1)) {
                console.log('ExtentHistory: moving to next extents');
                this.aHistory['index'] ++;
                this.getMap().setExtents(this.aHistory['history'][this.aHistory['index']]);
                this.triggerEvent(HISTORY_CHANGED);
            }
        }
    }
};