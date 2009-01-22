/**
 * Fusion.Widget.LinkToView
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

 /********************************************************************
 * Class: Fusion.Widget.LinkToView
 *
 * A widget that displays a link to the currently displayedd map view.
 * **********************************************************************/


Fusion.Widget.LinkToView = OpenLayers.Class(Fusion.Widget,  {
    useDialog: true,
    
    initialize: function(widgetTag) {
        //console.log('LinkToView.initialize');

        Fusion.Widget.prototype.initialize.apply(this, [widgetTag, false]);
        
        var json = widgetTag.extension;
        this.baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?';
        this.dialogContent = Fusion.getFusionURL() + 'widgets/LinkToView/LinkToView.html';

        //remove any existing extent param
        var queryParams = Fusion.parseQueryString();
        var join = '';
        for (var param in queryParams) {
          if (typeof queryParams[param] == 'function') {
              continue;
          }
          if (param == 'extent' ||
              param == 'filter' ||
              param == 'spatialfilter' ||
              param == 'variant' ||
              param == 'theme' ||
              param == 'selectlayer' ||
              param == 'showlayers' ||
              param == 'hidelayers' ||
              param == 'showgroups' ||
              param == 'hidegroups' ) {
              continue;
          }
          this.baseUrl += join + param + '=' + queryParams[param];
          join = '&';
        }

        this.anchorLabel = json.Label ? json.Label[0] : (this.domObj.innerHTML ? this.domObj.innerHTML : 'Link to View');

        this.anchor = document.createElement('a');
        this.anchor.className = 'anchorLinkToView';
        this.anchor.innerHTML = this.anchorLabel;
        this.anchor.title = json.Tooltip ? json.Tooltip[0] : 'Right-click to copy or bookmark link to current view';
        
        this.domObj.innerHTML = '';
        this.domObj.appendChild(this.anchor);
        
        if (this.useDialog) {
          this.createDialog();
          this.anchor.href = '#';
          this.anchor.onclick = OpenLayers.Function.bind(this.dialog.open, this.dialog);
        } else {
          this.anchor.href = this.baseUrl;
          this.getMap().oMapOL.events.register("addlayer", this, this.setListener);
        }

        this.enable();                   
    },
    
    createDialog: function() {
        var o = {
            id: 'linkDialog',
            title: 'Link to the map view',
            contentURL: this.dialogContent,
            width: 360,
            height: 100,
            right: 0,
            bottom: 20,
            onOpen: this.onOpen.bind(this)
        };
        this.dialog = new Jx.Dialog( o );
        this.dialog.domObj.style.lineHeight = '20px';
    },
    
    onOpen: function() {
      var linkField = document.getElementById('linkField');
      var mapLink = this.getLink();
      linkField.value = mapLink;
      var linkToMap = document.getElementById('linkToMap');
      linkToMap.href = mapLink;
    },
    
    setListener: function(evt) {
        var layer = evt.layer;
        //register on the OL loadend event to update the link because this event
        //is fired whenever the layers are redrawn
        layer.events.register("loadend", this, this.updateLink);
    },
    
    getLink: function() {
        var join = (this.baseUrl.indexOf('?')==this.baseUrl.length-1)?'':'&';
        var queryStr = this.getMap().getLinkParams();
        return this.baseUrl + join + queryStr;
    },
    
    updateLink: function() {
        this.anchor.href = this.getLink();
    }
});
