/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Maptip presents floating info on layers when the mouse hovers
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

var Maptip = Class.create();
Maptip.prototype = 
{
    oCurrentPosition: null,
    nTimer: null,
    
    initialize : function(oCommand)
    {
        console.log('Maptip.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Maptip', true]);
        this.setMap(oCommand.getMap());

        this._oCommand = oCommand;
        this.domObj = $(oCommand.getName());
        this.domObj.parentNode.removeChild(this.domObj);
        this.domObj.style.position = 'absolute';
        this.domObj.style.display = 'none';
        this.domObj.style.top = '0px';
        this.domObj.style.left = '0px';
        this.domObj.style.zIndex = 98;
        
        var oDomElem =  this.getMap().getDomObj();
        oDomElem.appendChild(this.domObj);
        
        this.getMap().observeEvent('mousemove', this.mouseMove.bind(this));
    },
    
    mouseMove: function(e) {
        var p = this.getMap().getEventPosition(e);
        if (!this.oCurrentPosition) {
            this.oCurrentPosition = p;
        } else {
            window.clearTimeout(this.nTimer);
            if (this.bIsVisible) {
                this.hideMaptip();
            }
            this.oCurrentPosition = p;
        }
        this.nTimer = window.setTimeout(this.showMaptip.bind(this), 250);
        Event.stop(e);
    },
    
    showMaptip: function(r) {
        console.log('showMapTip');
        var map = this.getMap();
        var cellSize = map._nCellSize;
        console.log('cell size: ' + cellSize);
        var oBroker = map._oConfigObj.oApp.getBroker();
        var x = this.oCurrentPosition.x;
        var y = this.oCurrentPosition.y;
        var min = map.pixToGeo(x, y);
        min.x -= cellSize;
        min.y -= cellSize;
    	var max = map.pixToGeo(x, y);
    	max.x -= cellSize;
    	max.y -= cellSize;
        var sGeometry = 'POLYGON(('+ min.x + ' ' +  min.y + ', ' +  min.x + ' ' +  max.y + ', ' + max.x + ' ' +  max.y + ', ' + max.x + ' ' +  min.y + ', ' + min.x + ' ' +  min.y + '))';

         var maxFeatures = 1;
         var persist = 0;
         var selection = 'INTERSECTS';
         //TODO: possibly make the layer names configurable?
         var layerNames = '';
         var r = new MGQueryMapFeatures(map._oConfigObj.getSessionId(),
                                        map._sMapname,
                                        sGeometry,
                                        maxFeatures, persist, selection, layerNames);
        oBroker.dispatchRequest(r, 
        this._display.bind(this));
        this.bIsVisible = true;         
        this.domObj.style.top = this.oCurrentPosition.y + 'px';
        this.domObj.style.left = this.oCurrentPosition.x + 'px';
    },
    _display: function(r) {
        if (r.responseXML) {
            var d = new DomNode(r.responseXML);
            var t = d.getNodeText('Tooltip');
            if (t != '') {
                this.domObj.innerHTML = t;
                this.domObj.style.display = 'block';
            }
        }
    },
    
    hideMaptip: function() {
        console.log('hideMapTip');
        this.bIsVisible = false;
        this.domObj.style.display = 'none';
        this.domObj.innerHTML = '&nbsp;';
    }
    
};
