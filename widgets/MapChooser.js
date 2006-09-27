/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose MapChooser widget
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license MIT
 * ********************************************************************
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ********************************************************************
 *
 * MapChooser 
 *
 * To put a MapChooser control in your application, you first need to add a
 * widget to your WebLayout as follows:
 *
 * <Command xsi:type="MapChooserCommandType">
 *   <Name>MyMapChooser</Name>
 *   <Label>Legend</Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>MapChooser</Action>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyMapChooser"></div>
 *
 * The MapChooser will appear inside the element you provide.
 * **********************************************************************/

var MapChooser = Class.create();
MapChooser.prototype = 
{
    currentNode: null,
    _oDomObj: null,
    oRoot: null,
    initialize : function(oCommand)
    {
        var c = document.__chameleon__;
        
        //console.log('MapChooser.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['MapChooser', true]);
        this.setMap(oCommand.getMap());
        
        this._oDomObj = $(oCommand.getName());
        this.defIcon = c.getChameleonURL() + 'images/tree_map.png';
        
        this.oTree = new JxTree(this._oDomObj);
        
        var opt = {};
        opt.label = 'Maps';
        opt.data = null;
        opt.isOpen = true;
        this.oRoot = new JxTreeFolder(opt);
        this.oTree.append(this.oRoot);
        var groupNode = oCommand.oxmlNode.findFirstNode('Group');
        while (groupNode) {
            this.processGroupNode(groupNode, this.oRoot);
            groupNode = oCommand.oxmlNode.findNextNode('Group');
        }
    },
    
    processGroupNode: function(oGroupNode, oParent) {
        opt = {};
        opt.label = oGroupNode.getNodeText('Name');
        var folder = new JxTreeFolder(opt)
        oParent.append(folder);
    
        var groupNode = oGroupNode.findFirstNode('Group');
        while(groupNode) {
            this.processGroupNode(groupNode, folder);
            groupNode = oGroupNode.findNextNode('Group');
        }
        
        var mapNode = oGroupNode.findFirstNode('Map');
        while(mapNode) {
            opt = {};
            opt.label = mapNode.getNodeText('Name');
            opt.data = mapNode.getNodeText('ResourceId');
            opt.imgIcon = this.defIcon;
            var item = new JxTreeItem(opt);
            folder.append(item);
            mapNode = oGroupNode.findNextNode('Map');
        }
        
    },
    
    
    
    /**
     * remove the dom objects representing the legend layers and groups
     */
    clear: function() {
        while (this.oRoot.nodes.length > 0) {
            this.oRoot.remove(this.oRoot.nodes[0]);
        }
        this.mapGroups = [];
        this.maps = [];
    },
    selectionChanged: function(o) {
        if (this.currentNode) {
            Element.removeClassName(this.currentNode.domObj.childNodes[3], 'jxTreeSelectedNode')
        }
        this.currentNode = o;
        Element.addClassName(this.currentNode.domObj.childNodes[3], 'jxTreeSelectedNode')
        
        
    }
};