/**
 * Fusion.Widget.BasemapSwitcher
 *
 * $Id: BasemapSwitcher.js 
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

 /*****************************************************************************
 * Class: Fusion.Widget.BasemapSwitcher
 *
 * A widget to allow selection of the basemaps display under the overlay MapGuide layer
 * Currently, Google Street, Google Satellite, Google Hybrid, Yahoo Street, Yahoo Satellite,
 * Yahoo Hybrid, Bing Street, Bing Satellite and Bing Hybrid is supported. 
 ****************************************************************************/

Fusion.Widget.BasemapSwitcher = OpenLayers.Class(Fusion.Widget, {
    uiClass: Jx.Menu,

    options: {},

    baseMaps: {},

    defaultBasemap: null,

    menuItems: {},

    initializeWidget: function(widgetTag) {
        this.getMap().registerForEvent(Fusion.Event.MAP_MAP_GROUP_LOADED, OpenLayers.Function.bind(this.setDefaultBasemap, this));
    },

    refreshSettings: function() {
        this.baseMaps = {};
        this.defaultBasemap = null;
        this.menuItems = {};
        this.options = {
            'G_NORMAL_MAP': null,
            'G_SATELLITE_MAP': null,
            'G_HYBRID_MAP': null,
            'YAHOO_MAP_REG': null,
            'YAHOO_MAP_SAT': null,
            'YAHOO_MAP_HYB': null,
            'Road': null,
            'Aerial': null,
            'Hybrid': null,
            'None': null
        };
    },

    generateOptions: function() {
        // Clear previous settings 
        this.refreshSettings();

        var maps = this.getMap().aMaps;
        for (var i = 0, len = maps.length; i < len; i++) {
            var map = maps[i];
            switch (map.layerType) {
                case 'MapGuide':
                    this.options['None'] = 'None';
                    this.baseMaps['None'] = map;
                    break;
                case 'Google':
                    // if user didn't indicate basemap types, use the default Google Street
                    if (!map.mapTag.extension.Options || !map.mapTag.extension.Options[0].type) {
                        this.options['G_NORMAL_MAP'] = "Google Street";
                        this.baseMaps['G_NORMAL_MAP'] = map;

                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = "G_NORMAL_MAP";
                        }
                    }
                    else {
                        switch (map.mapTag.extension.Options[0].type[0]) {
                            case 'G_NORMAL_MAP':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['G_NORMAL_MAP'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['G_NORMAL_MAP'] = "Google Street";
                                this.baseMaps['G_NORMAL_MAP'] = map;
                                break;
                            case 'G_SATELLITE_MAP':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['G_SATELLITE_MAP'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['G_SATELLITE_MAP'] = "Google Satellite";
                                this.baseMaps['G_SATELLITE_MAP'] = map;
                                break;
                            case 'G_HYBRID_MAP':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['G_HYBRID_MAP'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['G_HYBRID_MAP'] = "Google Hybrid";
                                this.baseMaps['G_HYBRID_MAP'] = map;
                                break;
                            default:
                                break;
                        }

                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = map.mapTag.extension.Options[0].type[0];
                        }
                    }
                    break;

                case 'Yahoo':
                    // if user didn't indicate basemap types, use the default Yahoo Street
                    if (!map.mapTag.extension.Options || !map.mapTag.extension.Options[0].type) {
                        this.options['YAHOO_MAP_REG'] = "Yahoo Street";
                        this.baseMaps['YAHOO_MAP_REG'] = map;

                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = "YAHOO_MAP_REG";
                        }
                    }
                    else {
                        switch (map.mapTag.extension.Options[0].type[0]) {
                            case 'YAHOO_MAP_REG':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['YAHOO_MAP_REG'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['YAHOO_MAP_REG'] = "Yahoo Street";
                                this.baseMaps['YAHOO_MAP_REG'] = map;
                                break;
                            case 'YAHOO_MAP_SAT':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['YAHOO_MAP_SAT'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['YAHOO_MAP_SAT'] = "Yahoo Satellite";
                                this.baseMaps['YAHOO_MAP_SAT'] = map;
                                break;
                            case 'YAHOO_MAP_HYB':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['YAHOO_MAP_HYB'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['YAHOO_MAP_HYB'] = "Yahoo Hybrid";
                                this.baseMaps['YAHOO_MAP_HYB'] = map;
                                break;
                            default:
                                break;
                        }
                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = map.mapTag.extension.Options[0].type[0];
                        }
                    }
                    break;
                case 'VirtualEarth':
                    // if user didn't indicate basemap types, use the default Bing Street
                    if (!map.mapTag.extension.Options || !map.mapTag.extension.Options[0].type) {
                        this.options['Road'] = "Bing Street";
                        this.baseMaps['Road'] = map;
                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = "Road";
                        }
                    }
                    else {

                        switch (map.mapTag.extension.Options[0].type[0]) {
                            case 'Road':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['Road'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['Road'] = "Bing Street";
                                this.baseMaps['Road'] = map;
                                break;
                            case 'Aerial':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['Aerial'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['Aerial'] = "Bing Satellite";
                                this.baseMaps['Aerial'] = map;
                                break;
                            case 'Hybrid':
                                if (map.mapTag.extension.Options[0].name)
                                    this.options['Hybrid'] = map.mapTag.extension.Options[0].name[0];
                                else
                                    this.options['Hybrid'] = "Bing Hybrid";
                                this.baseMaps['Hybrid'] = map;
                                break;
                            default:
                                break;
                        }
                        // The first non-MapGuide basemap will be the default basemap
                        if (!this.defaultBasemap) {
                            this.defaultBasemap = map.mapTag.extension.Options[0].type[0];
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        if (!this.defaultBasemap) {
            this.defaultBasemap = "None";
        }
    },

    setUiObject: function(uiObj) {
        Fusion.Widget.prototype.setUiObject.apply(this, [uiObj]);
        this.setDefaultBasemap();
    },

    setBasemap: function(baseMap) {
        if ("None" != baseMap && this.getMap().oMapOL.baseLayer.CLASS_NAME == "OpenLayers.Layer.MapGuide") {
            var visibility = this.baseMaps["None"].oLayerOL.visibility;
            this.getMap().oMapOL.setBaseLayer(this.baseMaps[baseMap].oLayerOL, false);
            // Keep the MapGuide layers visibility
            this.baseMaps["None"].oLayerOL.visibility = visibility;
            this.baseMaps["None"].oLayerOL.redraw();
        }
        else {
            this.getMap().oMapOL.setBaseLayer(this.baseMaps[baseMap].oLayerOL, false);
        }

    },

    setDefaultBasemap: function() {
        this.generateOptions();
        //re-generate the menu
        this.uiObj.initialize();

        //set up the root menu
        var buttonSet = new Jx.ButtonSet();
        for (var key in this.options) {
            if (this.options[key]) {
                var menuItem = new Jx.Menu.Item({
                    label: OpenLayers.i18n(this.options[key]),
                    toggle: true,
                    onDown: OpenLayers.Function.bind(this.setBasemap, this, key)
                });
                buttonSet.add(menuItem);
                this.uiObj.add(menuItem);
                this.menuItems[key] = menuItem;
            }
        }
        this.menuItems[this.defaultBasemap].setActive(true);
        this.setBasemap(this.defaultBasemap);
    }
});
