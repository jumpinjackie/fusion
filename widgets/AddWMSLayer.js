/**
 * Fusion.Widget.AddWMSLayer
 *
 * $Id: Print.js 1906 2009-09-23 22:07:49Z chrisclaydon $
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

 /********************************************************************
 * Class: Fusion.Widget.AddWMSLayer
 *
 * Opens a dialog box with a list of layers from a WMS server that can be added
 * to the map.
 *
 * **********************************************************************/

Fusion.Widget.AddWMSLayer = OpenLayers.Class(Fusion.Widget, {
    
    initializeWidget: function(widgetTag) {
        var json = widgetTag.extension;
        
        this.serviceURL = json.ServiceURL ? json.ServiceURL[0] : '';
        
        this.dialogContentURL = Fusion.getFusionURL() + widgetTag.location + 'AddWMSLayer/AddWMSLayer.html';
        this.addWMSLayerURL = widgetTag.location + 'AddWMSLayer/AddWMSLayer.php';
        Fusion.addWidgetStyleSheet(widgetTag.location + 'AddWMSLayer/AddWMSLayer.css');
        var onload = OpenLayers.Function.bind(this.contentLoaded, this);
        this.domObj.set('load', {onComplete: onload});
        this.domObj.load(this.dialogContentURL);
    },
    
    contentLoaded: function() {
        this.outputDiv = this.domObj.getElementById('AddWMSLayersContent');
        this.urlInput = this.domObj.getElementById('wmsServerName');
        if (this.serviceURL != '') {
          this.urlInput.value = this.serviceURL;
        }
        var listButton = new Jx.Button({
            label: 'List Layers',
            onClick: OpenLayers.Function.bind(this.initializeWMS, this)
        }).addTo(this.domObj.getElementById('listLayersButton'));
    },
    
    initializeWMS: function() {
        this.listLayersWait();
        //prep the server URL to remove WMS params
        var serverURL = this.urlInput.value;
        if (serverURL.length >0) {
          var newParams = [];
          var urlParams = serverURL.split('?')
          if (urlParams.length > 1) {
            var params = urlParams[1].split('&');
            for (var j=0; j<params.length; ++j) {
              if (params[j].toLowerCase().indexOf('request')!=-1) continue;
              if (params[j].toLowerCase().indexOf('version')!=-1) continue;
              newParams.push(params[j]);
            }
            urlParams[1] = newParams.join('&');
          }
          serverURL = urlParams.join('?');
          
          var maps = this.oMap.getAllMaps(); 
          var map = maps[0];
          
           var opts = {
              parameters: {
                  session: map.getSessionID(),
                  mapname: map._sMapname,
                  action: 'listLayersWMS',
                  server: serverURL
              }, 
              onComplete: OpenLayers.Function.bind(this.wmsListLayers, this)
          };
          Fusion.ajaxRequest(this.addWMSLayerURL, opts);
        }
    },
    
/* 
function catalogListLayers - CB from catalogManagerInitialize() with object create the html
                             required to add the layers to the map. clicking on image spawns
                             addCatalogLayer which inturn add's the clicked layer to the map.
*/    
    wmsListLayers: function(r) {
      if (r.responseText) {
        var gCatalogLayersObj;
        try {
          eval('gCatalogLayersObj='+r.responseText);
        } catch (e) {
          gCatalogLayersObj = {'error': e.stack};
        }
        if (gCatalogLayersObj) {
        
          this.outputDiv.innerHTML = '';
            
          if (gCatalogLayersObj.error) {
            this.outputDiv.innerHTML = gCatalogLayersObj.error + '<br>' + gCatalogLayersObj.message;
            return;
          }
            
          var ul = document.createElement('ul');
          ul.id = 'catalogListLayerUL';
          this.outputDiv.appendChild(ul);
      
          for(var i=0;i<gCatalogLayersObj.length;i++){
              var szOwsTitle = gCatalogLayersObj[i].owstitle;
              if (szOwsTitle.length < 1) {
                szOwsTitle = gCatalogLayersObj[i].name;
              }
              var li = document.createElement('li');
              ul.appendChild(li);
              
              var a = document.createElement('a');
              a.href = "javascript:void(0)";
              a.layertype = gCatalogLayersObj[i].layertype;
              a.layername =  gCatalogLayersObj[i].name;
              a.owstitle =  gCatalogLayersObj[i].owstitle;
              a.group =  gCatalogLayersObj[i].group;
              a.srs = gCatalogLayersObj[i].srs;
              a.imageFormat = gCatalogLayersObj[i].imageformat;
              a.servername = gCatalogLayersObj[i].servername;
              a.wmsservicetitle = gCatalogLayersObj[i].wmsservicetitle;
              a.queryable = gCatalogLayersObj[i].queryable;
              a.metadataurl = gCatalogLayersObj[i].metadataurl;
              a.minx = gCatalogLayersObj[i].minx;
              a.miny = gCatalogLayersObj[i].miny;
              a.maxx = gCatalogLayersObj[i].maxx;
              a.maxy = gCatalogLayersObj[i].maxy;
              
              a.onclick = OpenLayers.Function.bind(this.addWMSLayer, this, a);
              
              li.appendChild(a);
              
              a.innerHTML = szOwsTitle;
              li.appendChild(a);
          }
        }
      }
    },
    
    listLayersWait: function() {
        this.outputDiv.innerHTML = 'Request in progress...';
    },
    
    /* 
    function addWMSLayer - adds the clicked layer from the interface created by catalogListLayers
                               then loads browseCatalog.php to add the clicked layer to the current 
                               session map file. calls addCatalogLayerCB for a return responce.
    
    */    
    addWMSLayer: function(cb){
        var maps = this.oMap.getAllMaps(); 
        var map = maps[0];
        
        //prep the servername to remove existing WMS params
        var params = {
            session: map.getSessionID(),
            mapname: map._sMapname,
            action: 'addLayer',
            layertype: cb.layertype,
            layername: cb.layername,
            group: cb.group,
            owstitle: cb.owstitle,
            srs: map.oLayerOL.projection.projCode,
            imageFormat: cb.imageFormat,
            servername: cb.servername,
            wmsservicetitle: cb.wmsservicetitle,
            queryable: cb.queryable,
            metadataurl: cb.metadataurl ? cb.metadataurl : ''
        }
        
        // switch image to a different src.
        //cb.src = 'images/icons/legend-layer.png';
        var opts = {parameters: params, onComplete: OpenLayers.Function.bind(this.addWMSLayerCB, this)};
        Fusion.ajaxRequest(this.addWMSLayerURL, opts);
    },
    
    /* 
    function addWMSLayerCB - CB func from addWMSLayer. The Layer is now added to mapfile, 
                                 if o.addedLayer = true else something when wrong.
    */    
    addWMSLayerCB: function(r) {
        var o = '';
        eval('o='+r.responseText);    

        if(o.addedLayer == true){
          var map = this.oMap; 
          var maps = map.getAllMaps();
          map.triggerEvent(Fusion.Event.WMS_LAYER_ADDED, new Array(o));
          maps[0].reloadMap();
        } else {
           // d.log('addCatalogLayerCB:could not add layer');
        }
    }
    
});
