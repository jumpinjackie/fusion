/**
 * Fusion.Widget.LayerManager
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

 /***************************************************************************
 * Class: Fusion.Widget.LayerManager
 * 
 * Displays a LayerManager of all the layers in the map as a collapsable tree.
 *
 * ShowRootFolder (boolean, optional)
 *
 * This controls whether the tree will have a single root node that
 * contains the name of the map as its label.  By default, the root
 * node does not appear.  Set to "true" or "1" to make the root node
 * appear.
 *
 * RootFolderIcon: (string, optional)
 *
 * The url to an image to use for the root folder.  This only has an
 * affect if ShowRootFolder is set to show the root folder.
 *
 * LayerThemeIcon: (string, optional)
 *
 * The url to an image toTopography use for layers that are currently themed.
 *
 * DisabledLayerIcon: (string, optional)
 *
 * The url to an image to use for layers that are out of scale.
 *
 * **********************************************************************/

Fusion.Widget.LayerManager = OpenLayers.Class(Fusion.Widget,  {
    currentNode: null,
    bIsDrawn: false,
    map: null,
    initializeWidget: function(widgetTag) {
        //console.log("initializeWidget");
        var json = widgetTag.extension;
        this.delIconSrc = json.DeleteIcon ? json.DeleteIcon[0] : 'images/icons/select-delete.png';
        this.infoIconSrc = json.LayerInfoIcon ? json.LayerInfoIcon[0] : 'images/icons/tree_layer_info.png';
    
        Fusion.addWidgetStyleSheet(widgetTag.location + 'LayerManager/LayerManager.css');
        this.cursorNormal = ["url('images/grab.cur'),move", 'grab', '-moz-grab', 'move'];
        this.cursorDrag = ["url('images/grabbing.cur'),move", 'grabbing', '-moz-grabbing', 'move'];
        this.map = this.getMap();
        this.map.registerForEvent(Fusion.Event.MAP_LOADED, OpenLayers.Function.bind(this.mapLoaded, this));
        this.map.registerForEvent(Fusion.Event.MAP_RELOADED, OpenLayers.Function.bind(this.mapReLoaded, this));
        this.map.registerForEvent(Fusion.Event.MAP_SCALE_RANGE_LOADED, OpenLayers.Function.bind(this.scaleRangeLoaded, this));
        // update changes to the legend in this widget
        this.map.aMaps[0].registerForEvent(Fusion.Event.LAYER_PROPERTY_CHANGED, OpenLayers.Function.bind(this.layerChanged,this));
    },
    
    scaleRangeLoaded: function() {
        this.draw();
    },
    mapLoaded: function() {
        //this.draw();
    },
    
    layerChanged: function(eventId, layer) {
        this.updateLayer(this.map.aMaps[0]);
        this.updateSessionMapFile();
    },
    mapReLoaded: function(){
        this.draw();
   },
   
   /**
     * remove the dom objects representing the legend layers and groups
     */
    clear: function(node) {
        //console.log("clear");
        while (node.childNodes.length > 0) {
          this.clear(node.childNodes[0]);
            node.removeChild(node.childNodes[0]);
        }
    },
  
    /**
     * Draws the layer manager
     *
     * @param r Object the reponse xhr object
     */
    draw: function(r) {
        //console.log("draw");
      if (this.mapList) {
        this.clear(this.mapList);
        //this.mapList.destroy();
        this.mapList = null;
      }
       
      //create the master UL element to hold the list of layers
      this.mapList = document.createElement('ul');
      this.mapList.className = 'jxLman';
      this.domObj.appendChild(this.mapList);
        
      //this processes the OL layers
      var map = this.getMap();

      for (var i=0; i<map.aMaps.length; ++i) {
        var mapBlock = document.createElement('li');
        mapBlock.className = 'jxLmanMap';
        mapBlock.id = 'mapBlock_'+i;

        //add a handle so the map blocks can be re-arranged
        var handle = document.createElement('a');
        handle.innerHTML = map.aMaps[i]._sMapTitle;
        handle.className = 'jxLmanHandle';
        mapBlock.appendChild(handle);
        
        this.mapList.appendChild(mapBlock);
        this.processMapBlock(mapBlock, map.aMaps[i]);
      }
      
      if (map.aMaps.length >1) {
        var options = [];
        options.onUpdate = OpenLayers.Function.bind(this.updateMapBlock, this, map);
        options.handle = 'jxLmanHandle';
        options.scroll = this.domObj.id;
        Sortable.create(this.mapList.id, options);
      }
    },

    processMapBlock: function(blockDom, map) {
      //console.log("processMapBlock");
      this.mapBlockList = document.createElement('ul');
      this.mapBlockList.className = 'jxLmanSet';
      this.mapBlockList.id = 'fusionLayerManager_'+map.getMapName();
      blockDom.appendChild(this.mapBlockList);
      map.layerPrefix = 'layer_';   //TODO make this unique for each block
      //this process all layers within an OL layer
      var processArray = map.aLayers;
    
      for (var i=0; i<processArray.length; ++i) {
        var blockItem = document.createElement('li');
        blockItem.className = 'jxLmanLayer';
        blockItem.id = map.layerPrefix+i;
        this.mapBlockList.appendChild(blockItem);
        this.createItemHtml(blockItem, processArray[i]);
        blockItem.layer = processArray[i];
      }

      var sortableOptions = {
                constrain: true,
                clone: false,
                revert: true,
                onComplete: OpenLayers.Function.bind(this.updateLayer, this, map)
            };
      var mySortables = new Sortables(this.mapBlockList.id, sortableOptions);
    },
   
  createItemHtml: function(parent, layer) {
    var infoIcon = document.createElement('img');
    infoIcon.src = this.infoIconSrc;
    OpenLayers.Event.observe(infoIcon, 'click', OpenLayers.Function.bind(this.showLayerInfo, this, layer));
    infoIcon.style.visibility = 'hidden';
    //re-do this as Jx template
    //parent.appendChild(infoIcon);
    
    var delIcon = document.createElement('img');
    delIcon.src = this.delIconSrc;
    OpenLayers.Event.observe(delIcon, 'click', OpenLayers.Function.bind(this.deleteLayer, this, layer));
    delIcon.style.visibility = 'hidden';
    parent.appendChild(delIcon);
    
    var visSelect = document.createElement('input');
    visSelect.type = 'checkbox';
    OpenLayers.Event.observe(visSelect, 'click', OpenLayers.Function.bind(this.visChanged, this, layer));
    parent.appendChild(visSelect);
    if (layer.visible) {
      visSelect.checked = true;
    } else {
      visSelect.checked = false;
    }
    
    var img = document.createElement('img');
    var scale = layer.oMap.getScale();
    var range = layer.getScaleRange(scale);
    if (range && range.styles.length>0) {
        var style = range.styles[0];//TODO: handle multiple styles?
        var iconX = 0;
        var iconY = 0;
        if (style && style.iconX >= 0 && style.iconY >= 0) {
            iconX = -1 * (style.iconX);
            iconY = -1 * (style.iconY);
        }
        img.src = Jx.aPixel.src;
        img.style.backgroundImage = 'url('+style.iconOpt.url+')';
        img.style.backgroundPosition = iconX + 'px ' + iconY + 'px';
        parent.appendChild(img);
    }
    
    var label = document.createElement('a');
    label.innerHTML = layer.legendLabel;
    OpenLayers.Event.observe(label, 'mouseover', OpenLayers.Function.bind(this.setGrabCursor, this));
    OpenLayers.Event.observe(label, 'mousedown', OpenLayers.Function.bind(this.setDragCursor, this));
    OpenLayers.Event.observe(label, 'mouseout', OpenLayers.Function.bind(this.setNormalCursor, this));
    parent.appendChild(label);
    
    OpenLayers.Event.observe(parent, 'mouseover', OpenLayers.Function.bind(this.setHandleVis, this, delIcon, infoIcon));
    OpenLayers.Event.observe(parent, 'mouseout', OpenLayers.Function.bind(this.setHandleHide, this, delIcon, infoIcon));
  },
  
  setHandleVis: function(delIcon, infoIcon) {
    delIcon.style.visibility = 'visible';
    infoIcon.style.visibility = 'visible';
  },
  
  setHandleHide: function(delIcon, infoIcon) {
    delIcon.style.visibility = 'hidden';
    infoIcon.style.visibility = 'hidden';
  },
  
  setGrabCursor: function(ev) {
    var targetLI = (new Event(ev)).target.parentNode;
    this.setCursor(this.cursorDrag, targetLI);
  },
  
  setDragCursor: function(ev) {
    var targetLI = (new Event(ev)).target.parentNode;
   this.setCursor(this.cursorDrag, targetLI);
  },
  
  setNormalCursor: function(ev) {
    var targetLI = (new Event(ev)).target.parentNode;
    this.setCursor('auto', targetLI);
  },
  
  setCursor: function(cursor, domObj) {
      this.cursor = cursor;
      if (cursor && cursor.length && typeof cursor == 'object') {
          for (var i = 0; i < cursor.length; i++) {
              domObj.style.cursor = cursor[i];
              if (domObj.style.cursor == cursor[i]) {
                  break;
              }
          }
      } else if (typeof cursor == 'string') {
          domObj.style.cursor = cursor;
      } else {
          domObj.style.cursor = 'auto';  
      }
  },
  
  updateLayer: function(map) {
   //console.log("updateLayer");
   //console.log("updateLayer");
    //reorder the layers in the client as well as the session
    var aLayerIndex = [];
    var aIds = [];
    var nLayers = this.mapBlockList.childNodes.length;
    for (var i=0; i<nLayers; ++i) {
      aIds[i] = this.mapBlockList.childNodes[i].id.split('_');
      var index = parseInt(aIds[i].pop());
      aLayerIndex.push(index);
      this.mapBlockList.childNodes[i].id = '';
    }
    
    //reset the ID's on the LI elements to be in order
    for (var i=0; i<this.mapBlockList.childNodes.length; ++i) {
      var node = this.mapBlockList.childNodes[i];
      aIds[i].push(i);
      node.id = aIds[i].join('_');
      node.childNodes[2].checked = node.layer.isVisible()
    }
    
    //check tos ee if the layer indexes have been modified
    var indexModified = false;
    if (aLayerIndex.length == map.aLayers.length) {
      for (var i=0; i<aLayerIndex.length; ++i) {
        if (aLayerIndex[i] != i) {
          indexModified = true;
          break;
        }
      }
    } else {
      indexModified = true;
    }

    if (indexModified) {
        map.reorderLayers(aLayerIndex);
    }
  },
   
  updateMapBlock: function(map) {
    //reorder the OL layers
  },
  
  deleteLayer: function(layer, ev) {
   // console.log("deleteLayer");
    var targetLI = (new Event(ev)).target.parentNode;
    $(targetLI).dispose();
    
    this.oMap.layerRoot.deleteLayer(layer.uniqueId);
    this.updateLayer(layer.oMap);
  },
  
  showLayerInfo: function(layer, ev) {
    var layerInfoUrl = layer.oMap.getLayerInfoUrl(layer.layerName);
    if (layerInfoUrl) {
      window.open(layerInfoUrl);
    }
  },
  
  visChanged: function(layer2, ev) {
    var target = (new Event(ev)).target;
    var layer = target.parentNode.layer;
    if (target.checked) {
      layer.show();
    } else {
      layer.hide();
    }
  },
  updateSessionMapFile: function(){
   // console.log("updateSessionMapFile");
    // get map
    var map = this.getMap();
    var aMaps = map.getAllMaps();
    var currentMap = aMaps[0];
    var sessionId = aMaps[0].getSessionID();

    // get all layers
    var oLayers = currentMap.aLayers;
    var aLayerNames = [];
    var visibleLayers = [];
    for(var i=0;i<oLayers.length;i++){
        aLayerNames.push(oLayers[i].layerName);
        if(oLayers[i].visible == true){
            visibleLayers.push(oLayers[i].layerName);
        }
    }

    // prepare ajax req
    var params =  '&session='+sessionId+'&mapname='+ this.getMap().getMapName()+'&visLayers='+visibleLayers+'&layers='+aLayerNames;
    var options = {parameters: params};

    // fire the request no need to return
    var m = this.getMap().aMaps[0];
    var url = 'layers/' + m.arch + '/' + Fusion.getScriptLanguage() + "/updateSessionMapFile." + Fusion.getScriptLanguage()
    Fusion.ajaxRequest(  url, options);
  }

});
