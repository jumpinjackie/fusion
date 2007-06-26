/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose display the current cursor position on the map.
 * @author pspencer@dmsolutions.ca
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 ********************************************************************
 *
 * Displays the geographic position of the cursor when it is over the map.
 *
 * Place a CursorPosition widget in your application by first adding a
 * CursorPosition widget to your WebLayout as follows:
 *
 * <Command xsi:type="CursorPositionCommandType">
 *  <Name>MyCursorPosition</Name>
 *  <Label>Cursor Position</Label>
 *  <TargetViewer>All</TargetViewer>
 *  <Action>CursorPosition</Action>
 *  <Precision>4</Precision>
 *  <Template>x: {x}&lt;br/&gt;y: {y}</Template>
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
 *
 * Precision (integer, optional)
 *
 * The number of digits to round the output to.  The geographic location
 * is calculated with arbitrary precision and is often not necessary. A
 * value of less than 0 means no rounding (the default if parameter is
 * missing).
 *
 * Template (string, optional) 
 *
 * The format of the output string.  Use {x} and {y} as placeholders for
 * the x and y location.  The default template is:
 *
 * x: {x}, y: {y}
 *
 * You can embed HTML in the template, but you must escape any characters
 * that result in illegal HTML.  This would include:
 *
 * < is &lt;
 * > is &gt;
 * & is &amp;
 *
 * So a two-line display would be:
 *
 * x: {x}&lt;br/&gt;y: {y}
 * **********************************************************************/

var CursorPosition = Class.create();
CursorPosition.prototype = {
    defaultTemplate: 'x: {x}, y: {y}',
    
    /* the units to display distances in */
    units: Fusion.UNKNOWN,

    initialize : function(oCommand) {
        //console.log('CursorPosition.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['CursorPosition', true, oCommand]);
        this.setMap(oCommand.getMap());
        
        this._oCommand = oCommand;
        this.domObj = $(oCommand.getName());
        
        this.emptyText = this.domObj.innerHTML;
        
        var json = oCommand.jsonNode;
        
        this.template = json.Template ? json.Template[0] : this.defaultTemplate;
        this.precision = json.Precision ? parseInt(json.Precision[0]) : -1;
        this.units = json.Units ? Fusion.unitFromName(json.Units[0]) : Fusion.UNKOWN;

        this.enable = CursorPosition.prototype.enable;
        this.disable = CursorPosition.prototype.enable;
        
        this.mouseMoveWatcher = this.mouseMove.bind(this);
        this.mouseOutWatcher = this.mouseOut.bind(this);
    },
    
    enable: function() {
        this.getMap().observeEvent('mousemove', this.mouseMoveWatcher);
        this.getMap().observeEvent('mouseout', this.mouseOutWatcher);
    },
    
    disable: function() {
        this.getMap().stopObserveEvent('mousemove', this.mouseMoveWatcher);
        this.getMap().stopObserveEvent('mouseout', this.mouseOutWatcher);
    },
    
    mouseOut: function(e) {
        this.domObj.innerHTML = this.emptyText;
    },
    
    mouseMove: function(e) {
        var map = this.getMap();
        var p = map.getEventPosition(e);
        if (this.units != Fusion.PIXELS) {
            p = map.pixToGeo(p.x, p.y);
            if (p) {
                if (this.units != Fusion.UNKNOWN) {
                    p.x = Fusion.fromMeter(this.units, p.x * map._fMetersperunit);
                    p.y = Fusion.fromMeter(this.units, p.y * map._fMetersperunit);
                }
                if (this.precision >= 0) {
                    var factor = Math.pow(10,this.precision);
                    p.x = Math.round(p.x * factor)/factor;
                    p.y = Math.round(p.y * factor)/factor;
                }
            }
        }
        if (p) {
            var unitAbbr = Fusion.unitAbbr(this.units);
        
            this.domObj.innerHTML = this.template.replace('{x}',p.x).replace('{y}',p.y).replace('{units}', unitAbbr).replace('{units}', unitAbbr);
        }
    },

    setParameter: function(param, value) {
        if (param == 'Units') {
            this.units = Fusion.unitFromName(value);
        }
    }
};
