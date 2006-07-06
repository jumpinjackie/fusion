/********************************************************************** * 
 * @project MapGuide? Open Source Web Studio
 * @revision $Id$
 * @purpose this file contains classes that manage the view of an object
 * @author Paul Spencer pspencer@dmsolutions.ca
 * @author Zak James zjames at dmsolutions dot ca
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

var MGMap = Class.create();
Object.extend(MGMap.prototype, GxMap.prototype);
Object.extend(MGMap.prototype, 
{
    initialize : function(sDomObj, sMapname, fMetersperunit, aExtents, oConfigObj)
    {
        //alert("MGMap::initialize");
         this.initializeGxMap(sDomObj, aExtents);

         this_oConfigObj = oConfigObj;

         this._fMetersperunit = fMetersperunit;
         this._sMapname = sMapname;
         this._fScale = -1;
         this._nDpi = 96;

         this._calculateScale();
    },

    setExtents : function(aExtents)
    {
        this.setExtentsGxMap(aExtents);
        this._calculateScale();
        this.drawMap();
    },

    _calculateScale : function()
    {
        var fMetersPerPixel = 0.0254 / this._nDpi;
        var fdeltaX = this._afCurrentExtents[2] - this._afCurrentExtents[0];
        var fdeltaY = this._afCurrentExtents[3] - this._afCurrentExtents[1];
    
        var nWidth = getObjectWidth(this._oDomObj);
        var nHeight = getObjectHeight(this._oDomObj);

   
        if (fdeltaX *  nWidth >  fdeltaY * nHeight)
          this._fScale =  
             fdeltaX * this._fMetersperunit / (nWidth * fMetersPerPixel);
        else
          this._fScale = fdeltaY * this._fMetersperunit / (nHeight * fMetersPerPixel); 
    },

    drawMap : function()
    {
        //alert("MGMap::drawMap");
        var cx = (this._afCurrentExtents[0] + this._afCurrentExtents[2])/2;
        var cy = (this._afCurrentExtents[1] + this._afCurrentExtents[3])/2;   
        
        var nWidth = getObjectWidth(this._oDomObj);
        var nHeight = getObjectHeight(this._oDomObj);

        var sReqParams = "OPERATION=GETVISIBLEMAPEXTENT&VERSION=1.0.0&SESSION=" + this_oConfigObj.getSessionId() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();


        sReqParams += "&SETDISPLAYDPI=" + this._nDpi + "&SETDISPLAYWIDTH=" + nWidth + "&SETDISPLAYHEIGHT=" + nHeight;
        sReqParams += "&SETVIEWSCALE=" + this._fScale + "&SETVIEWCENTERX=" + cx + "&SETVIEWCENTERY=" + cy;

        //window.open('http://localhost/MapServer/MapAgent/MapAgent.fcgi?'+reqParams);
        var url =  this_oConfigObj.getWebagentURL() + sReqParams;
        //window.open(url);
        call (url, this, this._requestMapImage);
    },

    _requestMapImage : function(r)
    {
        var nWidth = getObjectWidth(this._oDomObj);
        var nHeight = getObjectHeight(this._oDomObj);

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
      
              this._nCellSize  = Math.max(
                                          Math.abs((this._afCurrentExtents[2] - this._afCurrentExtents[0])/
                                                   parseInt(nWidth)),
                                          Math.abs((this._afCurrentExtents[3] - this._afCurrentExtents[1])/
                                                   parseInt(nHeight))
                                          );

     
        }
        else
        {
              //alert("non valid");
        }
    
        url = this_oConfigObj.getWebagentURL() + "OPERATION=GETDYNAMICMAPOVERLAYIMAGE&FORMAT=PNG&VERSION=1.0.0&SESSION=" + this_oConfigObj.getSessionId() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();

    
        if (this._oImg.width != nWidth || this._oImg.height != nWidth) {
            this._oImg.src = 'images/a_pixel.gif';
            this._oImg.width = nWidth;
            this._oImg.height = nHeight;
        }
    
        this._oImg.src = url;
    },        

    queryRect : function(fMinX, fMinY, fMaxX, fMaxY)
    {
        var sReqParams = "OPERATION=QUERYMAPFEATURES&VERSION=1.0.0&SESSION=" + this_oConfigObj.getSessionId() + "&MAPNAME=" + this._sMapname + "&SEQ=" + Math.random();
        sReqParams += '&GEOMETRY=POLYGON(('+ fMinX + ' ' +  fMinY + ', ' +  fMaxX + ' ' +  fMinY + ', ' + fMaxX + ' ' +  fMaxY + ', ' + fMinX + ' ' +  fMaxY + ', ' + fMinX + ' ' +  fMinY + '))';
 
        sReqParams += '&SELECTIONVARIANT=INTERSECTS';
        sReqParams += '&MAXFEATURES=-1';
        sReqParams += '&PERSIST=1';

        var sUrl = this_oConfigObj.getWebagentURL() + sReqParams;
    
        //this function calls drawMap to update  the map image.
        //TODO : use the ProcessQueryResults functions to parse the xml results
    
        call (sUrl, this,  this.drawMap);
        //call (url, this,  this.ProcessQueryResults);

    }
     
});
