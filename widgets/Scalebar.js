/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Scalebar
 * @author yassefa@dmsolutions.ca
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
 * uses JavaScript Scale Bar for MapServer 
 * (http://mapserver.commenspace.org/tools/scalebar/
 * **********************************************************************/


Fusion.require('widgets/scalebar/scalebartool.js');

Fusion.Widget.Scalebar = Class.create();
Fusion.Widget.Scalebar.prototype = {
    style: 'thin',
    displaySystem: 'metric',
    minWidth: 100,
    maxWidth: 200,
    divisions: 2,
    subdivisions: 2,
    showMinorMeasures: true,
    abbreviateLabel: true,
    singleLine: false,
    initialize : function(oCommand) {
        //console.log('Scalebar.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['Scalebar', false, oCommand]);
        this.setMap(oCommand.getMap());
        
        this.oCommand = oCommand;
        
        var json = oCommand.jsonNode;
        this.style = json.Style ? json.Style[0].toLowerCase() : this.style;
        if (this.style != 'fancy' && 
            this.style != 'fat' && 
            this.style != 'thin' && 
            this.style != 'thinner') {
            this.style = 'thin';
        }
        
        this.displaySystem = json.DisplaySystem ? json.DisplaySystem[0] : this.displaySystem;
        this.minWidth = json.MinWidth ? json.MinWidth[0] : this.minWidth;
        this.maxWidth = json.MaxWidth ? json.MaxWidth[0] : this.maxWidth;
        this.divisions = json.Divisions ? json.Divisions[0] : this.divisions;
        this.subdivisions = json.SubDivisions ? json.SubDivisions[0] : this.subdivisions;
        this.hideInvisibleLayers = (json.HideInvisibleLayers && json.HideInvisibleLayers[0]) == 'true' ? true : false;
        this.showMinorMeasures = (json.ShowMinorMeasures && json.ShowMinorMeasures[0]) == 'false' ? false : true;
        this.abbreviateLabel = (json.AbbreviateLabel && json.AbbreviateLabel[0]) == 'true' ? true : false;
        this.singleLine = (json.SingleLine && json.SingleLine[0]) == 'true' ? true : false;
        
        
        if (document.styleSheets) {
            if (document.styleSheets[0]) {
                var url = Fusion.getFusionURL() + 'widgets/scalebar/scalebar-'+this.style+'.css';
                console.log(url);
                if (document.styleSheets[0].addImport) {
                    document.styleSheets[0].addImport(url);
                } else {
                    document.styleSheets[0].insertRule('@import url('+url+');',0);
                }
            }
        }

        this.oScaleBar = new ScaleBarTool(1);
        this.oScaleBar.displaySystem = this.displaySystem
        this.oScaleBar.minWidth = this.minWidth;
        this.oScaleBar.maxWidth = this.maxWidth;
        this.oScaleBar.divisions = this.divisions;
        this.oScaleBar.subdivisions = this.subdivisions;
        this.oScaleBar.showMinorMeasures = this.showMinorMeasures;
        this.oScaleBar.abbreviateLabel = this.abbreviateLabel;
        this.oScaleBar.singleLine = this.singleLine;
        this.oScaleBar.place(oCommand.getName());

        this.getMap().registerForEvent(Fusion.Event.MAP_EXTENTS_CHANGED, this.extentsChangedCB.bind(this));
        this.getMap().registerForEvent(Fusion.Event.MAP_LOADED, this.extentsChangedCB.bind(this));
    },

    extentsChangedCB : function() {
        this.oScaleBar.update(this.getMap().getScale());
    }
};
