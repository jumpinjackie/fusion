/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Manually enter a scale or choose from some previous scales
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
 * The user can manually type in a new scale or can select a previous
 * scale from a drop-down list.
 *
 * **********************************************************************/
//require('jx/picker/jxpicker.js');

var ScaleEntry = Class.create();
ScaleEntry.prototype = 
{
    precision: 4,
    historyLength: 10,
    history: null,
    
    initialize : function(oCommand)
    {
        Object.inheritFrom(this, GxWidget.prototype, ['ScaleEntry', false]);
        this.setMap(oCommand.getMap());
        
        var c = oCommand.oxmlNode.getNodeText('Class');
        
        var d = document.createElement('div');
        if (c != '') {
            Element.addClassName(d, c);
        }
        
        this.picker = new JxPicker(d, true);
        this.picker.addSelectionListener(this);
        
        $(oCommand.getName()).appendChild(d);
        
        var precision = oCommand.oxmlNode.getNodeText('Precision');
        if (precision != '') {
            this.precision = parseInt(precision);
        }
        
        var historyLength = oCommand.oxmlNode.getNodeText('HistoryLength');
        if (historyLength != '') {
            this.historyLength = parseInt(historyLength);
        }
        
        this.history = [];
        
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, null, this.scaleChanged.bind(this));
        
    },
    
    scaleChanged: function() {
        var scale = this.getMap().getCurrentScale();
        scale = parseInt(scale * Math.pow(10,this.precision))/Math.pow(10,this.precision);
        this.picker.setValue(""+scale);
    },
    
    selectionChanged: function(obj) {
        var v = obj.getValue();
        bInHistory = false;
        for (var i=0; i<this.history.length; i++) {
            if (this.history[i] == v) {
                bInHistory = true;
                break;
            }
        }
        var rx = /[0-9]+(\.[0-9]*)?/;
        if (rx.test(v)) {
            v = parseFloat(v);
            if (this.getMap().getScale() != v) {
                this.getMap().zoomScale(v);
                if (!bInHistory) {
                    this.addToHistory(v);
                }
            }
        }
    },
    
    addToHistory: function(scale) {
        this.history.unshift(scale);
        this.picker.add(""+scale, 0);
        if (this.history.length > this.historyLength) {
            this.history.pop();
            this.picker.remove(this.historyLength-1);
        }
    }
};