/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
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


var GxMap = Class.create();
GxMap.prototype =
{
    _oDomObj : null,
    _aoWidgets : [],
    _aoWidgetsMutEx : [],
    _nWidgetId : 0,
    _oEventDiv : null,

    /**
     * Initialize a  new GxMap class. Should be called from classes extending this.  
     * @param oDomObj {Object} the DOM element
     * @param afExtents {Array} Initial extents
     */
    initialize : function(sDomObj, afExtents)
    {
        console.log('GxMap.initialize');
        this._afCurrentExtents = afExtents;

        this._nCellSize = -1;

        
        //TODO : use getRawObject
        //this._oDomObj = getRawObject(sDomObj.toString());
        this._oDomObj = document.getElementById(sDomObj);

        this._nWorkers = 0;

        this._oWorking = document.createElement('div');
        this._oWorking.id = 'gMapWorking';
        this._oWorking.className = 'gMapWorking';
        this._oWorking.innerHTML = 'working...';
        this._oWorking.style.zIndex = 1;
        
        this._oImg = document.createElement('img');
        this._oImg.id = 'gMapImg';
        this._oImg.style.position = 'absolute';
        this._oImg.style.top = '0px';
        this._oImg.style.left = '0px';
        this._oImg.style.zIndex = 0;
        this._oImg.width = getObjectWidth(this._oDomObj);
        this._oImg.height = getObjectHeight(this._oDomObj);
        this._oImg.src = 'images/a_pixel.png';
        //this._img.onload = this.swapImages.bindAsEventListener(this);
        this._oImg.onerror = this._imageError.bindAsEventListener(this);

        this._oImgNew = document.createElement('img');
	this._oImgNew.id = 'gMapImgNew';
	this._oImgNew.style.position = 'absolute';
	this._oImgNew.style.top = '0px';
	this._oImgNew.style.left = '0px';
	this._oImgNew.style.zIndex = 0;
	this._oImgNew.width = getObjectWidth(this._oDomObj);
	this._oImgNew.height = getObjectHeight(this._oDomObj);
	this._oImgNew.src = 'images/a_pixel.png';
	//this._oImgNew.onload = this.swapImages.bindAsEventListener(this);
	this._oImgNew.onerror = this._imageError.bindAsEventListener(this);
	
        this._oImg.galleryimg = "no"; //turn off image toolbar in IE
	this._oDomObj.appendChild(this._oImg);
	this._oDomObj.appendChild(this._oWorking);

        this._oDomObj.oncontextmenu = function() {return false;};
        this._oImg.ondrag = function() {return false;};

        this._oEventDiv = document.createElement('div');
	//this._oEventDiv.id = '_oEventDiv_' + this._oDomObj.id;
	this._oEventDiv.style.position = 'absolute';
	this._oEventDiv.style.top = '0px';
	this._oEventDiv.style.left = '0px';
	this._oEventDiv.style.width = '100%';
	this._oEventDiv.style.height = '100%';
	this._oEventDiv.style.zIndex = 100;

        this._oDomObj.appendChild(this._oEventDiv);
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

    /**
     * indicate that a new asynchronous process has started and make sure the
     * visual indicator is visible for the user.  This is intended to be used
     * internally by gMap but could be used by external tools if appropriate.
     */
    _addWorker : function() 
    {
	this._nWorkers += 1;
	this._oWorking.style.display = 'block';
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
        this._oWorking.style.display = (this._nWorkers>0)?'block':'none';	
    },       

    /**
     * This function should be defined by classes inheriting grom GxMap
     */
    drawMap : function()
    {       
        alert("GxMap::drawMap");
    },

     
    swapImages : function(e) 
    {
        this._oImgNew.onload = null;
        this._oImg = this.domObj.replaceChild(this._oImgNew, this._oImg);
        var i = this._oImg;
        this._oImg = this._oImgNew;
        this._oImgNew = i;

        this._oImgNew.style.top = '0px';
        this._oImgNew.style.left = '0px';
        this._oImgNew.width = this._oImg.width;
        this._oImgNew.height = this._oImg.height;
        this._removeWorker();
    },

    _imageError : function() 
    {
        this._removeWorker();
        this.drawMap();
    },

    setExtents : function(afExtents)
    {
        this.setExtentsGxMap(aExtents);
    },

    setExtentsGxMap : function(aExtents) 
    {
        this._afCurrentExtents = aExtents;
        var nWidth = getObjectWidth(this._oDomObj);
        var nHeight = getObjectHeight(this._oDomObj);

        this._oImg.width = nWidth;
        this._oImg.height = nHeight;

        this._nCellSize = Math.max(
                                   Math.abs((this._afCurrentExtents[2] - this._afCurrentExtents[0])/
                                            parseInt(this._oImg.width)),
                                   Math.abs((this._afCurrentExtents[3] - this._afCurrentExtents[1])/
                                            parseInt(this._oImg.height))
                                   );
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
            fMaxy = fY + (fDeltaY/2);
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
        var gX = parseFloat(this._afCurrentExtents[0]) +  (pX * this._nCellSize);
        var gY = parseFloat(this._afCurrentExtents[3]) - (pY * this._nCellSize);

        return {x:gX, y:gY};
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
                this._oEventDiv.style.cursor = cursor[i];
                if (this._oEventDiv.style.cursor == cursor[i]) 
                {
                    break;
                }
            }
        } 
        else if (typeof cursor == 'string') 
        {
            this._oEventDiv.style.cursor = cursor;
        } else 
        {
            this._oEventDiv.style.cursor = 'auto';	
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
         Event.observe(this._oEventDiv,  sEventName, fnCB);
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
         Event.stopObserving(this._oEventDiv,  sEventName, fnCB);
     },

     /**
     *
     * Register a widget in the list of mutally excluive widgets.
     * When one widget in this list is activated, all others are deactivated
     *
     * @param oWidget object widget
     */
     registerWidget : function(oWidget, bMutEx)
     {
         this._nWidgetId++;
         if (bMutEx)
         {
             this._aoWidgetsMutEx.push(new _WidgetInfo(oWidget, this._nWidgetId));
         }
         else
         {
             this._aoWidgets.push(new _WidgetInfo(oWidget, this._nWidgetId));
         }
         return this._nWidgetId;
     },

     

     /**
     *
     * call the Activate method on the widget
     * if widgets is set to be mutually exclusive,
     * all other widgets are deactivated
     *
     * @param nId integer widget id
     */
     activateWidget : function(nId)
     {
         var i = 0;
         var bFound = 0;

         for (i= 0; i< this._aoWidgets.length; i++)
         {
             if (nId == this._aoWidgets[i].nId)
             {
                 if (this._aoWidgets[i].oWidget.activate)
                 {
                     this._aoWidgets[i].oWidget.activate();
                 }
                 bFound = 1;
             }
         }
         /* if not in the general list of widgets, scan the mutex widgets*/
         if (!bFound)
         {
             for (var i= 0; i< this._aoWidgetsMutEx.length; i++)
             {
                 if (nId == this._aoWidgetsMutEx[i].nId)
                 {
                     if (this._aoWidgetsMutEx[i].oWidget.activate)
                       this._aoWidgetsMutEx[i].oWidget.activate();
                 }
                 else
                 {      
                     if (this._aoWidgetsMutEx[i].oWidget.deactivate)
                       this._aoWidgetsMutEx[i].oWidget.deactivate();
                 }
             }
         }
     },

     /**
     *
     * call the Activate method on the widget
     * if widgets is set to be mutually exclusive,
     * all other widgets are deactivated
     *
     * @param nId integer widget id
     */
     deactivateWidget : function(nId)
     {
         var i = 0;
         var bFound = 0;

         for (i= 0; i< this._aoWidgets.length; i++)
         {
             if (nId == this._aoWidgets[i].nId)
             {
                 if (this._aoWidgets[i].oWidget.deactivate)
                   this._aoWidgets[i].oWidget.deactivate();
                 bFound = 1;
             }
         }
         if (!bFound)
         {
             for (var i= 0; i< this._aoWidgetsMutEx.length; i++)
             {
                 if (nId == this._aoWidgetsMutEx[i].nId)
                 {
                     if (this._aoWidgetsMutEx[i].oWidget.deactivate)
                       this._aoWidgetsMutEx[i].oWidget.deactivate();
                 }
             }
         }
     }
};


/**
 * WidgetInfo
 *
 * Utility class to associate widget with it's id 
 *
 */
function _WidgetInfo(oWidget, nId)
{
    //alert("MapInfo::MapInfo");
    this.oWidget = oWidget;
    this.nId = nId;
}
