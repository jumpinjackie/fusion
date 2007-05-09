/*****************************************************************************
 * $Id$
 * Purpose: GxError - general error class for managing error information
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
    },
    
    toString: function() {
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
        return type + ": " + this.message;
    }
};