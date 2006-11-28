/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Buffer tool
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
 * 
 *
 * **********************************************************************/
Fusion.require('widgets/GxButtonBase.js');
 
var Buffer = Class.create();
Buffer.prototype = {
    layerName: null,
    layerNameInput: null,
    bufferDistance: null,
    bufferDistanceInput: null,
    bufferUnits: null,
    bufferUnitsInput: null,
    borderColor: null,
    borderColorInput: null,
    fillColor: null,
    fillColorInput: null,
    initialize: function(oCommand) {
        //console.log('Buffer.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Buffer', true]);
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());
        
        /* pick up default values */
        this.layerName = oCommand.oxmlNode.getNodeText('LayerName');
        this.layerNameInput = oCommand.oxmlNode.getNodeText('LayerNameInput', null);
        this.bufferDistance = oCommand.oxmlNode.getNodeText('BufferDistance', 0);
        this.bufferDistanceInput = oCommand.oxmlNode.getNodeText('BufferDistanceInput', null);
        this.bufferUnits = Fusion.unitFromName(oCommand.oxmlNode.getNodeText('BufferUnits', 'meters'));
        this.bufferUnitsInput = oCommand.oxmlNode.getNodeText('BufferUnitsInput', null);
        this.borderColor = oCommand.oxmlNode.getNodeText('BorderColor', '00000000');
        this.borderColorInput = oCommand.oxmlNode.getNodeText('BorderColorInput', null);
        this.fillColor = oCommand.oxmlNode.getNodeText('FillColor', '00000000');
        this.fillColorInput = oCommand.oxmlNode.getNodeText('FillColorInput', null);
        
        /* initialize inputs with defaults */
        if (this.layerNameInput) {
            this.layerNameInput = $(this.layerNameInput);
            this.setValue(this.layerNameInput, this.layerName);
        }
        if (this.bufferDistanceInput) {
            this.bufferDistanceInput = $(this.bufferDistanceInput);
            this.setValue(this.bufferDistanceInput, this.bufferDistance);
        }
        if (this.bufferUnitsInput) {
            this.bufferUnitsInput = $(this.bufferUnitsInput);
            this.setValue(this.bufferUnitsInput, this.bufferUnits);
        }
        if (this.borderColorInput) {
            this.borderColorInput = $(this.borderColorInput);
            this.setValue(this.borderColorInput, this.borderColor);
        }
        if (this.fillColorInput) {
            this.fillColorInput = $(this.fillColorInput);
            this.setValue(this.fillColorInput, this.fillColor);
        }
        
        /* override selection behaviour */
        this.enable = Buffer.prototype.enable;
        this.getMap().registerForEvent(MGMAP_SELECTION_ON, this.enable.bind(this));
        this.getMap().registerForEvent(MGMAP_SELECTION_OFF, this.disable.bind(this));
    },
    
    setValue: function(input, value) {
        if (input.tagName.toLowerCase() == "input") {
            switch(input.type) {
                case 'radio':
                case 'checkbox':
                    for (var i=0; i<input.length; i++) {
                        if (input[i].value == value) {
                            input[i].checked = true;
                        }
                    }
                    break;
                case 'file':
                    break;
                case 'button':
                case 'hidden':
                case 'image':
                case 'password':
                case 'reset':
                case 'submit':
                case 'text':
                    input.value = value;
                    break;
                default:
            }
        }
        if (input.tagName.toLowerCase() == 'textarea') {
            input.value = value;
        }
        if (input.tagName.toLowerCase() == 'select') {
            for (var i=0; i<input.options.length; i++) {
                if (input.options[i].value == value) {
                    input.options[i].selected = true;
                    break;
                }
            }
        }
    },
    
    getValue: function(input) {
        if (input.tagName.toLowerCase() == "input") {
            switch(input.type) {
                case 'radio':
                case 'checkbox':
                    return input.value;
                    break;
                case 'file':
                case 'button':
                case 'hidden':
                case 'image':
                case 'password':
                case 'reset':
                case 'submit':
                case 'text':
                    return input.value;
                    break;
                default:
            }
        }
        if (input.tagName.toLowerCase() == 'textarea') {
            return input.value
        }
        if (input.tagName.toLowerCase() == 'select') {
            return input.options[input.selectedIndex].value;
        }
    },
    
    enable: function() {
        if (this.oMap && this.oMap.hasSelection()) {
            GxButtonBase.prototype.enable.apply(this, []);
        } else {
            this.disable();
        }
    },
    
    execute: function() {
        var layer = '&layer='+this.getValue(this.layerNameInput);
        var distance = '&distance='+this.getValue(this.bufferDistanceInput);
        var distanceUnits = '&distanceunits='+this.getValue(this.bufferUnitsInput);
        var borderColor = '&bordercolor='+this.getValue(this.borderColorInput);
        var fillColor = '&fillcolor='+this.getValue(this.fillColorInput);
        
        var s = 'server/' + Fusion.getScriptLanguage() + "/MGBuffer." + Fusion.getScriptLanguage() ;
        var params = {};
        params.parameters = 'session='+Fusion.getSessionID()+'&mapname='+ this.getMap().getMapName()+layer+distance+distanceUnits+borderColor+fillColor; 
        params.onComplete = this.bufferCreated.bind(this);
        Fusion.ajaxRequest(s, params);
    },
    
    bufferCreated: function() {
        this.getMap().reloadMap();
        this.getMap().drawMap();
    }
};
