/*****************************************************************************
 * $Id$
 * Purpose: Fusion initialization script bootstrap code
 * Project: Fusion
 * Author: DM Solutions Group Inc 
 *****************************************************************************
 *
 * Copyright (c) 2005, DM Solutions Group Inc.
 *
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
 *
 *****************************************************************************/

var aCoreScripts = [/*'jx/scriptaculous/prototype.js',
                    'jx/scriptaculous/builder.js',
                    'jx/scriptaculous/effects.js',
                    'jx/scriptaculous/dragdrop.js',
                    'jx/scriptaculous/controls.js',
                    'jx/scriptaculous/slider.js',
                    'jx/jxcore.js',
                    'jx/button/jxbutton.js',
                    'jx/color/jxcolor.js',
                    'jx/layout/jxlayout.js',
                    'jx/dialog/jxdialog.js',
                    'jx/grid/jxgrid.js',
                    'jx/menu/jxmenu.js',
                    'jx/panel/jxpanel.js',
                    'jx/picker/jxpicker.js',
                    'jx/splitter/jxsplitter.js',
                    'jx/statusbar/jxstatusbar.js',
                    'jx/tab/jxtab.js',
                    'jx/toolbar/jxtoolbar.js',
                    'jx/tree/jxtree.js',*/
                    'jx/jx_full_min.js',
                    'lib/utils.js',
                    'lib/EventMgr.js',
                    'lib/GxCore.js',
                    'lib/GxError.js',
                    'lib/ConfigMgr.js',
                    'lib/WebCommand.js',
                    'lib/WebLayout.js',
                    'lib/MGBroker.js',
                    'lib/GxWidget.js',
                    'widgets/excanvas.js'];
                    
var aScripts = document.getElementsByTagName('SCRIPT');
var gszFusionURL = '';
var jxBaseURL = '';
for (var i=0; i<aScripts.length; i++) {
    var s = aScripts[i].src;
    var n = s.indexOf('lib/fusion.js');
    if (n != -1) {
        gszFusionURL = s.substring(0,n);
        jxBaseURL = gszFusionURL + 'jx/';
        for (var j=0; j<aCoreScripts.length; j++) {
                    document.write('<script type="text/javascript" src="'+gszFusionURL+aCoreScripts[j]+'"></script>');
        }
        break;
    }
}

