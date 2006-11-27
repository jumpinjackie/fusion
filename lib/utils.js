/*****************************************************************************
 * $Id$
 * Purpose: abstract handling of DOM node structures
 * Project: MapGuide Open Source 
 * Author: DM Solutions Group Inc
 *****************************************************************************
 * Copyright (c) 2005, DM Solutions Group Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.   IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 *****************************************************************************/

var DomNode = Class.create();
DomNode.prototype = {
    initialize: function( xmlNode /*, parent */ ) {
        this.textContent = '';
        this.nodeName = xmlNode.nodeName;
        this.parentNode = arguments[1]?arguments[1]:null;
        this.childNodes  = [];
        this.attributes = xmlNode.attributes;
        for (var i=0; i<xmlNode.childNodes.length; i++) {
            if (xmlNode.childNodes[i].nodeType != 3) {
                this.childNodes.push(new DomNode(xmlNode.childNodes[i], this));
            } else {
                this.textContent = this.textContent + xmlNode.childNodes[i].nodeValue;
            }
        }
        this._currentNode = 0;
    },

    getNodeText: function(name) {
        var s = arguments.length > 1 ? arguments[1] : '';
        var n = this.findFirstNode(name);
        if (n) {
            s = n.textContent;
        }
        //trace( this.nodeName + '.getTextContent: ' + s);
        return s;
    },

    findFirstNode: function( name ) {
        this._currentNode = 0;
        if (this.nodeName == name) {
            return this;
        } else {
            for (var i=0; i<this.childNodes.length; i++) {
                var node = this.childNodes[i].findFirstNode(name);
                if (node) {
                    if (node.parentNode == this) {
                        this._currentNode = i + 1;
                    } else {
                        this._currentNode = i;
                    }
                    return node;
                }
            }
            return false;
        }
    },

    findNextNode: function( name ) {
        if (this.nodeName == name) {
            return this;
        } else {
            for (var i=this._currentNode; i<this.childNodes.length; i++) {
                var node = this.childNodes[i].findNextNode(name);
                if (node) {
                    if (node.parentNode == this) {
                        this._currentNode = i + 1;
                    } else {
                        this._currentNode = i;
                    }
                    return node;
                }
            }
            return false;
        }
    }
};