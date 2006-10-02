/********************************************************************** * 
 * @project Genus Map Window
 * @revision $Id$
 * @purpose Feature Info widget
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license TBD
 * ********************************************************************
 * ********************************************************************
 *
 * perform a selection and display info about features to the user
 * 
 * **********************************************************************/

require('widgets/GxButtonBase.js');
require('widgets/GxClickTool.js');

var FeatureInfo = Class.create();
FeatureInfo.prototype = 
{       
    nTolerance : 3, //default pixel tolernace for a point click
    initialize : function(oCommand)
    {
        //console.log('Select.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['FeatureInfo', true]);
        this.setMap(oCommand.getMap());
        Object.inheritFrom(this, GxButtonBase.prototype, [oCommand]);
        Object.inheritFrom(this, GxClickTool.prototype, [this.getMap()]);
        this.asCursor = ['auto'];

        if (parseInt(oCommand.oxmlNode.getNodeText('Tolerance')) > 0)
        {
            nTolerance = parseInt(oCommand.oxmlNode.getNodeText('Tolerance'));
        }
        
    },
    
    /**
     * called when the button is clicked by the MGButtonBase widget
     */
    activateTool : function()
    {
        this.getMap().activateWidget(this);
        //this.activate();
    },

    /**
     * activate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     */
    activate : function()
    {
        this.activateClickTool();
        this.getMap().setCursor(this.asCursor);
        /*icon button*/
        this._oButton.activateTool();
    },

    /**
     * deactivate the widget (listen to mouse events and change cursor)
     * This function should be defined for all functions that register
     * as a widget in the map
     **/
    deactivate : function()
    {
         this.deactivateClickTool();
         this.getMap().setCursor('auto');
         /*icon button*/
         this._oButton.deactivateTool();
    },

    /**
     *  set the extants of the map based on the pixel coordinates
     * passed
     * 
     * @param pX - the x position in pixels of the mouse click
     * @param pY - the y position in pixels of the mouse click
     **/
    execute : function(pX, pY) {
        var gPos = this.getMap().pixToGeo(pX,pY);
        
        var dfGeoTolerance = this.getMap().pixToGeoMeasure(this.nTolerance);
        var minX = gPos.x-dfGeoTolerance/2;
        var minY = gPos.y-dfGeoTolerance/2;
        var maxX = gPos.x+dfGeoTolerance/2;
        var maxY = gPos.y+dfGeoTolerance/2;
        
        this.getMap()._addWorker();
        var oBroker = this.getMap()._oConfigObj.oApp.getBroker();

        var sGeometry = '&geometry=POLYGON(('+ minX + ' ' +  minY + ', ' +  maxX + ' ' +  minY + ', ' + maxX + ' ' +  maxY + ', ' + minX + ' ' +  maxY + ', ' + minX + ' ' +  minY + '))';

        var c = document.__chameleon__;
        var s = '/server/' + c.getScriptLanguage() + '/MGFeatureInfo.' + c.getScriptLanguage();
        
        var params = {};
        params.parameters = 'session='+c.getSessionID()+'&mapname='+
                            this.getMap().getMapName()+sGeometry;
        params.onComplete = this.processQueryResults.bind(this);
        c.ajaxRequest(s, params);
    },
    
    processQueryResults : function(r) {
        var d = document.createElement('div');
        d.id = 'FeatureInfoResults';
        var t = document.createElement('table');
        d.appendChild(t);
        var tbody1 = document.createElement('tbody');
        t.appendChild(tbody1);
        
        this.getMap()._removeWorker();
        if (r.responseXML) {
            var oNode = new DomNode(r.responseXML);
            var layerNode = oNode.findFirstNode('Layer');
            while(layerNode) {
                var layer = new MGSelectionObjectLayer(layerNode);
                
                var tr = document.createElement('tr');
                tbody1.appendChild(tr);
                
                var th = document.createElement('th');
                th.innerHTML = 'Layer:';
                tr.appendChild(th);
                
                var td = document.createElement('td');
                td.innerHTML = layer.getName();
                tr.appendChild(td);
                
                tr = document.createElement('tr');
                tbody1.appendChild(tr);
                
                td = document.createElement('td');
                td.colSpan = 2;
                tr.appendChild(td);
                
                var props = layer.getPropertyNames();
                var nValues = layer.getNumElements();
                for (var i=0; i<nValues; i++) {
                    
                    var t = document.createElement('table');
                    td.appendChild(t);
                    
                    var tbody = document.createElement('tbody');
                    t.appendChild(tbody);

                    for (var j=0; j<props.length; j++) {

                        var tr = document.createElement('tr');
                        tbody.appendChild(tr);
                        
                        var th = document.createElement('th');
                        th.innerHTML = props[j];
                        tr.appendChild(th);

                        var td = document.createElement('td');
                        td.innerHTML = layer.getElementValue(i,j);
                        tr.appendChild(td);
                    }
                }
                layerNode = oNode.findNextNode('Layer');
            }
        }
        if (tbody1.childNodes.length > 0) {
            var size = Position.getPageDimensions();
            var o = {
                title: 'Feature Info',
                id: 'featureInfoResults',
                contentID : d,
                width: 400,
                height: 400,
                top: (size.height-400)/2,
                left: (size.width-400)/2
            };
            dialog= new JxDialog( o );
            dialog.open();
        }
    }
};
