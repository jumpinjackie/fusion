/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Legend widget
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
 * Legend and layer control
 *
 * To put a Legend control in your application, you first need to add a
 * widget to your WebLayout as follows:
 *
 * <Command xsi:type="LegendCommandType">
 *   <Name>MyLegend</Name>
 *   <Label>Legend</Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>Legend</Action>
 *   <ShowRootFolder>false</ShowRootFolder>
 *   <LayerThemeIcon>images/tree_map.png</LayerThemeIcon>
 *   <DisabledLayerIcon>images/tree_layer.png</DisabledLayerIcon>
 *   <RootFolderIcon>images/tree_map.png</RootFolderIcon>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyLegend"></div>
 *
 * The legend will appear inside the element you provide.
 *
 * ShowRootFolder (boolean, optional)
 *
 * This controls whether the tree will have a single root node that
 * contains the name of the map as its label.  By default, the root
 * node does not appear.  Set to "true" or "1" to make the root node
 * appear.
 *
 * RootFolderIcon: (string, optional)
 *
 * The url to an image to use for the root folder.  This only has an
 * affect if ShowRootFolder is set to show the root folder.
 *
 * LayerThemeIcon: (string, optional)
 *
 * The url to an image to use for layers that are currently themed.
 * 
 * DisabledLayerIcon: (string, optional)
 *
 * The url to an image to use for layers that are out of scale.
 *
 * **********************************************************************/
 
var SELECTION_STARTED = 1;
var SELECTION_COMPLETE = 2;

var FDOAttributeQuery = Class.create();
FDOAttributeQuery.prototype = {
    filters: null,
    propertyMappings: null,
    layerName: null,
    resultObj: null,
    override: null,
    initialize: function(oCommand) {
        //console.log('FDOAttributeQuery.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['FDOAttributeQuery', true, oCommand]);
        
        this.setMap(oCommand.getMap());

        var json = oCommand.jsonNode;
        
        this.layerName = json.LayerName ? json.LayerName[0] : null;

        this.filters = [];
        if (json.Filter) {
            for (var i=0; i<json.Filter.length; i++) {
                this.filters.push(new MGFilter(json.Filter[i]));
            }
        }

        this.propertyMappings = [];
        if (json.PropertyMapping) {
            for (var i=0; i<json.PropertyMapping.length; i++) {
                this.propertyMappings.push(new MGPropertyMapping(json.PropertyMapping[i]));
            }
        }

        this.override = json.MultiJoinOverrides ? new MGOverride(json.MultiJoinOverrides[0].Override[0]) : null;
        this._oDomObj = $(oCommand.getName());
        
        this.resultObj = $(json.ResultId ? json.ResultId[0] : null);
        
        Event.observe(this._oDomObj, 'click', this.submitQuery.bind(this));
        this.registerEventID(SELECTION_STARTED);
        this.registerEventID(SELECTION_COMPLETE);
                
        this.fpMapSelectionChanged = this.mapSelectionChanged.bind(this);
        
        this.getMap().registerForEvent(MGMAP_SELECTION_ON, this.fpMapSelectionChanged);
    },
    
    submitQuery: function() {
        var filter = '&filter=';
        var nFilters = 0;
        var sep = '';
        for (var i=0; i<this.filters.length; i++) {
            if (!this.filters[i].validate()) {
                //console.log('validation failed');
                return;
            }
            var filterText = this.filters[i].getFilterText();
            if (filterText != '') {
                filter = filter + sep + '(' + filterText + ')';
                sep = ' AND ';
                nFilters ++;
            }
        }
        
        if (nFilters > 0) {
            filter = encodeURI(filter);
        } else {
            filter = '';
        }
        
        var override = '';
        if (this.override) {
            override = this.override.getFilterText();
        }
        
        var s = 'server/' + Fusion.getScriptLanguage() + "/MGAttributeQuery." + Fusion.getScriptLanguage() ;
        var params = {};
        params.parameters = 'session='+Fusion.getSessionID()+'&mapname='+ this.getMap().getMapName()+
                         '&layer='+this.layerName+filter+override; 
        params.onComplete = this.queryComplete.bind(this);
        Fusion.ajaxRequest(s, params);
        this.triggerEvent(SELECTION_STARTED);
    },
    
    queryComplete: function(r) {
        //console.log('query complete');
        var result;
        eval(r.responseText);
        this.lastResult = result;
        this.triggerEvent(SELECTION_COMPLETE);
    },
    getProperties: function() {
        var properties = null;
        if (this.lastResult && this.lastResult.properties) {
            properties = this.lastResult.properties;
        }
        return properties;
    },
    getNumberOfProperties: function() {
        var n = 0;
        if (this.lastResult && this.lastResult.properties) {
            n = this.lastResult.properties.length;
        }
        return n;
    },
    getProperty: function(n) {
        var property = '';
        if (this.lastResult && this.lastResult.properties) {
            property = this.lastResult.properties[n];
        }
        return property;
    },
    getNumberOfResults: function() {
        result = 0;
        if (this.lastResult && this.lastResult.values) {
            result = this.lastResult.values.length;
        }
        return result;
    },
    getFirstResult: function() {
        this.resultOffset = 0;
        return this.getNextResult();
    },
    getNextResult: function() {
        result = null;
        if (this.lastResult && this.lastResult.values) {
            result = this.lastResult.values[this.resultOffset++];
        }
        return result;
    },
    zoomToResult: function(filter) {
        //console.log('zoomTo ' + filter);
        var filter = '&filter='+filter;
        
        var s = 'server/' + Fusion.getScriptLanguage() + "/MGQuery." + Fusion.getScriptLanguage() ;
        var params = {};
        params.parameters = 'session='+Fusion.getSessionID()+'&mapname='+ this.getMap().getMapName()+
                         '&layers='+this.layerName+filter; 
        params.onComplete = this.selectComplete.bind(this);
        Fusion.ajaxRequest(s, params);
    },
    selectComplete: function(r) {
        var node = new DomNode(r.responseXML);
        var success = node.getNodeText('Selection');
        if (success == 'true') {
            this.getMap().deregisterForEvent(MGMAP_SELECTION_ON, this.fpMapSelectionChanged);
            this.getMap().newSelection();
            this.getMap().getSelection(this.zoomToSelection.bind(this));
            this.getMap().registerForEvent(MGMAP_SELECTION_ON, this.fpMapSelectionChanged);
        } else {
            this.getMap().clearSelection();
        }    
    },
    /**
     * set the extents of the map based on the pixel coordinates
     * passed
     * 
     * @param selection the active selection, or null if there is none
     */
    zoomToSelection : function(selection) {
        var ll = selection.getLowerLeftCoord();
        var ur = selection.getUpperRightCoord();
        //buffer extents (zoom out by factor of two)
        var dX = ur.x - ll.x;
        var dY = ur.y - ll.y;
        ll.x = ll.x - dX;
        ur.x = ur.x + dX;
        ll.y = ll.y - dY;
        ur.y = ur.y + dY;
        this.getMap().setExtents([ll.x,ll.y,ur.x,ur.y]);
    },
    mapSelectionChanged: function() {
        //console.log('map selection changed');
        this.getMap().getSelection(this.fetchMapSelection.bind(this));
    },
    fetchMapSelection: function(oSelection) {
        var layer = oSelection.getLayerByName(this.layerName);
        if (layer) {
            var override = '';
            if (this.override) {
                override = this.override.getFilterText();
            }
            
            filter = '&filter=';
            
            var propIdx = -1;
            for (var i=0; i<layer.getNumProperties(); i++) {
                //console.log(layer.aPropertiesName[i] + '. .'+this.override.childField);
                if (this.override && layer.aPropertiesName[i] == this.override.childField) {
                    propIdx = i;
                    break;
                }
            }
            
            if (propIdx == -1) {
                return;
            }
            
            var sep = '';
            for (var i=0; i<layer.getNumElements(); i++) {
                var val = layer.getElementValue(i, propIdx);
                filter += sep + '(' + this.override.childField + ' = ' + val + ')';
                sep = ' OR ';
            }
            //console.log('filter: ' + filter);
            var s = 'server/' + Fusion.getScriptLanguage() + "/MGAttributeQuery." + Fusion.getScriptLanguage() ;
            var params = {};
            params.parameters = 'session='+Fusion.getSessionID()+'&mapname='+ this.getMap().getMapName()+
                             '&layer='+this.layerName+filter+override; 
            params.onComplete = this.queryComplete.bind(this);
            Fusion.ajaxRequest(s, params);
            this.triggerEvent(SELECTION_STARTED);
        }
    }
};

var MGFilterBase = Class.create();
MGFilterBase.prototype = {
    valueId: null,
    valueInput: null,
    valueType: null,
    operator: null,
    operatorId: null,
    operatorInput: null,
    validators: null,
    initialize: function(json) {
        this.valueId = json.ValueId ? json.ValueId[0] : '';
        this.valueInput = $(this.valueId);
        this.operator = json.Operator ? json.Operator[0] : '';
        this.operatorId = json.OperatorId ? json.OperatorId[0] : '';
        if (this.operatorId != '') {
            this.operatorInput = $(this.operatorId);
            if (this.operator != '' && this.operatorInput) {
                this.setValue(this.operatorInput, this.operator);
            }
        }
        
        this.validators = [];
        if (json.Validator) {
            for (var i=0; i<json.Validator.length; i++) {
                this.validators.push(new MGValidator(json.Validator[i]));
            }
        }
        this.valueType = json.ValueType ? json.ValueType[0] : '';
    },
    getValue: function( idOrObj, defaultValue ) {
        var result = defaultValue;
        var obj = $(idOrObj);
        
        if (obj) {
            if (obj.tagName == 'INPUT') {
                result = obj.value;
            } else if (obj.tagName == 'SELECT') {
                result = obj.options[obj.selectedIndex].value;
            }
        }
        return result;
    },
    setValue: function( idOrObj, value) {
        var obj = $(idOrObj);
        if (obj) {
            if (obj.tagName == 'INPUT') {
                obj.value = value;
            } else if (obj.tagName = 'SELECT') {
                for (var i=0; i<obj.options.length; i++) {
                    if (obj.options[i].value == value) {
                        obj.options[i].selected = true;
                    }
                }
            }
        }
    },
    validate: function() {
        for (var i=0; i<this.validators.length; i++) {
            if (!(this.validators[i].validate(this))) {
                return false;
            }
        }
        return true;
    }
};

var MGValidator = Class.create();
MGValidator.prototype = {
    domNode: null,
    message: 'validation failed',
    type: '',
    initialize: function(json) {
        this.message = json.Message ? json.Message[0] : this.message;
        this.type = json.Type ? json.Type[0] : this.type;
        this.className = json.ClassName ? json.ClassName[0] : '';
        this.messageId = json.MessageId ? json.MessageId[0] : '';
        this.max = json.Max ? json.Max[0] : '';
        this.min = json.Min ? json.Min[0] : '';
        this.regex = json.Regex ? new RegExp(json.Regex[0]) : null;
        
    },
    validate: function(filter) {
        if ($(this.messageId)) {
            $(this.messageId).innerHTML = '';
        }var value = filter.getValue(filter.valueInput);
        if (value != '' || filter.allowEmptyValue) {
            switch(this.type) {
                case 'regex':
                    if (!this.regex.test(value)) {
                        return this.fail(filter);
                    }
                    break;
                case 'range':
                    var min = this.min;
                    if (min != '') {
                        if (min == '[YEAR]') {
                            var d = new Date();
                            min = d.getFullYear();
                        }
                        min = parseFloat(min);
                        if (value < min) {
                            return this.fail(filter);
                        }
                    }
                    var max = this.max;
                    if (max != '') {
                        if (max == '[YEAR]') {
                            var d = new Date();
                            max = d.getFullYear();
                        }
                        max = parseFloat(max);
                        if (value > max) {
                            return this.fail(filter);
                        }
                    }
                    break;
                    
                default:
                    return true;
            }
        }
        Element.removeClassName($(filter.valueInput), this.className);
        return true;
    },
    fail: function(filter) {
        Element.addClassName($(filter.valueInput), this.className);
        if ($(this.messageId)) {
            $(this.messageId).innerHTML = this.message;
        }
        return false;
    }
};

var MGFilter = Class.create();
MGFilter.prototype = {
    fieldName: null,
    unaryNot: null,
    validOperators: ['=', '<>', '<=', '<', '>=', '>', 'LIKE'],
    initialize: function( json ) {
        Object.inheritFrom(this, MGFilterBase.prototype, [json]);
        
        var b  = json.AllowEmptyValue ? json.AllowEmptyValue[0] : 'false';
        this.allowEmptyValue = (b == '1' || b == 'true') ? true : false ;
        this.fieldName = json.Field[0];
        //console.log('filter for field ' + this.fieldName);
        b = json.Not ? json.Not[0] : 'false';
        this.unaryNot = (b == '1' || b == 'true') ? true : false;
                         
    },
    getFilterText: function() {
        var result = '';
        var value = this.getValue(this.valueInput, '');
        
        this.operator = this.getValue(this.operatorInput, this.operator);
        if ((value != '' || this.allowEmptyValue) && this.operator != '') {
            var sep = (this.valueType == 'String' || this.valueType == 'DateTime') ? "'" : "";
            if (this.valueType == 'String') {
                value = '*' + value + '*';
            }
            var sNot = this.unaryNot ? 'NOT ' : '';
            result = sNot + ' ' + this.fieldName + ' ' + this.operator + ' ' + sep + value + sep;
        }
        return result;
    }

};

var MGPropertyMapping = Class.create();
MGPropertyMapping.prototype = {
    initialize: function(json) {
        this.name = json.Name[0];
        this.value = json.Value[0];
        this.type = json.Type[0];
    },
    getValue: function() {
        return this.value;
    },
    getType: function() {
        return this.type;
    }
};

var MGOverride = Class.create();
MGOverride.prototype = {
    initialize: function(json) {
        this.parent = json.Parent[0];
        this.parentField = json.ParentField[0];
        this.child = json.Child[0];
        this.childField = json.ChildField[0];
        
        var b = json.IdentifyParentAttributes ? json.IdentifyParentAttributes[0] : '';
        this.identifyParentAttributes = (b.toLowerCase() == 'true' || b == '1') ? true : false;
        b = json.UseParentGeometeryInChildSearchResults ?
                json.UseParentGeometeryInChildSearchResults[0] : '';
        this.useParentGeometry = (b.toLowerCase() == 'true' || b == '1') ? true : false;
    },
    getFilterText: function() {
        var result = '&parent='+this.parent;
        result += '&parentfield='+this.parentField;
        result += '&child='+this.child;
        result += '&childfield='+this.childField;
        result += '&includeparentattributes='+(this.identifyParentAttributes ? 1 : 0);
        result += '&useparentgeometry='+(this.useParentGeometry ? 1 : 0);
        
        return result;
    }
};

var MGSpatialFilter = Class.create();
MGSpatialFilter.prototype = {
    validOperators: ['CONTAINS', 'CROSSES', 'DISJOINT', 'EQUALS',
                     'INSIDE', 'INTERSECTS', 'OVERLAPS', 'TOUCHES',
                     'WITHIN', 'COVEREDBY'],

    initialize: function(json) {
        Object.inheritFrom(this, MGFilterBase.prototype, [json]);
    },
    getFilterText: function() {
        var result = '';
        var value = this.getValue(this.valueInput, '');
        if (value == '') {
            return result;
        }
        
        switch(this.valueType) {
            case 'POINT':
                var aValue = value.split(',');
                if (aValue.length == 2) {
                    result = 'POINT(';
                    result += aValue[0] + ' ' + aValue[1];
                    result += ')';
                }
                break;
            case 'LINE':
                var aValue = value.split(',');
                if (aValue.length > 2 && aValue.length % 2 == 0) {
                    result = 'LINE(';
                    var sep = '';
                    for (var i=0; i<aValue.length; i+=2) {
                        result += sep + aValue[i] + ' ' + aValue[i+1];
                        sep = ',';
                    }
                    result += ')';
                }
                break;
            case 'BBOX':
                var aValue = value.split(',');
                if (aValue.length == 4) {
                    result = 'POLYGON((';
                    result += aValue[0] + ' ' + aValue[1];
                    result += ',' + aValue[0] + ' ' + aValue[3];
                    result += ',' + aValue[2] + ' ' + aValue[3];
                    result += ',' + aValue[2] + ' ' + aValue[1];
                    result += ',' + aValue[0] + ' ' + aValue[1];
                    result += '))';
                }
                break;
            case 'WKT':
                result = value;
        }
        return result;
    }
};