/*****************************************************************************
 * $Id$
 * Purpose: Fusion initialization script bootstrap code
 * Project: Fusion
 * Author: DM Solutions Group Inc 
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
 *
 *****************************************************************************/
/* set to true if you want to use the compressed version of the core files,
 * currently this saves about 100kb and quite a few HTTP connections so it is
 * faster, but less convenient if you want to debug one of the core files
 */
var bUseFusionLib = false;

if (bUseFusionLib) {
    var aCoreScripts = ['jx/lib/jx_compressed.js',
                        'lib/fusion-lib.js',
                        'lib/excanvas/excanvas-compressed.js'];
} else {
    var aCoreScripts = ['jx/lib/jx_combined.js',
                        'lib/utils.js',
                        'lib/EventMgr.js',
                        'lib/GxCore.js',
                        'lib/Error.js',
                        'lib/ConfigMgr.js',
                        'lib/WebCommand.js',
                        'lib/WebLayout.js',
                        'lib/MGBroker.js',
                        'lib/Widget.js',
                        'lib/ButtonBase.js',
                        'lib/ButtonTool.js',
                        'lib/CanvasTool.js',
                        'lib/ClickTool.js',
                        'lib/RectTool.js',
                        'lib/Map.js',
                        'lib/excanvas/excanvas-compressed.js'];
}
                    
var aScripts = document.getElementsByTagName('SCRIPT');
var gszFusionURL = '';
var Jx = {};
for (var i=0; i<aScripts.length; i++) {
    var s = aScripts[i].src;
    var n = s.indexOf('lib/fusion.js');
    if (n != -1) {
        gszFusionURL = s.substring(0,n);
        /* import the compressed version of jx and its CSS */
        Jx.baseURL = gszFusionURL + 'jx/';
        Jx.COMBINED_CSS = true;
        for (var j=0; j<aCoreScripts.length; j++) {
            document.write('<script type="text/javascript" src="'+gszFusionURL+aCoreScripts[j]+'"></script>');
        }
        break;
    }
}

