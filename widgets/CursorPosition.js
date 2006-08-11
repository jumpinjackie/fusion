/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose display the current cursor position on the map.
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
 * Displays the geographic position of the cursor when it is over the map.
 *
 * Place a CursorPosition widget in your application by first adding a
 * CursorPosition widget to your WebLayout as follows:
 *
 * <Command xsi:type="ChameleonCommandType">
 *  <Name>MyCursorPosition</Name>
 *  <Label>Cursor Position</Label>
 *  <TargetViewer>All</TargetViewer>
 *  <Action>CursorPosition</Action>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyCursorPosition"></div>
 *
 * It can appear anywhere inside the <body>.  You can style this div using
 * css, for instance:
 *
 * #MyCursorPosition {
 *    background-color: white;
 *    border: 1px solid black;
 *    padding: 2px;
 *    font-family: Arial;
 *    font-size: 12px;
 *    text-align: left;
 * }
 * **********************************************************************/

var CursorPosition = Class.create();
CursorPosition.prototype = 
{
    defaultTemplate: 'x: {x}, y: {y}',

    initialize : function(oCommand)
    {
        console.log('Maptip.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['Maptip', true]);
        this.setMap(oCommand.getMap());
        
        this._oCommand = oCommand;
        this.domObj = $(oCommand.getName());
        
        this.emptyText = this.domObj.innerHTML;
        
        this.template = oCommand.oxmlNode.getNodeText('Template');
        this.template = this.template == '' ? this.defaultTemplate : this.template;
        
        this.precision = oCommand.oxmlNode.getNodeText('Precision');
        this.precision = this.precision == '' ? -1 : this.precision;
        
        this.getMap().observeEvent('mousemove', this.mouseMove.bind(this));
        this.getMap().observeEvent('mouseout', this.mouseOut.bind(this));
        
    },
    
    mouseOut: function(e) {
        this.domObj.innerHTML = this.emptyText;
    },
    
    mouseMove: function(e) {
        var p = this.getMap().getEventPosition(e);
        var map = this.getMap();
        var loc = map.pixToGeo(p.x, p.y);
        if (this.precision >= 0) {
            var factor = Math.pow(10,this.precision);
            loc.x = Math.round(loc.x * factor)/factor;
            loc.y = Math.round(loc.y * factor)/factor;
        }
        this.domObj.innerHTML = this.template.replace('{x}',loc.x).replace('{y}',loc.y);
    }
};
