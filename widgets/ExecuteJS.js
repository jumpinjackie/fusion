/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose execute arbitrary javascript
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
 * execute arbitrary javascript
 * 
 * **********************************************************************/



Fusion.Widget.ExecuteJS = Class.create();
Fusion.Widget.ExecuteJS.prototype = 
{
    sScript: null,
    initialize : function(oCommand)
    {
        //console.log('FitToWindow.initialize');
        Object.inheritFrom(this, Fusion.Widget.prototype, ['ExecuteJS', false, oCommand]);
        Object.inheritFrom(this, Fusion.Tool.ButtonBase.prototype, []);
        this.setMap(oCommand.getMap());
        
        this.sScript = oCommand.jsonNode.Script ? oCommand.jsonNode.Script[0] : '';
    },

    /**
     * called when the button is clicked by the Fusion.Tool.ButtonBase widget
     */
    execute : function()
    {
        eval(this.sScript);
    }
};