/********************************************************************** * 
 * @project Fusion
 * @revision $Id: InvokeURL.js 665 2007-06-29 14:49:06Z pspencer $
 * @purpose InvokeURL widget
 * @author madair@dmsolutions.ca
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
 * To put a InvokeURL control in your application, you first need to add
 * a widget to your WebLayout as follows:
 *
 * <Command xsi:type="">
 *   <Name>InvokeURL</Name>
 *   <Label>Keep Session Alive/Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>KeepSessionAlive</Action>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * If the Target property points to TaskPane widget, the task will be listed in
 * the menu list of the TaskPane and loaded there.
 * Otherwise if the target is an existing IFrame in the page it will be loaded 
 * there, otherwise it will open a new window with that name.
 *
 *
 * **********************************************************************/

Fusion.Widget.InvokeURL = Class.create();
Fusion.Widget.InvokeURL.prototype = {
    sFeatures : 'menubar=no,location=no,resizable=no,status=no',

    initialize : function(oCommand) {
        //console.log('InvokeURL.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['InvokeURL', false, oCommand]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, [oCommand]);
        this.setMap(oCommand.getMap());

        var json = oCommand.jsonNode;
        this.sTarget = json.Target.length>0 ? json.Target[0] : "InvokeUrlWindow";
        this.sBaseUrl = json.URL[0];  //must be supplied
        this.sLabel = json.Label[0];
        this.sImageURL = json.ImageURL[0];
    },

    execute : function() {
      var url = this.sBaseUrl;
      //add in other parameters to the url here

      var taskPaneTarget = Fusion.getWidgetById(this.sTarget);
      if ( taskPaneTarget ) {
        taskPaneTarget.setContent(url);
      } else {
        var pageElement = $(this.sTarget);
        if ( pageElement ) {
          pageElement.src = url;
        } else {
          window.open(url, this.sTarget, this.sWinFeatures);
        }
      }
    }
};
