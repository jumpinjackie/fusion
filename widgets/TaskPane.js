/********************************************************************** *
 * @project Fusion
 * @revision $Id: Legend.js 710 2007-07-30 13:38:36Z pspencer $
 * @purpose TaskPane widget
 * @author pspencer@dmsolutions.ca
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
 * TaskPane and layer control
 *
 * To put a TaskPane control in your application, you first need to add a
 * widget to your WebLayout as follows:
 *
 * <Command xsi:type="LegendCommandType">
 *   <Name>MyLegend</Name>
 *   <Label>Legend</Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>Legend</Action>
 *   <ShowRootFolder>false</ShowRootFolder>
 *   <LayerThemeIcon>images/tree_map.png</LayerThemeIcon>
 *   <DisabledLayerIcon>images/tree_layer.png</DisabledLayerIcon>
 *   <RootFolderIcon>images/tree_map.png</RootFolderIcon>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory)
 *
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="MyLegend"></div>
 *
 * The legend will appear inside the element you provide.
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
 * The url to an image to use for layers that are currently themed.
 *
 * DisabledLayerIcon: (string, optional)
 *
 * The url to an image to use for layers that are out of scale.
 *
 * **********************************************************************/
//Fusion.require('jx/tree/jxtree.js');

Fusion.Widget.TaskPane = Class.create();
Fusion.Widget.TaskPane.prototype =
{
    aExecutedTasks: null,   //array of URLs for tasks execcuted in the TaskPane
    nCurrentTask: -1,
    nTasks: 0,
    homeAction: null,
    prevAction: null,
    nextAction: null,
    
    initialize : function(oCommand)
    {
        //console.log('TaskPane.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['TaskPane', true, oCommand]);
        
        this.aExecutedTasks = [];
        this.defHomeIcon = 'images/icon_home.gif';
        this.defPrevTaskIcon = 'images/icon_back.gif';
        this.defNextTaskIcon = 'images/icon_forward.gif';
        this.defTaskListIcon = 'images/icon_tasks.gif';
       
       
        this._oDomObj = $(oCommand.getName());
       
        var json = oCommand.jsonNode;
       
        var divName = 'TaskNav';
        var tmpDiv = document.createElement('div');
        tmpDiv.setAttribute('id', divName);
        this.toolbar = new Jx.Toolbar(tmpDiv,{left:0});

        this.homeAction = new Jx.Action(this.gotoFirstTask.bind(this));
        this.toolbar.add(new Jx.Button(this.homeAction, 
                    {
                    image: this.defHomeIcon, 
                    tooltip: 'return to the task pane home'
                    }
        ));

        this.prevAction = new Jx.Action(this.gotoPrevTask.bind(this));
        this.toolbar.add(new Jx.Button(this.prevAction, 
                    {
                    image: this.defPrevTaskIcon, 
                    tooltip: 'go to previous task executed'
                    }
        ));

        this.nextAction = new Jx.Action(this.gotoNextTask.bind(this));
        this.toolbar.add(new Jx.Button(this.nextAction, 
                    {
                    image: this.defNextTaskIcon, 
                    tooltip: 'go to next task executed'
                    }
        ));

        this.taskMenu = new Jx.Menu({image: this.defTaskListIcon, label: 'Task List', right:0});
        Element.addClassName(this.taskMenu.domObj, 'taskMenu');
        Element.addClassName(this.taskMenu.button.domObj, 'jxButtonContentLeft');
        this.toolbar.add(this.taskMenu);
        
        var iframeName = this.sName+'_IFRAME';
        this.iframe = document.createElement('iframe');
        new Jx.Layout(this.iframe);
        this.iframe.setAttribute('name', iframeName);
        this.iframe.setAttribute('id', iframeName);
        this.iframe.setAttribute('frameborder', 0);
        this.iframe.style.border = '0px solid #fff';
        this.oTaskPane = new Jx.Panel({toolbar: tmpDiv, 
                      label: 'Task Pane', 
                      content: this.iframe
        });
        Element.addClassName(this._oDomObj, 'taskPanePanel');
        Fusion.addWidgetStyleSheet(oCommand.sLocation + '/TaskPane/TaskPane.css');
        
        this._oDomObj.appendChild(this.oTaskPane.domObj);
        //we need to trigger an initial resize after the panel
        //is added to the DOM
        this.oTaskPane.domObj.resize();
        
        Fusion.registerForEvent(Fusion.Event.FUSION_INITIALIZED, this.setTaskMenu.bind(this));
    },
    
    updateButtons: function() {
        this.homeAction.setEnabled(this.nTasks > 0);
        this.prevAction.setEnabled(this.nCurrentTask > 0);
        this.nextAction.setEnabled(this.nCurrentTask < this.aExecutedTasks.length - 1);
    },
    
    gotoPrevTask: function() {
      this.nCurrentTask = this.nCurrentTask>0 ? --this.nCurrentTask : 0;
      this.iframe.src = this.aExecutedTasks[this.nCurrentTask];
      this.updateButtons();
    },

    gotoNextTask: function() {
      this.nCurrentTask = this.nCurrentTask<this.aExecutedTasks.length-1 ? 
                          ++this.nCurrentTask : this.aExecutedTasks.length-1;
      this.iframe.src = this.aExecutedTasks[this.nCurrentTask];
      this.updateButtons();
    },

    gotoFirstTask: function() {
      this.nCurrentTask = 0;
      this.iframe.src = this.aExecutedTasks[this.nCurrentTask];
      this.updateButtons();
    },

    setContent: function(url) {
      this.aExecutedTasks.push(url);
      ++this.nCurrentTask;
      this.iframe.src = url;
      this.updateButtons();
    },

    /**
     * Creates a list of tasks to be included in the task menu, once all widgets 
     * have been created.
     *
     */
    setTaskMenu : function() {
      var taskWidgets = Fusion.getWidgetsByType("InvokeURL");
      for (var i=0; i<taskWidgets.length; ++i) {
        var task = taskWidgets[i];
        if (task.sTarget == this.sName) {
          var taskAction = new Jx.Action(task.execute.bind(task));
          this.taskMenu.add( new Jx.MenuItem(taskAction, {label: task.sLabel, image: task.sImageURL}));
          this.nTasks ++;
          if (this.nCurrentTask < 0) {
              task.execute();
          }
        }
      }
    }
   
};
