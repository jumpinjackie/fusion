/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
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
KeyMap.prototype =  
{
    oCommad : null,
    fMinX : -1,  
    oDomImgObj : null,
  
    initialize : function(oCommand)
    {
        //console.log('KeyMap.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['KeyMap', false]);
        this.setMap(oCommand.getMap());
        
        this.oCommand = oCommand;
        
        //this.oDomObj = getRawObject(oCommand.getName());
        this.oDomObj = $(oCommand.getName());

        this.sImageURL = this.oCommand.oxmlNode.getNodeText('KeyMapImageURL');
        this.fMinX = this.oCommand.oxmlNode.getNodeText('MinX');
        this.fMinY = this.oCommand.oxmlNode.getNodeText('MinY');
        this.fMaxX = this.oCommand.oxmlNode.getNodeText('MaxX');
        this.fMaxY = this.oCommand.oxmlNode.getNodeText('MaxY');
        this.nWidth = this.oCommand.oxmlNode.getNodeText('KeyMapWidth');
        this.nHeight = this.oCommand.oxmlNode.getNodeText('KeyMapHeight');

        this.fCellWidth =  (this.fMaxX - this.fMinX)/this.nWidth;
        this.fCellHeight = (this.fMaxY - this.fMinY)/this.nHeight;

        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, this, this.extentsChangedCB);

        this.draw();
       
    },

    extentsChangedCB : function()
    {
        this.update();
    },


    draw : function()
    {
  
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

        this.update();
    },

    update : function()
    {  
        var aMapExtents = this.getMap().getCurrentExtents();

        var fDeltaX = (aMapExtents[2] - aMapExtents[0])/(this.fMaxX - this.fMinX)
        var fDeltaY = (aMapExtents[3] - aMapExtents[1])/(this.fMaxY - this.fMinY)
        
        var width = parseInt(this.nWidth * fDeltaX);
        var height = parseInt(this.nHeight * fDeltaY);

        var fStartW = (aMapExtents[0] - this.fMinX)/(this.fMaxX - this.fMinX);
        var left = parseInt(this.nWidth * fStartW);
        
        var fStartH = (this.fMaxY - aMapExtents[3])/(this.fMaxY - this.fMinY);
        var top = parseInt(this.nHeight * fStartH);

        //var oleft = (aMapExtents[0] - this.fMinX) / this.fCellWidth;
        //var owidth = (aMapExtents[2] - this.fMinX) / this.fCellWidth;
        //var otop = -1 * (aMapExtents[3] - this.fMaxY) / this.fCellHeight;
        //var oheight = (aMapExtents[3] - this.fMinY) / this.fCellHeight;

        //alert('new left=' + left + ' old left=' + oleft);
        //alert('new top=' + top + ' old top=' + otop);
        //alert('new width=' + width + ' old width=' + owidth);
        //alert('new height=' + height + ' old height=' + oheight);

        this.oDomExtents.style.top = parseInt(top+0.5)+"px";
        this.oDomExtents.style.left = parseInt(left+0.5)+"px";

        this.oDomExtents.style.width = parseInt(width+0.5) + "px";
        this.oDomExtents.style.height = parseInt(height+0.5) + "px";

        this.oDomExtents.style.visibility = 'visible';
    }
};
      
