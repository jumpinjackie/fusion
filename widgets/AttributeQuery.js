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
 
var AttributeQuery = Class.create();
AttributeQuery.prototype = {
    spatialFilter: null,
    filters: null,
    layerName: null,
    initialize: function(oCommand) {
        //console.log('AttributeQuery.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['AttributeQuery', true, oCommand]);
        this.setMap(oCommand.getMap());

        var json = oCommand.jsonNode;
        
        this.layerName = json.LayerName ? json.LayerName[0] : '';
        
        this.maxDimension = json.MaximumZoomDimension ? json.MaximumZoomDimension[0] : -1;
        this.zoomFactor = json.ZoomFactor ? json.ZoomFactor[0] : 2;

        this.searchCategory = json.SearchCategory[0];

        var oSpatialFilter = json.SpatialFilter ? json.SpatialFilter[0] : '';
        if (oSpatialFilter) {
            this.spatialFilter = new MGSpatialFilter(oSpatialFilter);
        }
        
        this.filters = [];
        if (json.Filter instanceof Array) {
            for (var i=0; i<json.Filter.length; i++) {
                this.filters.push(new MGFilter(json.Filter[i]));
            }
        }
        
        this._oDomObj = $(oCommand.getName());
        Event.observe(this._oDomObj, 'click', this.submitQuery.bind(this));
        
        this.registerEventID(SELECTION_STARTED);
        this.registerEventID(SELECTION_COMPLETE);
        
    },
    
    submitQuery: function() {
        var sd = Fusion.getSearchDefinitions();
        if (sd[this.searchCategory]) {
            var searchParams = {};
            for (var i=0; i<this.filters.length; i++) {
                var filter = this.filters[i];
                var text = filter.getFilterText();
                if (text != '') {
                    if (filter.validate()) {
                        searchParams[filter.parameter] = text;
                    } else {
                        return;
                    }
                }
            }
            
            var defn = sd[this.searchCategory];
            this.currentSearchDefinition = defn;
            var layer = '&layer=' + defn.category.layer;
            var filter = defn.getFilterUrl(searchParams);
            var join = defn.getJoinUrl();
            
            var s = this.getMap().arch + '/' + Fusion.getScriptLanguage() + "/AttributeQuery." + Fusion.getScriptLanguage() ;
            var params = {};
            params.parameters = 'session='+this.getMap().getSessionID()+'&mapname='+ this.getMap().getMapName()+layer+filter+join; 
            params.onComplete = this.queryComplete.bind(this);
            Fusion.ajaxRequest(s, params);
            this.triggerEvent(SELECTION_STARTED);
            
        }
    },
    
    queryComplete: function(r) {
        var result = '';
        eval ('result='+r.responseText);
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
    getResult: function(idx) {
        return this.lastResult.values[idx];
    },
    
    resultHasGeometry: function(idx) {
        return this.lastResult.geometries[idx];
    },
    
    resultJoinValue: function(idx) {
        return this.lastResult.join_values[idx];
    },
    
    zoomToResult: function(condition) {
        //console.log('zoomTo ' + filter);
        var filter = '&filter='+encodeURIComponent(condition);
        var sd = Fusion.getSearchDefinitions();
        var defn = sd[this.searchCategory];
        var joinLayer = defn.join.layer;
        var layerName = this.getMap().layerRoot.findLayerByAttribute('resourceId', joinLayer).layerName;
        var layer = '&layers=' + layerName;
        
        var s = this.getMap().arch + '/' + Fusion.getScriptLanguage() + "/Query." + Fusion.getScriptLanguage() ;
        var params = {};
        params.parameters = 'session='+this.getMap().getSessionID()+'&mapname='+ this.getMap().getMapName()+
                         layer+filter; 
        params.onComplete = this.selectComplete.bind(this);
        Fusion.ajaxRequest(s, params);
    },
    selectComplete: function(r) {
        var node = new DomNode(r.responseXML);
        var success = node.getNodeText('Selection');
        if (success == 'true') {
            this.getMap().deregisterForEvent(MAP_SELECTION_ON, this.fpMapSelectionChanged);
            this.getMap().newSelection();
            this.getMap().getSelection(this.zoomToSelection.bind(this));
            this.getMap().registerForEvent(MAP_SELECTION_ON, this.fpMapSelectionChanged);
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
        var zoom_size = Math.min( this.maxDimension, this.zoomFactor * Math.max( Math.abs(ur.x - ll.x), Math.abs(ur.y - ll.y))) / 2;
        var cX = (ur.x + ll.x)/2;
        var cY = (ur.y + ll.y)/2;
        ll.x = cX - zoom_size;
        ur.x = cX + zoom_size;
        ll.y = cY - zoom_size;
        ur.y = cY + zoom_size;
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
            var s = this.getMap().arch + '/' + Fusion.getScriptLanguage() + "/AttributeQuery." + Fusion.getScriptLanguage() ;
            var params = {};
            params.parameters = 'session='+this.getMap().getSessionID()+'&mapname='+ this.getMap().getMapName()+
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
    parameter: null,
    validators: null,
    initialize: function(json) {
        this.valueId = json.ValueId ? json.ValueId[0] : '';
        this.valueInput = $(this.valueId);
        this.parameter = json.Parameter ? json.Parameter[0] : '';
        
        this.validators = [];
        if (json.Validator) {
            for (var i=0; i<json.Validator.length; i++) {
                this.validators.push(new MGValidator(json.Validator[i]));
            }
        }
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
        }
        var value = filter.getValue(filter.valueInput);
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
    unaryNot: null,
    validOperators: ['=', '<>', '<=', '<', '>=', '>', 'LIKE'],
    initialize: function( json ) {
        Object.inheritFrom(this, MGFilterBase.prototype, [json]);
        
        var b  = json.AllowEmptyValue ? json.AllowEmptyValue[0] : 'false';
        this.allowEmptyValue = (b == '1' || b == 'true') ? true : false ;
        b = json.Not ? json.Not[0] : 'false';
        this.unaryNot = (b == '1' || b == 'true') ? true : false;
                         
    },
    getFilterText: function() {
        return this.getValue(this.valueInput, '');
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