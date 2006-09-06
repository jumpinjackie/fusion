/*****************************************************************************
 * $Id$
 * Purpose: Chamelon  initialization script bootstrap code
 * Project: Chameleon interface
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

var aScripts = document.getElementsByTagName('SCRIPT');
for (var i=0; i<aScripts.length; i++) {
    var s = aScripts[i].src;
    var n = s.indexOf('lib/chameleon.js');
    if (n != -1) {
        var url = s.substring(0,n);
        document.write('<script type="text/javascript" src="'+url+'/lib/prototype.js"></script>');
        document.write('<script type="text/javascript" src="'+url+'/scriptaculous/src/scriptaculous.js"></script>');        
        document.write('<script type="text/javascript" src="'+url+'/scriptaculous/src/dragdrop.js"></script>');
        document.write('<script type="text/javascript" src="'+url+'/scriptaculous/src/effects.js"></script>');
        document.write('<script type="text/javascript" src="'+url+'/lib/utils.js"></script>');
        document.write('<script type="text/javascript" src="'+url+'/lib/EventMgr.js"></script>');
        
        document.write('<script type="text/javascript" src="'+url+'/lib/GxCore.js"></script>');
        break;
    }
}

