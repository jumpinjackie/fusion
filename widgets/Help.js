/********************************************************************** * 
 * @project Fusion
 * @revision $Id: $
 * @purpose Help widget
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
 * To put a Help widget in your application, you first need to add
 * a widget to your ApplicationDefinition as follows:
 *
 * <Widget xsi:type="WidgetType"">
 *   <Name>Help</Name>
 *   <Type>Help</Type>
 *   <Description>Open the help page for this application</Description>
 *   <Extension>
 *
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

Fusion.Widget.Help = Class.create();
Fusion.Widget.Help.prototype = {
    sFeatures : 'menubar=no,location=no,resizable=no,status=no',

    initialize : function(widgetTag) {
        //console.log('Help.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, [widgetTag, false]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, []);

        var json = widgetTag.extension;
        this.target = json.Target ? json.Target[0] : "HelpWindow";
        this.baseUrl = json.Url ? json.Url[0] : widgetTag.location + '/Help/Help.html';
        if (this.baseUrl.indexOf("http://")<0) {
            if (this.baseUrl.slice(0,1) == "/") {
                this.baseUrl = window.location.protocol + "//" + window.location.host + this.baseUrl;
            } else {
                this.baseUrl = Fusion.getFusionURL() + this.baseUrl;
            }
        }
        
        this.enable();       
    },
    
    execute : function() {
        var url = this.baseUrl;
        //add in other parameters to the url here
        
        var taskPaneTarget = Fusion.getWidgetById(this.target);
        if ( taskPaneTarget ) {
            taskPaneTarget.setContent(url);
        } else {
            var pageElement = $(this.target);
            if ( pageElement ) {
                pageElement.src = url;
            } else {
                window.open(url, this.target, this.sWinFeatures);
            }
        }
    }
};
