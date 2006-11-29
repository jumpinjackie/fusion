/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Manually enter a radius for the SelectRadius
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
 * The user can manually enter a radius for the SelectRadius widget.
 *
 * **********************************************************************/

var SelectRadiusValue = Class.create();
SelectRadiusValue.prototype = 
{
    initialize : function(oCommand)
    {
        Object.inheritFrom(this, GxWidget.prototype, ['SelectRadiusValue', false]);
        this.setMap(oCommand.getMap());
        
        this.radiusWidgetName = oCommand.oxmlNode.getNodeText('RadiusName');
        this.label = oCommand.oxmlNode.getNodeText('Label');
        this.className = oCommand.oxmlNode.getNodeText('ClassName');
        
        this.input = document.createElement('input');
        this.input.type = 'text';
        
        this.domObj = document.createElement('div');
        this.domObj.className = this.className;
        if (this.label != '') {
            var span = document.createElement('span');
            span.innerHTML = this.label;
            this.domObj.appendChild(span);
        }
        this.domObj.appendChild(this.input);
        
        if (oCommand.getName() != '') {
            $(oCommand.getName()).appendChild(this.domObj);
        }
        this.radiusChangeWatcher = this.updateFromWidgetValue.bind(this);
        Event.observe(this.input, 'blur', this.onBlur.bind(this));
        this.getMap().registerForEvent(MAP_LOADED, this.mapLoaded.bind(this));
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.mapExtentsChanged.bind(this));
        
    },
    
    mapLoaded: function() {
        if (this.widget) {
            this.widget.deregisterForEvent(RADIUS_CHANGED, this.radiusChangeWatcher);
        }
        var widgets = Fusion.getWidgetsByType('SelectRadius');
        for (var i=0; i<widgets.length; i++) {
            if (widgets[i].sName == this.radiusWidgetName) {
                this.widget = widgets[i];
                this.widget.registerForEvent(RADIUS_CHANGED, this.radiusChangeWatcher)
            }
        }
        this.updateFromWidgetValue();
    },
    
    mapExtentsChanged: function() {
        this.updateWidgetValue();
    },
    
    onBlur: function() {
        this.updateWidgetValue();
    },
    
    updateWidgetValue: function() {
        if (this.widget) {
            var radius = this.getMap().geoToPixMeasure(this.input.getValue());
            this.widget.setRadius(radius);
        }
    },
    
    updateFromWidgetValue: function() {
        if (this.widget) {
            this.input.value = this.getMap().pixToGeoMeasure(this.widget.getRadius());
        }
    }
};