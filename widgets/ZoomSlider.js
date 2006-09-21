/********************************************************************** * 
 * @project MapGuide Open Source : Chameleon
 * @revision $Id$
 * @purpose Continuous zoom between two scales using a graphical interface
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
 * Continuous zoom between two scales using a graphical interface
 *
 * This uses the Scriptaculous Control.Slider control.  You need two <div>
 * elements in the page, one that is the 'track' and the other that is the
 * 'handle' of the slider.
 * 
 * **********************************************************************/

var ZoomSlider = Class.create();
ZoomSlider.prototype = 
{
    nFactor: null,
    initialize : function(oCommand)
    {
        Object.inheritFrom(this, GxWidget.prototype, ['ZoomSlider', false]);
        this.setMap(oCommand.getMap());
        
        this._oTrack = $(oCommand.oxmlNode.getNodeText('Track'));
        this._oHandle = $(oCommand.oxmlNode.getNodeText('Handle'));
        var direction = oCommand.oxmlNode.getNodeText('Direction');
        if (direction == '') {
            direction = 'horizontal';
        }
        this.fMinScale = parseFloat(oCommand.oxmlNode.getNodeText('MinScale'));
        this.fMaxScale = parseFloat(oCommand.oxmlNode.getNodeText('MaxScale'));
        
        var options = {};
        options.axis = direction;
        options.range = $R(this.fMinScale, this.fMaxScale);
        options.sliderValue = this.clipScale(this.getMap().getScale());
        options.onChange = this.scaleChanged.bind(this);
        //this._oSlider = new Control.Slider(this._oHandle, this._oTrack, options);
        
        this.getMap().registerForEvent(MAP_EXTENTS_CHANGED, null, this.mapExtentsChanged.bind(this));
        
    },
    
    clipScale: function(scale) {
        return Math.min(this.fMaxScale, Math.max(this.fMinScale, scale));
    },
    
    scaleChanged: function(value) {
        if (this.getMap().getScale() != value) {
            this.getMap().zoomScale(value);
        }
    },
    
    mapExtentsChanged: function() {
        var scale = this.clipScale(this.getMap().getScale());
        if (scale != this._oSlider.value) {
            this._oSlider.setValue(scale);
        }
    }
};