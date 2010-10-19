/**
 * Fusion.Widget.MapMenu
 *
 * $Id$
 *
 * Copyright (c) 2007, DM Solutions Group Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

 /****************************************************************************
 * Class: Fusion.Widget.MapMenu
 *
 * A widget that displays a selection of maps that can be loaded into the 
 * application.  The list of maps is configured in the ApplicationDefinition.
 * **********************************************************************/

Fusion.Widget.MapMenu = OpenLayers.Class(Fusion.Widget,  {
    uiClass: Jx.Menu,
    domObj: null,
    mapGroupData: null,
    rootFolder: '',
    menus: null,
    initializeWidget: function(widgetTag) {
        this.enable();
    },
    
    setUiObject: function(uiObj) {
        Fusion.Widget.prototype.setUiObject.apply(this, [uiObj]);
        
        var json = this.widgetTag.extension;
        
        this.loadMaxExtent = json.LoadMaxExtent ? 
                      (json.LoadMaxExtent[0].toLowerCase() == 'true') : false;
        
        //If no folder is specified for enumeration, build a menu
        //from the mapgroup alone. Folders are only supported with MapGuide.
        //Otherwise, create a hash of mapgroup resourceId to mapGroup data
        //to be used to assign mapgroup extensions to enumerated maps.
        
        var mapGroups = Fusion.applicationDefinition.mapGroups;
        this.mapGroupData = {};
        for (var key in mapGroups) {
            if (mapGroups[key].mapId) {
                var mapGroup = mapGroups[key];
                if (json.Folder) {
                    this.mapGroupData[mapGroup.maps[0].resourceId] = mapGroup; 
                } else {
                    var data = mapGroup;
                    var menuItem = new Jx.Menu.Item({
                        label: mapGroup.mapId,
                        onClick: OpenLayers.Function.bind(this.switchMap, this, data)
                    });
                    this.uiObj.add(menuItem);
                }
            }
        }

        //get the mapdefinitions as xml if there  is a folder specified
        //in the widget tag. All subfolders will be enumerated.
        //FIXME: this should be platform agnostic, Library:// isn't!
        //FIXME: use JSON rather than XML        
        this.arch = this.getMap().getAllMaps()[0].arch;
        if (this.arch == 'MapGuide' && json.Folder) {
            this.rootFolder = json.Folder ? json.Folder[0] : 'Library://';
            var s = 'layers/' + this.arch + '/' + Fusion.getScriptLanguage() +
                          '/MapMenu.' + Fusion.getScriptLanguage();
            var params =  {parameters: {'folder': this.rootFolder},
                          onComplete: OpenLayers.Function.bind(this.processMapMenu, this)};
            Fusion.ajaxRequest(s, params);
        } else if (this.arch == 'MapServer' && json.Folder) {
            this.rootFolder = json.Folder ? json.Folder[0] : '/';
            //var s = 'layers/' + this.arch + '/' + Fusion.getScriptLanguage() + '/MapMenu.' + Fusion.getScriptLanguage();
            var s = json.ListURL ? json.ListURL[0] : '/platform/api/mapsherpa.php';
            var options =  {
                  parameters: {
                    request: 'listpublishedmaps',
                    depth: -1,
                    folder: this.rootFolder
                  },
                  method: 'GET',
                  onComplete: OpenLayers.Function.bind(this.processMSMapMenu, this)
            };
            var temp = new OpenLayers.Ajax.Request( s, options);
        };
    },
    
    processMSMapMenu: function(r) {
        if (r.status == 200) {
            var o;
            eval("o="+r.responseText);
            //var testData = '{"success":true,"errorMessages":[],"values":[{"sPath":"/ms4w/apps/gmap/cap/HamiltonLowIncome.map","sPermissions":"2","sResourceId":"/Hamilton/Hamilton Low Income","sMapResource":"/Hamilton/hamilton_low_income"},{"sPath":"/mnt/FGS_ENVIRONS/fgs-cap/apps/platform/data/home/root/Canada1.map","sPermissions":"2","sResourceId":"/Canada/Canada1","sMapResource":"/Canada/Canada"}],"request":"listpublishedmaps","version":1}';
            //eval("o="+testData);
            this.menus = {};
            var list = o.values;
            if (o.values) {
              var basemap = this.getMap().aMaps[0];
              for (var i=0; i<list.length; i++) {
                  var resource = list[i];
                  var mapId = resource.sResourceId;
                  mapId = mapId.replace(this.rootFolder, '');
                  var folders = mapId.split('/');
                  var label = folders.pop();
                  var path = folders.join('/');
                  this.createFolders(path);
                  
                  // check for mapgroup data and if there is none,
                  // create a maptag that will be passed to the map
                  // widget constructor 
                  data = {maps:[{'resourceId': resource.sResourceId,
                          'singleTile':true,
                          'type': this.arch,
                          'extension':{
                            'MapFile': [resource.sPath],
                            'MapMetadata': [basemap.mapMetadataKeys],
                            'LayerMetadata': [basemap.layerMetadataKeys]
                          }
                         }]};
                  //set up needed accessor
                  data.getInitialView = function() {
                      return this.initialView;
                  };
                  var menuItem = new Jx.Menu.Item({
                      label: label,
                      onClick: OpenLayers.Function.bind(this.switchMap, this, data)
                  });
                  
                  if (path == '') {
                      this.uiObj.add(menuItem);
                  }else {
                      this.menus[path].add(menuItem);
                  }
              }
            }
        }
    },
    
    processMapMenu: function(r) {
        if (r.status == 200) {
            var o;
            eval("o="+r.responseText);
            this.menus = {};
            for (var i=0; i<o.maps.length; i++) {
                var map = o.maps[i];
                var path = map.path.replace(this.rootFolder, '');
                if (path.lastIndexOf('/') > -1) {
                    path = path.slice(0, path.lastIndexOf('/'));
                    this.createFolders(path);
                } else {
                    path = '';
                }
                
                // check for mapgroup data and if there is none,
                // create a maptag that will be passed to the map
                // widget constructor 
                var data = null;
                if (this.mapGroupData[map.path]) {
                    data = this.mapGroupData[map.path];
                } else {
                    data = {maps:[{'resourceId':map.path,
                            'singleTile':true,
                            'type': this.arch,
                            'extension':{'ResourceId': [map.path]}
                           }]};
                    //set up needed accessor
                    data.getInitialView = function() {
                        return this.initialView;
                    };
                }
                var menuItem = new Jx.Menu.Item({
                    label: map.name,
                    onClick: OpenLayers.Function.bind(this.switchMap, this, data)
                });
                
                if (path == '') {
                    this.uiObj.add(menuItem);
                }else {
                    this.menus[path].add(menuItem);
                }
            }
        }
    },
    
    createFolders: function(id) {
        var folders = id.split('/');
        //loop through folders, creating them if they don't exist
        var parent = '';
        var pathSeparator = '';
        for (var i=0; i<folders.length; i++) {
            if (!this.menus[parent + pathSeparator + folders[i]]){
                var menu = new Jx.Menu.SubMenu({label:folders[i]});
                if (parent == '') {
                    this.uiObj.add(menu);
                } else {
                    this.menus[parent].add(menu);
                }
                this.menus[parent + pathSeparator + folders[i]] = menu;
            }
            parent = parent + pathSeparator + folders[i];
            pathSeparator = '/';
        }
    },
    
    //action to perform when the button is clicked
    //activateTool: function() {
    //    this.oMenu.show();
    //},
        
    //change the map, preserving current extents
    switchMap: function(data) {
        data.initialView = null;
        if (!this.loadMaxExtent) {
          var ce = this.getMap().getCurrentExtents();
          var dest = null;
          for (var i=0; i<data.maps.length; ++i) {
            if (data.maps[i].layerOptions && data.maps[i].layerOptions.projection) {
              dest = new OpenLayers.Projection(data.maps[i].layerOptions.projection);
              if (data.maps[i].layerOptions.isBaseLayer) {
                break;
              }
            }
          }
          if (!dest) {
            dest = new OpenLayers.Projection("EPSG:4326");
          }
          ce = ce.transform(this.oMap.oMapOL.getProjectionObject(), dest);
          data.initialView = {minX:ce.left,
                            minY:ce.bottom,
                            maxX:ce.right,
                            maxY:ce.top,
                            projection: dest
                            };        
        }
        this.getMap().loadMapGroup(data);
    }
});
