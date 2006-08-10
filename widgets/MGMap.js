/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose this file contains the map widget
 * @author yassefa@dmsolutions.ca
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
/**
 * MGMap : MapGuide map widget Based on generic class GxMap
*/
require('widgets/GxMap.js');

var MGMap = Class.create();
MGMap.prototype =
{
    aShowLayers: null,
    aHideLayers: null,
    aShowGroups: null,
    aHideGroups: null,
    aRefreshLayers: null,
    
    initialize : function(sDomObj, sMapname, fMetersperunit, aExtents, nWidth, nHeight, oConfigObj)
    {
         console.log('MGMap.initialize');
         Object.inheritFrom(this, GxMap.prototype, [sDomObj, aExtents, nWidth, nHeight]);

         this.aShowLayers = [];
         this.aHideLayers = [];
         this.aShowGroups = [];
         this.aHideGroups = [];
         this.aRefreshLayers = [];

         this._oConfigObj = oConfigObj;

         this._fMetersperunit = fMetersperunit;
         this._sMapname = sMapname;
         this._fScale = -1;
         this._nDpi = 96;

         this._calculateScale();
    },

    setExtents : function(aExtents)
    {
        this.setExtentsGxMap(aExtents);
        this.drawMap();
    },

    getScale : function()
    {
        return this._fScale;
    },
    
    drawMap: function() {
        var cx = (this._afCurrentExtents[0] + this._afCurrentExtents[2])/2;
        var cy = (this._afCurrentExtents[1] + this._afCurrentExtents[3])/2;   

        var nWidth = this._nWidth;//getObjectWidth(this._oDomObj);
        var nHeight = this._nHeight;//getObjectHeight(this._oDomObj);
        
        var showLayers = this.aShowLayers.length > 0 ? 
                              this.aShowLayers.toString() : null;
        var hideLayers = this.aHideLayers.length > 0 ? 
                              this.aHideLayers.toString() : null;
        var showGroups = this.aShowGroups.length > 0 ? 
                              this.aShowGroups.toString() : null;
        var hideGroups = this.aHideGroups.length > 0 ? 
                              this.aHideGroups.toString() : null;
        var refreshLayers = this.aRefreshLayers.length > 0 ? 
                              this.aRefreshLayers.toString() : null;
        this.aShowLayers = [];
        this.aHideLayers = [];
        this.aShowGroups = [];
        this.aHideGroups = [];
        this.aRefreshLayers = [];

        var r = new MGGetVisibleMapExtent(this._oConfigObj.getSessionId(),
                               this._sMapname, cx, cy,
                               this._fScale, null, this._nDpi, nWidth, 
                               nHeight, showLayers, hideLayers, 
                               showGroups, hideGroups, refreshLayers);
        var oBroker = this._oConfigObj.oApp.getBroker();
        oBroker.dispatchRequest(r, this._requestMapImage.bind(this));
    },

    _requestMapImage : function(r)
    {
        var nWidth = this._nWidth;//getObjectWidth(this._oDomObj);
        var nHeight = this._nHeight;//getObjectHeight(this._oDomObj);

        console.log("MGMap:: _requestMapImage");
                    
        if (r.responseXML)
        {
              //parse the new extent
            var newExtents = [];

            var xmlroot = r.responseXML.documentElement;
            var xs = xmlroot.getElementsByTagName("X");
            var ys = xmlroot.getElementsByTagName("Y");
            newExtents[0] = parseFloat(xs[0].childNodes[0].nodeValue);
            newExtents[1] = parseFloat(ys[0].childNodes[0].nodeValue);
            newExtents[2] = parseFloat(xs[1].childNodes[0].nodeValue);
            newExtents[3] = parseFloat(ys[1].childNodes[0].nodeValue);
            

            this._afCurrentExtents = newExtents;

            this._nCellSize  = 
              Math.max( Math.abs((this._afCurrentExtents[2] - this._afCurrentExtents[0])/
                                 parseInt(nWidth)),
                        Math.abs((this._afCurrentExtents[3] - this._afCurrentExtents[1])/
                                 parseInt(nHeight)));
        }
        else
        {
            //alert("non valid");
        }

        url = this._oConfigObj.getWebAgentURL() + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + this._oConfigObj.getSessionId() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();

        if (this._oImg.width != nWidth || this._oImg.height != nWidth) {
            this._oImg.src = 'images/a_pixel.gif';
            this._oImg.width = nWidth;
            this._oImg.height = nHeight;
        }

        console.log('MGURL ' + url);
        this._oImg.onload = this.resetImage.bind(this);
        this._oImg.src = url;
    },        
    resetImage: function() {
        this._oImg.style.top = '0px';
        this._oImg.style.left = '0px';
    },
    
    processQueryResults : function(r)
    {
        if (r.responseXML)
        {
          //alert(r.responseXML);
        }        
        this.drawMap();
    },

    
    queryRect : function(fMinX, fMinY, fMaxX, fMaxY, nMaxFeatures, bPersist, sSelectionVariant)
    {
        var oBroker = this._oConfigObj.oApp.getBroker();

        var sGeometry = 'POLYGON(('+ fMinX + ' ' +  fMinY + ', ' +  fMaxX + ' ' +  fMinY + ', ' + fMaxX + ' ' +  fMaxY + ', ' + fMinX + ' ' +  fMaxY + ', ' + fMinX + ' ' +  fMinY + '))';

        var maxFeatures = -1;
        if (arguments.length > 4)
        {
          maxFeatures = nMaxFeatures;
        }
        var persist = 1;
        if (arguments.length > 5)
        {
          persist = bPersist;
        }
        var selection = 'INTERSECTS';
        if (arguments.length > 5)
        {
          selection = sSelectionVariant;
        }
        var r = new MGQueryMapFeatures(this._oConfigObj.getSessionId(),
                                       this._sMapname,
                                       sGeometry,
                                       maxFeatures, persist, selection);
       oBroker.dispatchRequest(r, 
           this.processQueryResults.bind(this));

    },
    showLayer: function( sLayer ) {
        console.log('MGMap.showLayer('+sLayer+')');
        this.aShowLayers.push(sLayer);
        this.drawMap();
    },
    hideLayer: function( sLayer ) {
        console.log('MGMap.hideLayer('+sLayer+')');
        this.aHideLayers.push(sLayer);
        this.drawMap();
    },
    showGroup: function( sGroup ) {
        console.log('MGMap.showGroup('+sGroup+')');
        this.aShowGroups.push(sGroup);
        this.drawMap();
    },
    hideGroup: function( sGroup ) {
        console.log('MGMap.hideGroup('+sGroup+')');
        this.aHideGroups.push(sGroup);
        this.drawMap();
    },
    refreshLayer: function( sLayer ) {
        console.log('MGMap.refreshLayer('+sLayer+')');
        this.aRefreshLayers.push(sLayer);        
        this.drawMap();
    }
};
