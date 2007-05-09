/********************************************************************** * 
 * @project Fusion
 * @revision $Id$
 * @purpose Recenter
 * @author yassefa@dmsolutions.ca
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
 * extended description
 * **********************************************************************/

Fusion.require('widgets/ZoomOut.js');

var Recenter = Class.create();
Recenter.prototype = 
{
    initialize : function(oCommand)
    {
        Object.inheritFrom(this, GxWidget.prototype, ['Recenter', true, oCommand]);
        Object.inheritFrom(this, ZoomOut.prototype, []);
        this.setMap(oCommand.getMap());
        this.nFactor = 1;
        this.asCursor = ['resize'];
    }
};
