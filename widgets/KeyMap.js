/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Key map widget
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
 * **********************************************************************/
var KeyMap = Class.create();
KeyMap.prototype =   {
    fMinX : -1,  
    oDomImgObj : null,
  
    initialize : function(oCommand) {
        //console.log('KeyMap.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['KeyMap', false, oCommand]);
        this.setMap(oCommand.getMap());
        
        var json = oCommand.jsonNode;
        
        this.oDomObj = $(oCommand.getName());

        this.sImageURL = json.KeyMapImageURL[0];
        this.fMinX = json.MinX ? json.MinX[0] : -1;
        this.fMinY = json.MinY ? json.MinY[0] : -1;
        this.fMaxX = json.MaxX ? json.MaxX[0] : -1;
        this.fMaxY = json.MaxY ? json.MaxY[0] : -1;
        
        var size = Element.getDimensions(this.oDomObj);
        this.nWidth = size.width;
        this.nHeight = size.height;
        console.log('keymap width: '+this.nWidth + ', height: ' + this.nHeight);

        this.fCellWidth =  (this.fMaxX - this.fMinX)/this.nWidth;
        this.fCellHeight = (this.fMaxY - this.fMinY)/this.nHeight;

        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this.extentsChanged.bind(this));
        this.getMap().registerForEvent(MAP_LOADED, this.mapLoaded.bind(this));
        this.getMap().registerForEvent(MAP_RESIZED, this.mapResized.bind(this));
    },
    
    mapLoaded: function() {
        this.draw();
    },
    
    mapResized: function() {
        this.draw();
    },
    
    extentsChanged : function() {
        this.draw();
    },

    draw : function() {
        if (!this.oDomImgObj) {
            //create an image to hold the keymap
            this.oDomImgObj = document.createElement( 'img' );
            this.oDomImgObj.src = this.sImageURL;
            this.oDomImgObj.width = this.nWidth;
            this.oDomImgObj.height = this.nHeight;
            this.oDomObj.appendChild(this.oDomImgObj );


            //create a div to track the current extents
            this.oDomExtents = document.createElement( 'div' );
            this.oDomExtents.id="keymapDomExtents";
            this.oDomExtents.style.position = 'absolute';
            this.oDomExtents.style.border = '1px solid red';
            this.oDomExtents.style.top = "1px";
            this.oDomExtents.style.left = "1px";
            this.oDomExtents.style.width = "1px";
            this.oDomExtents.style.height = "1px";
            this.oDomExtents.style.backgroundColor = 'transparent';
            this.oDomExtents.style.visibility = 'visible';
            this.oDomObj.appendChild(this.oDomExtents);
        }

        this.update();
    },

    update : function() {  
        var size = Element.getDimensions(this.oDomObj);
        this.nWidth = size.width;
        this.nHeight = size.height;
        console.log('update keymap width: '+this.nWidth + ', height: ' + this.nHeight);

        this.fCellWidth =  (this.fMaxX - this.fMinX)/this.nWidth;
        this.fCellHeight = (this.fMaxY - this.fMinY)/this.nHeight;
        
        var aMapExtents = this.getMap().getCurrentExtents();
        if (!aMapExtents) {
            return;
        }

        var fDeltaX = (aMapExtents[2] - aMapExtents[0])/(this.fMaxX - this.fMinX)
        var fDeltaY = (aMapExtents[3] - aMapExtents[1])/(this.fMaxY - this.fMinY)
        
        var width = parseInt(this.nWidth * fDeltaX);
        var height = parseInt(this.nHeight * fDeltaY);

        var fStartW = (aMapExtents[0] - this.fMinX)/(this.fMaxX - this.fMinX);
        var left = parseInt(this.nWidth * fStartW);
        
        var fStartH = (this.fMaxY - aMapExtents[3])/(this.fMaxY - this.fMinY);
        var top = parseInt(this.nHeight * fStartH);

        this.oDomExtents.style.top = parseInt(top+0.5)+"px";
        this.oDomExtents.style.left = parseInt(left+0.5)+"px";

        this.oDomExtents.style.width = parseInt(width+0.5) + "px";
        this.oDomExtents.style.height = parseInt(height+0.5) + "px";

        this.oDomExtents.style.visibility = 'visible';
    }
};
      
