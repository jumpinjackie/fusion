/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose KeepSessionAlive widget
 * @author pspencer@dmsolutions.ca
 * @copyright (c) 2006 DM Solutions Group Inc.
 * @license MIT
 * ********************************************************************
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ********************************************************************
 *
 * Keep the current session active by 'pinging' the server periodically
 
 * To put a KeepSessionAlive control in your application, you first need to add
 * a widget to your WebLayout as follows:
 *
 * <Command xsi:type="KeepSessionAliveCommandType">
 *   <Name>KeepAlive</Name>
 *   <Label>Keep Session Alive/Label>
 *   <TargetViewer>All</TargetViewer>
 *   <Action>KeepSessionAlive</Action>
 * </Command>
 *
 * The important parts of this Command are:
 *
 * Name (string, mandatory) 
 * 
 * an element with an id that is the same as this name must be in
 * the application.  For instance:
 *
 * <div id="KeepAlive"></div>
 *
 * A button that activates this widget will appear inside the
 * element you provide.
 * **********************************************************************/

var KeepSessionAlive = Class.create();
KeepSessionAlive.prototype = {
    initialize : function(oCommand) {
        //console.log('KeepSessionAlive.initialize');
        Object.inheritFrom(this, GxWidget.prototype, ['KeepSessionAlive', false]);
        this.setMap(oCommand.getMap());
    }
};
