/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Generic Map widget
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
 * GxMap : generic class for map widgets. Provides common utility classes.
 * Map widgets based on this should define some key functions like drawMap
 * **********************************************************************/

var gnLastEventId = 0;
MAP_EXTENTS_CHANGED = gnLastEventId ++;
MAP_BUSY_CHANGED = gnLastEventId ++;
MAP_GENERIC_EVENT = gnLastEventId++;
MAP_RESIZED = gnLastEventId++;

var GxMap = Class.create();
GxMap.prototype =
{
    _oDomObj : null,
    _sDomObj : '',
    _oEventDiv : null,
    _sMapname : '',  
    _nWidth : -1,
    _nHeight : -1,  
    _fMetersperunit : -1,
    _fScale : -1,
    _nDpi : 96,
    _afCurrentExtents: null,
    _afInitialExtents: null,
    
    oContextMenu: null,
    bSupressContextMenu: false,
    
    layerRoot: null,
    aLayers: null,
    
    /**
     * construct a new view GxMap class.  
     */
    initialize : function(oCommand)  
    {    
        //console.log('GxMap.initialize');

        Object.inheritFrom(this, EventMgr.prototype, []);

        this.layerRoot = new GxGroup();
        this.aLayers = [];
        
        this._nCellSize = -1;
        
        var json = oCommand.jsonNode;
        
        this._sDomObj = json.Name ? json.Name[0] : '';
        this._oDomObj = $(this._sDomObj);
        
        
        if (this._oDomObj.jxLayout) {
            this._oDomObj.jxLayout.addSizeChangeListener(this);
        }
        
        var d = Element.getDimensions(this._oDomObj);
        this._nWidth = d.width;
        this._nHeight = d.height;
        
        this._nWorkers = 0;

        this._oImg = document.createElement('img');
        this._oImg.className = 'png24';
        this._oImg.id = 'gMapImg';
        this._oImg.style.position = 'relative';
        this._oImg.style.width = this._nWidth + 'px';
        this._oImg.style.height = this._nHeight + 'px';
        this._oImg.src = 'images/a_pixel.png';
        this._oImg.onerror = this._imageError.bindAsEventListener(this);

        this._oImgNew = document.createElement('img');
        this._oImgNew.className = 'png24';
        this._oImgNew.id = 'gMapImgNew';
        this._oImgNew.style.position = 'relative';
        this._oImgNew.style.width = this._nWidth + 'px';
        this._oImgNew.style.height = this._nHeight + 'px';
        this._oImgNew.src = 'images/a_pixel.png';
        this._oImgNew.onload = this.swapImages.bindAsEventListener(this);
        this._oImgNew.onerror = this._imageError.bindAsEventListener(this);
    
        this._oImg.galleryimg = "no"; //turn off image toolbar in IE
        this._oDomObj.appendChild(this._oImg);

        this._oDomObj.oncontextmenu = function() {return false;};
        this._oImg.ondrag = function() {return false;};

        /* this shouldn't be needed because we capture events on the domObj but
         * it seems to be needed to get everything working in all the browsers
         */
        this._oEventDiv = document.createElement('div');
        this._oEventDiv.id = '_oEventDiv_' + this._oDomObj.id;
        this._oEventDiv.style.position = 'absolute';
        this._oEventDiv.style.top = '0px';
        this._oEventDiv.style.left = '0px';
        this._oEventDiv.style.width = '100%';
        this._oEventDiv.style.height = '100%';
        this._oEventDiv.style.zIndex = 100;
        /** hack to make event capturing work properly across all browsers */
        this._oEventDiv.style.backgroundColor = 'white';
        this._oEventDiv.style.opacity = 0;
        this._oEventDiv.style.mozOpacity = 0;
        this._oEventDiv.style.filter = 'Alpha(opacity=0)';
        this._oDomObj.appendChild(this._oEventDiv);
                
        this.registerEventID(MAP_EXTENTS_CHANGED);
        this.registerEventID(MAP_BUSY_CHANGED);
        this.registerEventID(MAP_GENERIC_EVENT);
        this.registerEventID(MAP_RESIZED);
        
        Event.observe(this._oDomObj, 'contextmenu', this.onContextMenu.bind(this));
        
        this.bMouseWheelZoom = json.AllowWheelZoom ? (json.AllowWheelZoom[0] == 'true' ? true : false ) : false;
        this.nFactor =json.WheelZoomFactor ? json.WheelZoomFactor[0] : 2.0;
        
        if (this.bMouseWheelZoom) {
            Event.observe(this._oEventDiv, 'mousewheel', this.onMouseWheel.bind(this));
            if (window.addEventListener &&
                navigator.product && navigator.product == "Gecko") {
                this._oEventDiv.addEventListener( "DOMMouseScroll", this.onMouseWheel.bind(this), false );
            }
            
        }
        
        //work around a bug in firefox that incorrectly reports the mouse
        //position in DOMMouseScroll events
        Event.observe(this._oEventDiv, 'mousemove', this.onMouseMove.bind(this));
    },
    
    onMouseMove: function(e) {
        this.lastMousePos = this.getEventPosition(e);
    },
    
    onMouseWheel: function(e) {
        var wheelDelta = e.wheelDelta ? e.wheelDelta : e.detail*-1;
        var wheelSet = null;
        
        var factor = this.nFactor;
        var size = Element.getDimensions(this._oImg);

        /* if the mouse hasn't moved yet, zoom on center */
        if (!this.lastMousePos) {
            this.lastMousePos = {x:size.width/2,y:size.height/2};
        }
        
        /* always work from the current image top/left in case the user has
         * more than one zoom before the new image arrives.
         */
        var top = parseInt(this._oImg.style.top);
        var left = parseInt(this._oImg.style.left);
        
        /* image location and dimensions for a temporarily resized version of the
         * current image while we wait for the new image to arrive
         */
        var newLeft, newTop, newWidth, newHeight;
        var newCenterX, newCenterTop;
        
        /* the direction we are zooming - 1 for in, -1 for out */
        var direction = 1;
        
        /* calculate the new image dimensions and zoom factor */
        if (wheelDelta > 0) {
            /* mouse position relative to top left of img */
            var x = this.lastMousePos.x - left;
            var y = this.lastMousePos.y - top;

            /* center the image on the mouse position */
            newLeft = left - x;
            newTop = top - y;
            
            /* increase size of image */
            newWidth = size.width * factor;
            newHeight = size.height * factor;
            
        } else {
            /* reduce size of image */
            newWidth = size.width / factor;
            newHeight = size.height / factor;

            /* mouse position relative to top left of img */
            var x = (this.lastMousePos.x - left)/factor;
            var y = (this.lastMousePos.y - top)/factor;
            
            /* center the image on the mouse position */
            newLeft = left + x;
            newTop = top + y;
            
            /* reverse factor for geographic zoom */
            direction = -1;
        }

        /* move/size the image */
        /*
        this._oImg.style.width = newWidth + "px";
        this._oImg.style.height = newHeight + "px";
        this._oImg.style.top = newTop + 'px';
        this._oImg.style.left = newLeft + 'px';
        */
        
        /* figure out what geographic point will be at the new center.
         * Essentially, the geographic location of the mouse has to stay
         * in the same pixel location relative to the top/left.
         */
        var geoPoint = {};
        if (this.lastMousePos) {
            /* multiplier as a ratio of the current width to new width */
            var geoFactor = (size.width / newWidth);
            
            /* current geographic size */
            var curGW = this._afCurrentExtents[2] - this._afCurrentExtents[0];
            var curGH = this._afCurrentExtents[3] - this._afCurrentExtents[1];
            
            /* new geographic size is just a factor of the current one */
            var newGW = curGW * geoFactor;
            var newGH = curGH * geoFactor;
            
            /* geographic location of the mouse */
            var mouseLoc = this.pixToGeo(this.lastMousePos.x, this.lastMousePos.y);
            
            /* new geographic left/top is calculated from current mouse location and
             * taking the geographic distance to the top left in the current view and
             * using the geoFactor to figure out how far (geographically) it will be
             * in the new view
             */
            var newGL = mouseLoc.x - (mouseLoc.x - this._afCurrentExtents[0])*geoFactor;
            var newGT = mouseLoc.y + (this._afCurrentExtents[3] - mouseLoc.y)*geoFactor;

            /* now find the center so we can zoom */
            geoPoint.x = (newGL + newGW/2);
            geoPoint.y = (newGT - newGH/2);
        } else {
            geoPoint = this.getCurrentCenter();
        }
        
        /* finally we can zoom */
        this.zoom(geoPoint.x, geoPoint.y, direction*factor);
    },
    
    /**
     * returns the dom element 
     */
    getDomObj : function()
    {
        return this._oDomObj;
    },


    /**
     * returns the size of the map image in pixels in an object with
     * two attributes, width and height.
     */
    getPixelSize : function() 
    {
        return {width:parseInt(this._oImg.width), 
                height:parseInt(this._oImg.height)};
    
    },

    getMapName : function()
    {  
        return this._sMapname;
    },

    getDomId : function()
    {  
        return this._sDomObj;
    },

    /**
     * indicate that a new asynchronous process has started and make sure the
     * visual indicator is visible for the user.  This is intended to be used
     * internally by gMap but could be used by external tools if appropriate.
     */
    _addWorker : function() 
    {
        this._nWorkers += 1;
        this.triggerEvent(MAP_BUSY_CHANGED, this);
    },

    /**
     * indicate that an asynchronous process has completed and hide the
     * visual indicator if no remaining processes are active.  This is 
     * intended to be used internally by gMap but could be used by 
     * external tools if appropriate.  Only call this function if
     * addWorker was previously called
     */
    _removeWorker : function() 
    {
        if (this._nWorkers > 0) 
        {
            this._nWorkers -= 1;
        }
        this.triggerEvent(MAP_BUSY_CHANGED, this);
    },
    
    isBusy: function() {
        return this._nWorkers > 0;
    },

    /**
     * This function should be defined by classes inheriting grom GxMap
     */
    drawMap : function()
    {       
        alert("GxMap::drawMap");
    },

    sizeChanged: function() {
        this.resize();
    },
    
    resize : function() {
        //console.log('GxMap.resize');
        var d = Element.getDimensions(this.getDomObj());
        this._nWidth = d.width;
        this._nHeight = d.height;
        if (this._afInitialExtents) {
            this.drawMap();
        }
        this.triggerEvent(MAP_RESIZED, this);
    },
    
    setMapImageURL: function(url) {
        //console.log('setting map image url: ' + url);
        this._oImgNew.onload = this.swapImages.bindAsEventListener(this);
        if (this._oImgNew.width != this._nWidth || this._oImgNew.height != this._nHeight) {
            this._oImgNew.src = 'images/a_pixel.png';
            this._oImgNew.style.width = this._nWidth + 'px';
            this._oImgNew.style.height = this._nHeight + 'px';
        }
        //IE uses a PNG Hack to load 24 bit PNG images, so we need to change the
        //filter and manually call swapImages
        if (this._oImgNew.runtimeStyle && this._oImgNew.runtimeStyle.filter) {
            this._oImgNew.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+url+"',sizingMethod='scale')";
            this.swapImages();
        } else {
            //console.log('requesting new image source');
            this._oImgNew.src = url;
        }
    },
     
    swapImages : function(e) 
    {
        //console.log("swapping images");
        this._oImgNew.onload = null;
        this._oImg = this._oDomObj.replaceChild(this._oImgNew, this._oImg);
        
        var i = this._oImg;
        this._oImg = this._oImgNew;
        this._oImgNew = i;

        this._oImgNew.style.top = '0px';
        this._oImgNew.style.left = '0px';
        this._oImgNew.style.width = this._oImg.style.width;
        this._oImgNew.style.height = this._oImg.style.height;
        
        this._removeWorker();
    },

    _imageError : function() 
    {
        this._removeWorker();
        this.drawMap();
    },

    _calculateScale : function()
    {
        var fMetersPerPixel = 0.0254 / this._nDpi;
        var fdeltaX = this._afCurrentExtents[2] - this._afCurrentExtents[0];
        var fdeltaY = this._afCurrentExtents[3] - this._afCurrentExtents[1];
    
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;

        if (fdeltaX *  nWidth >  fdeltaY * nHeight) {
            this._fScale =  
               fdeltaX * this._fMetersperunit / (nWidth * fMetersPerPixel);
        } else {
            this._fScale = fdeltaY * this._fMetersperunit / (nHeight * fMetersPerPixel); 
        }
    },
    
    /* this is actually never used */
    setExtents : function(aExtents) {
        for(i in aExtents) {
           aExtents[i] = parseFloat(aExtents[i]); 
        }
        this.setExtentsGxMap(aExtents);
    },

    setExtentsGxMap : function(aExtents) {
        if (!this._afInitialExtents) {
            this._afInitialExtents = aExtents;
        }
        var bResize = false;
        if (this._afCurrentExtents) {
            bResize = true;
            var cXold = (this._afCurrentExtents[2] + this._afCurrentExtents[0])/2;
            var cYold = (this._afCurrentExtents[3] + this._afCurrentExtents[1])/2;
            var cellSizeOld = this._nCellSize;
        }
        
        var gWidth = Math.abs(aExtents[2] - aExtents[0]);
        var gHeight = Math.abs(aExtents[3] - aExtents[1]);
        
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;
        
        this._nCellSize = Math.max(gWidth/nWidth, gHeight/nHeight);
        if (gWidth/nWidth != gHeight/nHeight) {
            var cX = (aExtents[2] + aExtents[0])/2;
            var cY = (aExtents[3] + aExtents[1])/2;
            aExtents[0] = cX - (this._nCellSize * nWidth)/2;
            aExtents[1] = cY - (this._nCellSize * nHeight)/2;
            aExtents[2] = cX + (this._nCellSize * nWidth)/2;
            aExtents[3] = cY + (this._nCellSize * nHeight)/2;
        }
        
        /*
        if (bResize) {
            var dx = ((cXold - cX)/this._nCellSize)/2;
            var dy = ((cYold - cY)/this._nCellSize)/2;
            this._oImg.style.top = 0 + 'px';
            this._oImg.style.left = 0 + 'px';
            this._oImg.style.width = (nWidth * cellSizeOld/this._nCellSize) + 'px';
            this._oImg.style.height = (nHeight * cellSizeOld/this._nCellSize) + 'px';
        } else {
            this._oImg.style.width = nWidth + 'px';
            this._oImg.style.height = nHeight + 'px';
        }
        */
        this._oImg.style.width = nWidth + 'px';
        this._oImg.style.height = nHeight + 'px';

        this._afCurrentExtents = aExtents;
        this._calculateScale();

        this.triggerEvent(MAP_EXTENTS_CHANGED);
    },

    fullExtents : function() {
        this.setExtents(this._afInitialExtents); 
    },

    zoom : function(fX, fY, nFactor) {
        var fDeltaX = this._afCurrentExtents[2] - this._afCurrentExtents[0];
        var fDeltaY = this._afCurrentExtents[3] - this._afCurrentExtents[1];
        var fMinX,fMaxX,fMinY,fMaxy;

        if (nFactor == 1 || nFactor == 0) {
            /*recenter*/
            fMinX = fX - (fDeltaX/2);
            fMaxX = fX + (fDeltaX/2);
            fMinY = fY - (fDeltaY/2);
            fMaxY = fY + (fDeltaY/2);
        } else if (nFactor > 0) {
            /*zoomin*/
            fMinX = fX - (fDeltaX/2 / nFactor);
            fMaxX = fX + (fDeltaX/2 / nFactor);
            fMinY = fY - (fDeltaY/2 / nFactor);
            fMaxY = fY + (fDeltaY/2 / nFactor);
        } else if (nFactor < 0) {
            /*zoomout*/
            fMinX = fX - ((fDeltaX/2) * Math.abs(nFactor));
            fMaxX = fX + ((fDeltaX/2) * Math.abs(nFactor));
            fMinY = fY - ((fDeltaY/2) * Math.abs(nFactor));
            fMaxY = fY + ((fDeltaY/2) * Math.abs(nFactor));
        }
        this.setExtents([fMinX, fMinY, fMaxX, fMaxY]);
    },
    
    zoomScale: function(fScale) {
        var fMetersPerPixel = 0.0254 / this._nDpi;
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;
        var fMapUnitsPerPixel = fScale * fMetersPerPixel / this._fMetersperunit;
        var c = this.getCurrentCenter();
        var fMinX = c.x - (fMapUnitsPerPixel * nWidth/2);
        var fMinY = c.y - (fMapUnitsPerPixel * nHeight/2);
        var fMaxX = c.x + (fMapUnitsPerPixel * nWidth/2);
        var fMaxY = c.y + (fMapUnitsPerPixel * nHeight/2);
        
        this.setExtents([fMinX, fMinY, fMaxX, fMaxY]);
    },
    
    /**
     *
     * update the extents to fit the map image size based on the current cellsize.
     * This function preserves the center and scale of the extents when the image
     * is resized.  This function is intended for internal use only and does not
     * call drawMap()
     */
    _updateExtents : function()
    {
        var cx = (this._afCurrentExtents[0] + this._afCurrentExtents[2])/2;
        var cy = (this._afCurrentExtents[1] + this._afCurrentExtents[3])/2;    
        this._afCurrentExtents[0] = cx - (this._nCellSize * parseInt(this.img.width))/2;
        this._afCurrentExtents[1] = cy - (this._nCellSize * parseInt(this.img.height))/2;
        this._afCurrentExtents[2] = cx + (this._nCellSize * parseInt(this.img.width))/2;
        this._afCurrentExtents[3] = cy + (this._nCellSize * parseInt(this.img.height))/2;

    },

    queryRect : function(fMinX, fMinY, fMaxX, fMaxY)
    {
    },
    
    queryPoint : function(fX, fY)
    {
    },

    
    /**
     *
     * convert pixel coordinates into geographic coordinates.
     *
     * @paran pX int the x coordinate in pixel units
     * @param pY int the y coordinate in pixel units
     *
     * @return an object with geographic coordinates in x and y properties of the 
     *         object.
     */
    pixToGeo : function( pX, pY )
    {
        if (!(this._afCurrentExtents)) {
            return null;
        }
        var gX = parseFloat(this._afCurrentExtents[0]) +  (pX * this._nCellSize);
        var gY = parseFloat(this._afCurrentExtents[3]) - (pY * this._nCellSize);

        return {x:gX, y:gY};
    },

    /**
     *
     * convert pixel into geographic : used to measure.
     *
     * @param nPixels int measures in pixel
     *
     * @return geographic measure
     */
    pixToGeoMeasure : function(nPixels)
    {
        return (nPixels*this._nCellSize);
    },
    
    /**
     *
     * convert geographic into pixels.
     *
     * @param fGeo float distance in geographic units
     *
     * @return pixels
     */
    geoToPixMeasure : function(fGeo)
    {
        return parseInt(fGeo/this._nCellSize);
    },
    
    /**
     *
     * convert geographic coordinates into pixel coordinates.
     *
     * @paran gX int the x coordinate in geographic units
     * @param gY int the y coordinate in geographic units
     *
     * @return an object with pixel coordinates in x and y properties of the 
     *         object.
     */
    geoToPix : function( gX, gY )
    {
        if (!(this._afCurrentExtents)) {
            return null;
        }
        var pX = parseFloat(gX - this._afCurrentExtents[0]) / this._nCellSize;
        var pY = -1 * parseFloat(gY - this._afCurrentExtents[3]) / this._nCellSize;
        //console.log("GxMap::geoToPix coords: g:" +gX+', '+gY+' p:'+pX+', '+pY);
        return {x:Math.floor(pX), y:Math.floor(pY)};
    },

    getCurrentScale: function() {
        return this._fScale;
    },

    /**
     *
     * returns the current center of the map view
     */
    getCurrentCenter : function()
    {
        var cx = (this._afCurrentExtents[0] + this._afCurrentExtents[2])/2;
        var cy = (this._afCurrentExtents[1] + this._afCurrentExtents[3])/2;
        return {x:cx, y:cy};
    },
    /**
     *
     * returns the current extents
     */
    getCurrentExtents : function()
    {
        return this._afCurrentExtents;
    },

    /**
     *
     * returns initial extents
    */
    getInitialExtents : function() 
    {
        return this._afInitialExtents;
    },


    getEventPosition : function(e)
    {
        var posX,posY;
        if (e.target) {
            posX = posY = 0 ;
            var o = e.target;
            while (o.offsetParent)
            {
                posX += o.offsetLeft ;
                posY += o.offsetTop ;
                o = o.offsetParent ;
            }
            posX = e.pageX - posX ;
            posY = e.pageY - posY ;
        } else if (e.offsetX) {
            posX = e.offsetX;
            posY = e.offsetY;
        } else {
            posX = e.clientX;
            posY = e.clientY;
        }
        return {x:posX,y:posY};
    },

    setCursor : function(cursor)
    {
        if (cursor && cursor.length && typeof cursor == 'object') 
        {
            for (var i = 0; i < cursor.length; i++) 
            {
                this._oDomObj.style.cursor = cursor[i];
                if (this._oDomObj.style.cursor == cursor[i]) 
                {
                    break;
                }
            }
        } 
        else if (typeof cursor == 'string') 
        {
            this._oDomObj.style.cursor = cursor;
        } else 
        {
            this._oDomObj.style.cursor = 'auto';  
    }
    },
    /**
     *
     * Observe specified event on the event div of the map
     *
     * @param sEventName string event name (eg : mousemove')
     * @param fnCB function Call back function name
     *
     */
     observeEvent  : function(sEventName, fnCB)
     {
         Event.observe(this._oDomObj, sEventName, fnCB, false);
     },

     /**
     *
     * Stop observing specified event on the event div of the map
     *
     * @param sEventName string event name (eg : mousemove')
     * @param fnCB function Call back function name
     *
     */
     stopObserveEvent : function(sEventName, fnCB)
     {
         Event.stopObserving(this._oDomObj, sEventName, fnCB, false);
     },

     /**
     *
     * call the Activate method on the widget
     * if widgets is set to be mutually exclusive,
     * all other widgets are deactivated
     *
     * @param nId integer widget id
     */
     activateWidget : function(oWidget)
     {
         /*console.log('GxMap.activateWidget ' + oWidget.getName());*/
         if (oWidget.isMutEx()) {
             if (this.oActiveWidget) {
                 this.deactivateWidget(this.oActiveWidget);
             }
             oWidget.activate();
             this.oActiveWidget = oWidget;
         } else {
             oWidget.activate();
         }
     },

     /**
     *
     * call the Activate method on the widget
     * if widgets is set to be mutually exclusive,
     * all other widgets are deactivated
     *
     * @param oWidget the widget to deactivate
     */
     deactivateWidget : function(oWidget)
     {
         /*console.log('GxMap.deactivateWidget ' + oWidget.getName());*/
         oWidget.deactivate();
         this.oActiveWidget = null;
     },
     
     /**
      */
     isLoaded: function() {
         return (this._afCurrentExtents != null);
     },
     
     supressContextMenu: function( bSupress ) {
         this.bSupressContextMenu = bSupress;
     },
     
     setContextMenu: function(menu) {
         //console.log('setcontextmenu');
         this.oContextMenu = menu;
     },
     
     onContextMenu: function(e) {
         //console.log('oncontextmenu');
         if (this.oContextMenu && !this.bSupressContextMenu && this.isLoaded()) {
             this.oContextMenu.show(e);
             this.contextMenuPosition = this.getEventPosition(e);
             Event.stop(e);
         }
     },
     
     executeFromContextMenu: function(widget) {
         //console.log('executefromcontextmenu');
         widget.execute(this.contextMenuPosition.x, this.contextMenuPosition.y);
     }
};

var LAYER_PROPERTY_CHANGED = 0;
var GxLayer = Class.create();
GxLayer.prototype = {
    name: null,
    initialize: function(name) {
        Object.inheritFrom(this, EventMgr.prototype, []);
        this.layerName = name;
        this.registerEventID(LAYER_PROPERTY_CHANGED);
    },
    set: function(property, value) {
        this[property] = value;
        this.triggerEvent(LAYER_PROPERTY_CHANGED, this);
    }
};

var GROUP_PROPERTY_CHANGED = 0;
var GxGroup = Class.create();
GxGroup.prototype = {
    name: null,
    groups: null,
    layers: null,
    initialize: function(name) {
        Object.inheritFrom(this, EventMgr.prototype, []);
        this.name = name;
        this.groups = [];
        this.layers = [];
        this.registerEventID(GROUP_PROPERTY_CHANGED);
    },
    set: function(property, value) {
        this[property] = value;
        this.triggerEvent(GROUP_PROPERTY_CHANGED, this);
    },
    addGroup: function(group) {
        group.parentGroup = this;
        this.groups.push(group);
        
    },
    addLayer: function(layer) {
        layer.parentGroup = this;
        this.layers.push(layer);
    },
    findGroup: function(name) {
        return this.findGroupByAttribute('name', name);
    },
    findGroupByAttribute: function(attribute, value) {
        if (this[attribute] == value) {
            return this;
        }
        for (var i=0; i<this.groups.length; i++) {
            var group = this.groups[i].findGroupByAttribute(attribute, value);
            if (group) {
                return group;
            }
        }
        return null;
    },
    findLayer: function(name) {
        return this.findLayerByAttribute('name', name);
    },
    findLayerByAttribute: function(attribute, value) {
        for (var i=0; i<this.layers.length; i++) {
            if (this.layers[i][attribute] == value) {
                return this.layers[i];
            }
        }
        for (var i=0; i<this.groups.length; i++) {
            var layer = this.groups[i].findLayerByAttribute(attribute,value);
            if (layer) {
                return layer;
            }
        }
        return null;
    }
};