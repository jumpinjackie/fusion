/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose core search widget architecture
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
 * The Fusion search mechanism defines a common capability for searches that
 * link individual searches to a common search set maintained for all
 * search-based widgets.  The common search set can be statically and/or
 * dynamically created.  Static definition is done in the WebLayout.  Dynamic
 * creation is done by individual widgets and creating instances of
 * GxSearchDefinition(s) - or rather a MGSearchDefinition.
 *
 * Widgets that want to take advantage of this behaviour can sub-class this
 * widget.  Just make sure to initialize properly!
 * 
 * **********************************************************************/

var GxSearch = Class.create();
GxSearch.prototype = {
    initialize : function(oCommand) {
        //console.log('GxSearch.initialize');
    }
};

var GxSearchCategory = Class.create();
GxSearchCategory.prototype = {
    id: null,
    name: null,
    layer: null,
    definitions: null,
    initialize: function(id, name, layer) {
        this.id = id;
        this.name = name;
        this.layer = layer;
        this.definitions = [];
    }
};

var GxSearchDefinition = Class.create();
GxSearchDefinition.prototype = {
    id: null,
    parameters: null,
    join: null,
    rule: null,
    initialize: function() {
        
    },
    
    toString: function() {
        return this.rule.toString();
    }
};

var GxSearchRule = Class.create();
GxSearchRule.prototype = {
    type: null,
    conditions: null,
    initialize: function(type) {
        this.type = type;
        this.conditions = [];
    },
    
    add: function(condition) {
        this.conditions.push(condition);
    },
    
    remove: function(condition) {
        for (var i=0; i<this.conditions.length; i++) {
            if (this.conditions[i] == condition) {
                this.conditions.splice(i, 1);
                break;
            }
        }
    },
    
    toString: function() {
        return '(' + this.conditions.join(') ' + this.type + '(') + ')';
    }
};

var GxSearchCondition = Class.create();
GxSearchCondition.prototype = {
    column: null,
    operator: null,
    parameter: null,
    quoted: null
    validOperators: ['eq', 'like', 'lt', 'lte', 'gt', 'gte', 'neq'],
    actualOperators: ['=', 'like', '<', '<=', '>', '>=', '<>'],
    
    initialize: function(column, operator, parameter, quoted) {
        this.column = column;
        this.operator = operator;
        this.parameter = parameter;
        this.quoted = quoted;
    },
    
    toString: function() {
        var q = this.quoted ? '"' : '';
        return this.column + ' ' + this.operator + ' ' + q + this.parameter + q;
    }
};