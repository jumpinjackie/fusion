/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
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
 
var AttributeQuery = Class.create();
AttributeQuery.prototype = {
    spatialFilter: null,
    filters: null,
    layerName: null,
    initialize: function(oCommand) {
        //console.log('AttributeQuery.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['AttributeQuery', true]);
        this.setMap(oCommand.getMap());

        this.layerName = oCommand.oxmlNode.getNodeText('LayerName');

        var oSpatialFilter = oCommand.oxmlNode.findFirstNode('SpatialFilter');
        if (oSpatialFilter) {
            this.spatialFilter = new MGSpatialFilter(oSpatialFilter);
        }
        
        this.filters = [];
        var oFilter = oCommand.oxmlNode.findFirstNode('Filter');
        while (oFilter) {
            this.filters.push(new MGFilter(oFilter));
            oFilter = oCommand.oxmlNode.findNextNode('Filter');
        }

        this._oDomObj = $(oCommand.getName());
        Event.observe(this._oDomObj, 'click', this.submitQuery.bind(this));
    },
    
    submitQuery: function() {
        var filter = '&filter=';
        var nFilters = 0;
        var sep = '';
        for (var i=0; i<this.filters.length; i++) {
            var filterText = this.filters[i].getFilterText();
            if (filterText != '') {
                filter = filter + sep + '(' + filterText + ')'
                sep = ' AND ';
                nFilters ++;
            }
        }
        if (nFilters > 0) {
            filter = encodeURI(filter);
        } else {
            filter = '';
        }
        
        var spatialFilter = '';
        if (this.spatialFilter) {
            spatialFilter = '&spatialfilter='+this.spatialFilter.getFilterText();
        }
        
        var c = document.__chameleon__;
        var s = 'server/' + c.getScriptLanguage() + "/MGQuery." + c.getScriptLanguage() ;
        var params = {};
        params.parameters = 'session='+c.getSessionID()+'&mapname='+ this.getMap().getMapName()+
                         '&layer='+this.layerName+filter+spatialFilter, 
        params.onComplete = this.queryComplete.bind(this);
        c.ajaxRequest(s, params);
    },
    
    queryComplete: function(r) {
        var node = new DomNode(r.responseXML);
        var success = node.getNodeText('Selection');
        if (success == 'true') {
            this.getMap().newSelection();
        } else {
            this.getMap().clearSelection();
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
    initialize: function(oNode) {
        this.valueId = oNode.getNodeText('ValueId');
        this.valueInput = $(this.valueId);
        this.operator = oNode.getNodeText('Operator');
        this.operatorId = oNode.getNodeText('OperatorId');
        if (this.operatorId != '') {
            this.operatorInput = $(this.operatorId);
            if (this.operator != '' && this.operatorInput) {
                this.setValue(this.operatorInput, this.operator);
            }
        }
        this.valueType = oNode.getNodeText('ValueType');
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
    }
};

var MGFilter = Class.create();
MGFilter.prototype = {
    fieldName: null,
    unaryNot: null,
    validOperators: ['=', '<>', '<=', '<', '>=', '>', 'LIKE'],
    initialize: function( oNode ) {
        Object.inheritFrom(this, MGFilterBase.prototype, [oNode]);
        
        this.allowEmptyValue = (oNode.getNodeText('AllowEmptyValue') == '1' ||
                                oNode.getNodeText('AllowEmptyValue') == 'true') ? 
                                   true : false ;
        this.fieldName = oNode.getNodeText('Field');
        //console.log('filter for field ' + this.fieldName);
        this.unaryNot = (oNode.getNodeText('Not') == '1' || 
                         oNode.getNodeText('Not') == 'true') ? true : false;
                         
    },
    getFilterText: function() {
        var result = '';
        var value = this.getValue(this.valueInput, '');
        
        this.operator = this.getValue(this.operatorInput, this.operator);
        if ((value != '' || this.allowEmptyValue) && this.operator != '') {
            var sep = (this.valueType == 'String' || this.valueType == 'DateTime') ? "'" : "";
            var sNot = this.unaryNot ? 'NOT ' : '';
            result = sNot + ' ' + this.fieldName + ' ' + this.operator + ' ' + sep + value + sep;
        }
        return result;
    }

};

var MGSpatialFilter = Class.create();
MGSpatialFilter.prototype = {
    validOperators: ['CONTAINS', 'CROSSES', 'DISJOINT', 'EQUALS',
                     'INSIDE', 'INTERSECTS', 'OVERLAPS', 'TOUCHES',
                     'WITHIN', 'COVEREDBY'],

    initialize: function(oNode) {
        Object.inheritFrom(this, MGFilterBase.prototype, [oNode]);
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