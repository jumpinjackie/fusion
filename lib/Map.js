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
    
    /**
     * construct a new view GxMap class.  
     */
    initialize : function(oCommand)  
    {    
        //console.log('GxMap.initialize');

        Object.inheritFrom(this, EventMgr.prototype, []);

        this._nCellSize = -1;
        
        this._sDomObj = oCommand.oxmlNode.getNodeText('Name');
        this._oDomObj = $(this._sDomObj);
        
        var d = Element.getDimensions(this._oDomObj);
        this._nWidth = d.width;
        this._nHeight = d.height;
        
        this._nWorkers = 0;

        this._oImg = document.createElement('img');
        this._oImg.className = 'png24';
        this._oImg.id = 'gMapImg';
        this._oImg.style.position = 'relative';
        this._oImg.style.top = '0px';
        this._oImg.style.left = '0px';
        //this._oImg.style.zIndex = 0;
        this._oImg.style.width = this._nWidth;
        this._oImg.style.height = this._nHeight;
        this._oImg.src = 'images/a_pixel.png';
        this._oImg.onerror = this._imageError.bindAsEventListener(this);

        this._oImgNew = document.createElement('img');
        this._oImgNew.className = 'png24';
        this._oImgNew.id = 'gMapImgNew';
        this._oImgNew.style.position = 'absolute';
        this._oImgNew.style.top = '0px';
        this._oImgNew.style.left = '0px';
        this._oImgNew.style.zIndex = 0;
        this._oImgNew.style.width = this._nWidth;
        this._oImgNew.style.height = this._nHeight;
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
        
        Event.observe(this._oDomObj, 'contextmenu', this.onContextMenu.bind(this));
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

    resize : function() {
        var d = Element.getDimensions(this.getDomObj());
        this._nWidth = d.width;
        this._nHeight = d.height;
        if (this._afInitialExtents) {
            this.drawMap();
        }
    },
    
    setMapImageURL: function(url) {
        this._oImgNew.onload = this.swapImages.bindAsEventListener(this);
        if (this._oImgNew.width != this._nWidth || this._oImgNew.height != this._nHeight) {
            this._oImgNew.src = 'images/a_pixel.png';
            this._oImgNew.style.width = this._nWidth;
            this._oImgNew.style.height = this._nHeight;
        }
        //IE uses a PNG Hack to load 24 bit PNG images, so we need to change the
        //filter and manually call swapImages
        if (this._oImgNew.runtimeStyle && this._oImgNew.runtimeStyle.filter) {
            this._oImgNew.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+url+"',sizingMethod='scale')";
            this.swapImages();
        } else {
            this._oImgNew.src = url;
        }
    },
     
    swapImages : function(e) 
    {
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

    setExtents : function(afExtents)
    {
        this.setExtentsGxMap(aExtents);
    },

    setExtentsGxMap : function(aExtents) 
    {
        if (!this._afInitialExtents) {
            this._afInitialExtents = aExtents;
        }
        this._afCurrentExtents = aExtents;
        
        var gWidth = Math.abs(this._afCurrentExtents[2] - this._afCurrentExtents[0]);
        var gHeight = Math.abs(this._afCurrentExtents[3] - this._afCurrentExtents[1]);
        
        var nWidth = this._nWidth;
        var nHeight = this._nHeight;
        
        this._nCellSize = Math.max(gWidth/nWidth, gHeight/nHeight);
        if (gWidth/nWidth != gHeight/nHeight) {
            var cX = (this._afCurrentExtents[2] + this._afCurrentExtents[0])/2;
            var cY = (this._afCurrentExtents[3] + this._afCurrentExtents[1])/2;
            this._afCurrentExtents[0] = cX - (this._nCellSize * nWidth)/2;
            this._afCurrentExtents[1] = cY - (this._nCellSize * nHeight)/2;
            this._afCurrentExtents[2] = cX + (this._nCellSize * nWidth)/2;
            this._afCurrentExtents[3] = cY + (this._nCellSize * nHeight)/2;
        }

        this._oImg.width = nWidth;
        this._oImg.height = nHeight;

        this._calculateScale();

        this.triggerEvent(MAP_EXTENTS_CHANGED);
    },

    fullExtents : function()
    {
        this.setExtents(this._afInitialExtents); 
    },

    zoom : function(fX, fY, nFactor)
    {
        var fDeltaX = this._afCurrentExtents[2] - this._afCurrentExtents[0];
        var fDeltaY = this._afCurrentExtents[3] - this._afCurrentExtents[1];
        var fMinX;
        var fMaxX;
        var fMinY;
        var fMaxy;

        /*recenter*/
        if (nFactor == 1 || nFactor == 0)
        {
            fMinX = fX - (fDeltaX/2);
            fMaxX = fX + (fDeltaX/2);
            
            fMinY = fY - (fDeltaY/2);
            fMaxY = fY + (fDeltaY/2);
        }
        /*zoomin*/
        else if (nFactor > 0)
        {
             fMinX = fX - (fDeltaX/2 / nFactor);
             fMaxX = fX + (fDeltaX/2 / nFactor);
            
             fMinY = fY - (fDeltaY/2 / nFactor);
             fMaxY = fY + (fDeltaY/2 / nFactor);
        }
        /*zoomout*/
        else if (nFactor < 0)
        {
            fMinX = fX - ((fDeltaX/2) * Math.abs(nFactor));
            fMaxX = fX + ((fDeltaX/2) * Math.abs(nFactor));
            
            fMinY = fY - ((fDeltaY/2) * Math.abs(nFactor));
            fMaxY = fY + ((fDeltaY/2) * Math.abs(nFactor));
        }
        
        //alert("zoom:extents xmin=" + fMinX + " miny=" + fMinY + " maxx=" + fMaxX + " maxy=" + fMaxY);
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
         Event.observe(this._oDomObj, sEventName, fnCB);
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
         Event.stopObserving(this._oDomObj, sEventName, fnCB);
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
         //console.log('GxMap.activateWidget ' + oWidget.getName());
         
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
         //console.log('GxMap.deactivateWidget');
         oWidget.deactivate();
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
         if (this.oContextMenu && !this.bSupressContextMenu) {
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
