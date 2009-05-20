/**
 * Fusion.Widget.Redline
 *
 * $Id: Redline.js 1736 2009-01-14 15:42:24Z madair $
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

/* ******************************************************************** 
* Class: Fusion.Widget.Redline
* 
* Allows the user to create a temporary OpenLayers Vector layer and 
* draw POINT, LINE and POLYGON features on that layer.  
* 
**********************************************************************/


// This event could be emitted by the Redline widget
Fusion.Event.REDLINE_FEATURE_ADDED = Fusion.Event.lastEventId++;

Fusion.Widget.Redline = OpenLayers.Class(Fusion.Widget, {
    isExclusive: true,
    uiClass: Jx.Button,

    // Fusion map widget
    mapWidget: null,

    // a reference to a redline taskPane
    taskPane: null,

    // array of OL vector layer
    vectorLayers: null,

    // the drawing controls
    drawControls: null,

    // The default feature style: to be changed
    defaultFeatureStyle: new OpenLayers.Style({
        pointRadius: 4,
        graphicName: "square",
        fillColor: "#55ff4e",
        fillOpacity: 0.4,
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeColor: "#666666"
    }),

    // the default feature styleMap
    styleMap: null,

    activeControl: null, 
    activeLayer: null,

    // the hidden html form for the save action
    saveForm: null,
    uploadForm: null,

    initializeWidget: function(widgetTag) {
        var json = widgetTag.extension;
        this.mapWidget = Fusion.getWidgetById('Map');

        // register Redline specific events
        this.registerEventID(Fusion.Event.REDLINE_FEATURE_ADDED);

        this.sTarget = json.Target ? json.Target[0] : "";
        if (this.sTarget)
            this.taskPane = new Fusion.Widget.Redline.DefaultTaskPane(this, widgetTag.location);
    
        // Check in the user has defined his default feature style
        var defaultFeatureStyle;
        var jsonFeatureStyle = json.FeatureStyle ? json.FeatureStyle[0] : null;
        if (jsonFeatureStyle && (typeof(jsonFeatureStyle) == "object"))
        {
            defaultFeatureStyle = new OpenLayers.Style();
            for(var styleProperty in jsonFeatureStyle) {
                eval("defaultFeatureStyle.defaultStyle."+styleProperty+" = \""+jsonFeatureStyle[styleProperty][0]+"\";");
            }
        } else {
            defaultFeatureStyle =  this.defaultFeatureStyle
        }
 
        this.styleMap = new OpenLayers.StyleMap(defaultFeatureStyle);
        
        // create only one default layer
        this.vectorLayers = new Array();
        this.vectorLayers[0] = new OpenLayers.Layer.Vector("Digitizing Layer 0", {styleMap: this.styleMap});
        this.mapWidget.oMapOL.addLayers([this.vectorLayers[0]]);

        this.createDrawControls();

        // Check if the default control is specified
        this.defaultControl = 'point';
        if (json.DefaultControl) { 
            var control = json.DefaultControl[0].toLowerCase();
            if (this.drawControls[control])
                this.defaultControl = control;
        }

        this.createSaveForm();
        this.createUploadForm();
    },

    createDrawControls: function() {
        this.drawControls = {
            point: new OpenLayers.Control.DrawFeature(this.vectorLayers[0],
                                                      OpenLayers.Handler.Point, {
                                                          handlerOptions: {
                                                              layerOptions: {
                                                                  styleMap: this.styleMap
                                                              }
                                                          }
                                                      }),
            line: new OpenLayers.Control.DrawFeature(this.vectorLayers[0],
                                                     OpenLayers.Handler.Path, {
                                                         handlerOptions: {
                                                             freehandToggle: null, 
                                                             freehand: false, 
                                                             style: "default", // this forces default render intent
                                                             layerOptions: {
                                                                 styleMap: this.styleMap
                                                             }
                                                         }
                                                     }),
            rectangle: new OpenLayers.Control.DrawFeature(this.vectorLayers[0],
                                                          OpenLayers.Handler.RegularPolygon, {
                                                              handlerOptions: {
                                                                  sides: 4, 
                                                                  irregular: true,
                                                                  style: "default", // this forces default render intent
                                                                  layerOptions: {
                                                                      styleMap: this.styleMap
                                                                  }
                                                              }
                                                          }),
            polygon: new OpenLayers.Control.DrawFeature(this.vectorLayers[0],
                                                        OpenLayers.Handler.Polygon, {
                                                            handlerOptions: {
                                                                freehand: false, 
                                                                style: "default", // this forces default render intent
                                                                layerOptions: {
                                                                    styleMap: this.styleMap
                                                                }
                                                            }
                                                        })
        };
        
        for(var key in this.drawControls) {
            this.drawControls[key].events.register('featureadded', this, this.featureAdded);
            this.mapWidget.oMapOL.addControl(this.drawControls[key]);
        }

    },    

    createSaveForm: function() {
        /* Create a hidden form for the Save action */
        var sl = Fusion.getScriptLanguage();
        var scriptURL = Fusion.getFusionURL() + 'layers/Generic/' + sl + '/save.' + sl;
        var div = document.createElement("div");
        var type = document.createElement("input");
        var content = document.createElement("input");
        var name = document.createElement("input");
        var submit = document.createElement("input");

        div.style.display = "none";
        this.saveForm = document.createElement("form");
        submit.type="submit";
        submit.name="submit_element";
        submit.value="submit";
        this.saveForm.method = "POST";
        this.saveForm.action = scriptURL;
        type.type = "text";
        type.name = "type";
        type.value = 'text/xml';
        content.type = "text";
        content.name = "content";
        name.type = "text";
        name.name = "name";
        this.saveForm.appendChild(type);
        this.saveForm.appendChild(content);
        this.saveForm.appendChild(name);
        this.saveForm.appendChild(submit);
        div.appendChild(this.saveForm);
        document.body.appendChild(div);
    },

    createUploadForm: function() {
        /* Create a hidden form for the Upload action ,
           this form will be placed the the TaskPane manager */
        var sl = Fusion.getScriptLanguage();
        var scriptURL = Fusion.getFusionURL() + 'widgets/Redline/Redline.php';
        var file = document.createElement("input");
        var submit = document.createElement("input");
        var action = document.createElement("input");

        this.uploadForm = document.createElement("form");
        submit.type="submit";
        submit.name="submit_element";
        submit.value="Upload";
        action.type = "hidden";
        action.name = "action";
        action.value = "upload";
        this.uploadForm.enctype = "multipart/form-data";
        this.uploadForm.action = scriptURL;
        this.uploadForm.method = "POST";
        file.name="uploadedfile";
        file.type="file";
        this.uploadForm.appendChild(file);
        this.uploadForm.appendChild(action);
        this.uploadForm.appendChild(document.createElement("br"));
        this.uploadForm.appendChild(submit);
    },

    // activate the redline widget
    activate: function() {
        if (this.taskPane) {
            this.taskPane.loadDisplayPanel();
        }
        this.activateLayer(0);
        this.activateControl(this.defaultControl,0);
    },

    // desactivate the redline widget
    deactivate: function() {
        this.activeControl.deactivate();
        this.activeControl = null;
    },
   
    featureAdded: function(evt) {
        this.triggerEvent(Fusion.Event.REDLINE_FEATURE_ADDED, evt.feature);
    },

    // change active layer
    activateLayer: function(layerIndex) {
        this.activeLayer = this.vectorLayers[layerIndex];
        for(var key in this.drawControls) {
            this.drawControls[key].layer = this.vectorLayers[layerIndex];
        }
    },

    // change active control
    activateControl: function(type) {
        if (this.activeControl)
            this.activeControl.deactivate();

        var control = this.drawControls[type];
        this.activeControl = control;
        control.activate();
    },

    exportToGML: function() {
        var gmlParser = new OpenLayers.Format.GML();
        var fileContent = gmlParser.write(this.activeLayer.features);
        this.saveForm.elements[0].value = "text/xml";
        this.saveForm.elements[1].value = escape(fileContent);
        this.saveForm.elements[2].value = this.activeLayer.name + '.gml'; 
        this.saveForm.submit();
    },

    newLayer: function(layerName) {
        var i = this.vectorLayers.length;
        this.vectorLayers[i] = new OpenLayers.Layer.Vector(layerName, {styleMap: this.styleMap});
        this.mapWidget.oMapOL.addLayer(this.vectorLayers[i]);
    },
    
    newLayerFromFile: function(fileName) {
        var i = this.vectorLayers.length;
        this.vectorLayers[i] = new OpenLayers.Layer.Vector("Digitizing layer "+this.vectorLayers.length, {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: Fusion.getFusionURL() +"widgets/Redline/Redline.php?"+"file="+fileName,
                format: new OpenLayers.Format.GML()
            }),
            styleMap: this.styleMap
        });
        this.mapWidget.oMapOL.addLayer(this.vectorLayers[i]);
    },

    removeLayer: function(layerIndex) {
        this.vectorLayers[layerIndex].destroyFeatures();
        this.vectorLayers[layerIndex].destroy();
        this.vectorLayers.splice(layerIndex,1);
        // we always keep at least one vector layer
        if (this.vectorLayers.length == 0) {
            this.vectorLayers[0] = new OpenLayers.Layer.Vector("Digitizing Layer 0", {styleMap: this.styleMap});
            this.mapWidget.oMapOL.addLayers([this.vectorLayers[0]]);
        }
        this.activateLayer(0);
    }
});

  
Fusion.Widget.Redline.DefaultTaskPane = OpenLayers.Class(
{
    // a reference to the redline widget
    widget: null,

    // the the task pane windows
    taskPaneWin: null,

    // the panel url
    panelUrl:  'widgets/Redline/Redline.php',
    // the panel CSS
    panelCss: 'Redline/Redline.css',

    initialize: function(widget,widgetLocation) {
        this.widget = widget;
        this.widget.registerForEvent(Fusion.Event.REDLINE_FEATURE_ADDED, OpenLayers.Function.bind(this.featureAdded, this));
        Fusion.addWidgetStyleSheet(widgetLocation + this.panelCss);
    },

    loadDisplayPanel: function() {
        var url = Fusion.getFusionURL() + this.panelUrl;
        
        var taskPaneTarget = Fusion.getWidgetById(this.widget.sTarget);
        var outputWin = window;
        
        if ( taskPaneTarget ) {
            taskPaneTarget.setContent(url);
            outputWin = taskPaneTarget.iframe.contentWindow;
        } else {
            outputWin = window.open(url, this.widget.sTarget, this.widget.sWinFeatures);
        }
        //outputWin.parent = window;
        this.taskPaneWin = outputWin;
        var initFunction = OpenLayers.Function.bind(this.initPanel, this);
        setTimeout(initFunction,300);
    },

    // when the panel is loaded....
    initPanel: function() {
        if (!this.taskPaneWin.document.getElementById("panelIsLoaded")) {
            var initFunction = OpenLayers.Function.bind(this.initPanel, this);
            setTimeout(initFunction,300);
            return;
        }
        
        // select the default control
        var radioName = this.widget.defaultControl.charAt(0).toUpperCase() + this.widget.defaultControl.substr(1);
        this.taskPaneWin.document.getElementById("RedlineWidget"+radioName+"Radio").checked = true;
        // wrapper around the original upload button of the form
        var uploadButton = document.createElement("button");
        uploadButton.id = "RedlineWidgetUploadButton";
        uploadButton.innerHTML = "Upload";
        this.widget.uploadForm.elements[2].style.display = "none";
        this.taskPaneWin.document.getElementById("RedlineWidgetUploadTd").appendChild(this.widget.uploadForm);
        this.taskPaneWin.document.getElementById("RedlineWidgetUploadTd").appendChild(uploadButton);
        // do we have an uploaded file ?
        if (this.taskPaneWin.document.getElementById("uploadedFileName")) {
            this.widget.activateControl(this.widget.defaultControl,0); //hack to reset the right control/radio
            this.widget.newLayerFromFile(this.taskPaneWin.document.getElementById("uploadedFileName").getAttribute("value"));
        }
        this.bindEvents();
        this.updateLayerList();
        this.updateFeatureList();
    },
    
    bindEvents: function() {
        var doc = this.taskPaneWin.document;
        
        // layers
        doc.getElementById("RedlineWidgetLayerList").onchange = OpenLayers.Function.bind(this.selectLayer, this); 
        doc.getElementById("RedlineWidgetNewLayerButton").onclick = OpenLayers.Function.bind(this.newLayer, this);
        doc.getElementById("RedlineWidgetRenameLayerButton").onclick = OpenLayers.Function.bind(this.renameLayer, this);
        doc.getElementById("RedlineWidgetRemoveLayerButton").onclick = OpenLayers.Function.bind(this.removeLayer, this);
        doc.getElementById("RedlineWidgetSaveButton").onclick = OpenLayers.Function.bind(this.saveLayer, this);
        doc.getElementById("RedlineWidgetUploadButton").onclick = OpenLayers.Function.bind(this.uploadFile, this);
        // Controls
        doc.getElementById("RedlineWidgetPointRadio").onclick = OpenLayers.Function.bind(this.widget.activateControl, this.widget, 'point');
        doc.getElementById("RedlineWidgetLineRadio").onclick = OpenLayers.Function.bind(this.widget.activateControl, this.widget, 'line');
        doc.getElementById("RedlineWidgetRectangleRadio").onclick = OpenLayers.Function.bind(this.widget.activateControl, this.widget, 'rectangle');
        doc.getElementById("RedlineWidgetPolygonRadio").onclick = OpenLayers.Function.bind(this.widget.activateControl, this.widget, 'polygon');
        // features
        doc.getElementById("RedlineWidgetRemoveFeatureButton").onclick = OpenLayers.Function.bind(this.removeFeature, this);
        doc.getElementById("RedlineWidgetRenameFeatureButton").onclick = OpenLayers.Function.bind(this.renameFeature, this);
    },

    newLayer: function() {
        var name = prompt("Layer name:", "Digitizing layer "+this.widget.vectorLayers.length);
        if (name!=null && name!="") {
            this.widget.newLayer(name);
            this.updateLayerList();
        }
    },

    removeLayer: function() {
        var i = this.taskPaneWin.document.getElementById("RedlineWidgetLayerList").selectedIndex;
        this.widget.removeLayer(i);
        this.updateLayerList();
        this.updateFeatureList();
    },

    renameLayer: function() {
        var name = prompt("Layer name:", "");
        if (name!=null && name!="") {
            var i = this.taskPaneWin.document.getElementById("RedlineWidgetLayerList").selectedIndex;
            this.widget.vectorLayers[i].name = name;
            this.updateLayerList();
        }
    },

    selectLayer: function() {
        var i = this.taskPaneWin.document.getElementById("RedlineWidgetLayerList").selectedIndex;
        this.widget.activateLayer(i);
        this.updateFeatureList();
    },

    saveLayer: function() {
        this.widget.exportToGML();
    },

    uploadFile: function() {
        this.widget.uploadForm.submit();
        var initFunction = OpenLayers.Function.bind(this.initPanel, this);
        setTimeout(initFunction,300);
    },

    updateLayerList: function() {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetLayerList');
        var selectedIndex = select.selectedIndex;
        select.length = 0;
        for ( var i = 0; i < this.widget.vectorLayers.length;i++)
        {
            var opt = document.createElement('option');
            opt.text = this.widget.vectorLayers[i].name;
            if (i == selectedIndex)
                opt.selected = true;
            select.add(opt,null);
        }
    },

    featureAdded: function(eventID, feature) {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetFeatureList');
        var opt = document.createElement('option');
        opt.text = feature.id;
        select.add(opt,null);
    },

    removeFeature: function() {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetFeatureList');
        var i = select.selectedIndex;
        if (i != -1) {
            this.widget.activeLayer.destroyFeatures([this.widget.activeLayer.features[i]]);
            select.remove(i);
        }
    },

    renameFeature: function() {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetFeatureList');
        var i = select.selectedIndex;
        if (i != -1) {
            var name = prompt("Feature name:", "");
            if (name!=null && name!="") {
                this.widget.activeLayer.features[i].id = name;
                select.options[i].text = name;
            }
        }
    },

    updateFeatureList: function() {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetFeatureList');
        var selectedIndex = select.selectedIndex;
        select.length = 0;
        for ( var i = 0; i < this.widget.activeLayer.features.length; i++)
        {
            var opt = document.createElement('option');
            opt.text = this.widget.activeLayer.features[i].id;
            select.add(opt,null);
        }
    },

    clearFeatureList: function() {
        var select = this.taskPaneWin.document.getElementById('RedlineWidgetFeatureList');
        for (var i = (select.options.length-1); i>=0; i--) { 
	    select.options[i] = null; 
	} 
	select.selectedIndex = -1; 
    }
});
