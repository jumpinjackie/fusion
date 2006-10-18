/*****************************************************************************
 * $Id$
 * Project: Fusion
 * Purpose: Generic event registration and dispatching 
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

/******************************************************************************
 * Event Manager class
 *
 * an internal class for managing generic events.  Classes that wish to
 * publish and trigger events that other objects can listen for need to
 * inherit from EventMgr.
 *
 * To publish an event, call registerEventID with some unique numeric or
 * string value.  Other objects can then call registerForEvent with the
 * eventID and a function to call when the event is triggered.
 *
 * To trigger an event, call triggerEvent with the eventID and any additional
 * arguments that should be passed to listeners.
 *****************************************************************************/

var EventMgr = Class.create();
EventMgr.prototype = {
    /* an array of eventIDs and associated listener functions */
    events : null,
    
    initialize: function() { this.events = []; },

    /**
     * register an event ID so that others can use it.  This should really
     * only be called by 'this' object.
     *
     * @param eventID the event ID to register
     */
    registerEventID : function( eventID ) {
        var ev = new String(eventID);
        if (!this.events[eventID]) {
            this.events[eventID] = [];
        }
    },

    /**
     * register for receiving a callback when an event happens. If you
     * want the callback to be a method on an instance of some object, 
     * use the bind() function as in:
     *
     * otherObj.registerForEvent(SOME_EVENT, this.callback.bind(this));
     *
     * @param eventID the event ID to register for
     * @param f the function to call when the event happens.  
     */
    registerForEvent : function(eventID, f) {
        var ev = new String(eventID);
        this.events[eventID].push(f);
    },

    /**
     * deregister a callback function when you no longer want to
     * recieve it.  Note that if you used bind() when registering,
     * you need to pass EXACTLY THE SAME FUNCTION when
     * deregistering.  Typically, this means you need to assign the
     * result of bind() to an instance variable and pass that instance
     * variable to both registerForEvent and deregisterForEvent.
     *
     * For instance:
     *
     * this.callbackFn = this.callback.bind(this);
     * otherObj.registerForEvent(SOME_EVENT, this.callbackFn);
     * otherObj.deregisterForEvent(SOME_EVENT, this.callbackFn);
     *
     * @param eventID the event ID to deregister
     * @param f the function that used when registering.
     */
    deregisterForEvent : function( eventID, f ) {
        var ev = new String(eventID);
        var bResult = false;
        if (!this.events[eventID]){
            return false;
        }

        for (var i=0;i<this.events[eventID].length;i++) {
            if (this.events[eventID][i]== f) {
                this.events[eventID].splice(i,1);
                bResult = true;
            }
        }
        return bResult;
    },       

    /**
     * trigger an event and call all registered listener functions.
     * This is intended to be called by 'this'.  The eventID param
     * is mandatory.  Any additional arguments will be passed to the
     * listener function.
     *
     * @param eventID the event ID to trigger
     */
    triggerEvent : function( eventID ) {
        var ev = new String(eventID);
        if (!this.events || !this.events[eventID]) {
            return false;
        }

        for (var i=0; i<this.events[eventID].length; i++) {
            this.events[eventID][i].apply(null, arguments);
        }
        return true;
    }
};