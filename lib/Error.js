/*****************************************************************************
 * $Id$
 * Purpose: GxError - general error class for managing error information
 * Project: Fusion
 * Author: DM Solutions Group Inc 
 *****************************************************************************
 * Copyright (c) 2006, DM Solutions Group Inc.
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
 *****************************************************************************/

var FUSION_ERROR_FATAL = 0;
var FUSION_ERROR_WARNING = 1;
var FUSION_ERROR_NOTICE = 2;

var GxError = Class.create();
GxError.prototype = {
    type: null,
    message: null,
    initialize: function(type, message) {
        this.type = type;
        this.message = message;
    },
    
    alert: function() {
        var type = '';
        switch (this.type) {
            case FUSION_ERROR_FATAL:
                type = 'FATAL';
                break;
                
            case FUSION_ERROR_WARNING:
                type = 'WARNING';
                break;

            case FUSION_ERROR_NOTICE:
                type = 'NOTICE';
                break;
                
            default:
                type = 'UNKNOWN ('+this.type+')';
        }
        alert('Fusion Error: ' + type + '\n' + this.message);
    }
};