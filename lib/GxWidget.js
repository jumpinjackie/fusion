/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Base Class for all widgets
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
 * extended description
 * **********************************************************************/
var GxWidget = Class.create();
GxWidget.prototype = {
    bIsMutuallyExclusive: null,
    sName: null,
    oMap: null,
    /**
     * intialize the widget
     * @param sName {string} the name of the widget
     */
    initialize: function(sName, bMutEx) {
        this.bIsMutuallyExclusive = bMutEx;
        this.sName = sName;
    },
    /**
     * set the map object that this widget is associated with
     * @param oMap {Object} the map
     */
    setMap: function(oMap) {
        this.oMap = oMap;
    },
    /**
     * accessor to get the Map object that this widget is associated with
     * @return {object} the map
     */
    getMap: function() {
        return this.oMap;
    },
    
    /** 
     * set whether this widget is mutually exclusive on its map
     * @param bIsMutEx {boolean} is the widget mutually exclusive?
     */
    setMutEx: function(bIsMutEx) {
        this.bIsMutuallyExclusive = bIsMutEx;
    },
    
    /**
     * accessor to determine if the widget should be activated mutually
     * exclusively from other widgets on the map.
     * @return {boolean} true if the widget is mutually exclusive
     */
    isMutEx: function() {
        return this.bIsMutuallyExclusive;
    },
    
    /**
     * accessor to return the name of the widget.  Mostly for debugging
     * @return {string} the name of the widget
     */
    getName: function() {
        return this.sName;
    }
}