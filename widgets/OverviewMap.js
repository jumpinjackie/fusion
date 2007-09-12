/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Key map widget
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
 * **********************************************************************/
Fusion.Widget.OverviewMap = Class.create();
Fusion.Widget.OverviewMap.prototype = {
    nWidth : 200,
    nHeight : 100,
    nMinRatio : 8,
    nMaxRatio : 128,
  
    initialize : function(widgetTag) {
        //console.log('OverviewMap.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, [widgetTag, false]);
        
        var json = widgetTag.extension;

        if (json.mapGroup) {
          this.sMapGroup = json.mapGroup;
        }
        this.nMinRatio = json.MinRatio ? json.MinRatio[0] : 8;
        this.nMaxRatio = json.MaxRatio ? json.MaxRatio[0] : 128;

        //first set the size to the size of the DOM element if available
        if (this.domObj) {
          this.nWidth = this.domObj.getWidth();
          this.nHeight = this.domObj.getHeight();
        }
        //but you can also override these with values form AppDef
        if (json.Width) this.nWidth = json.Width;
        if (json.Height) this.nHeight = json.Height;

        this.oSize = new OpenLayers.Size(this.nWidth, this.nHeight);

        this.getMap().registerForEvent(Fusion.Event.MAP_LOADED, this.mapLoaded.bind(this));
    },
    
    mapLoaded: function() 
    {
        var map = this.getMap();
        var mapOpts = {
          //size: this.oSize,
          minRatio: this.nMinRatio,
          maxRatio: this.nMaxRatio
        }
        if (this.oMapOptions) mapOpts.mapOptions = this.oMapOptions;
        if (this.sMapGroup) {
          var mapGroup = Fusion.Lib.ApplicationDefinition.getMapGroup(this.sMapGroup);
          var mapTag = mapGroup.maps[0];    //TODO: always use the baselayer Map in the group?
          var keymap = new eval("new Fusion.Maps."+mapTag.type+"(map,mapTag)");
          mapOpts.layers = keymap.oLayerOL;
        } else {
          //just use the base map layer
          //mapOpts.layers = map.aMaps[0].oLayerOL.clone();
        }
        mapOpts.div = this.domObj;

        this.control = new OpenLayers.Control.OverviewMap(mapOpts);
        map.oMapOL.addControl(this.control);

        //console.log('OverviewMap mapLoaded');
    }
};
      
