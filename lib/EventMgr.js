/*****************************************************************************
 *
 *
 * Purpose: Chamelon app 
 *
 * Project: MapGuide Open Source : Chameleon
 *
 * Author: DM Solutions Group Inc 
 *
 *****************************************************************************
 *
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
 *
 *****************************************************************************/
/*
* $Id$
*/


/******************************************************************************
 * Event Manager class
 *
 * an internal class for managing generic events.  kaMap! uses the event
 * manager internally and exposes certain events to the application.
 *
 * the kaMap class provides wrapper functions that hide this implementation
 * useage:
 *
 * myKaMap.registerForEvent( gnSomeEventID, myObject, myFunction );
 * myKaMap.registerForEvent( 'SOME_EVENT', myObject, myFunction );
 *
 * myKaMap.deregisterForEvent( gnSomeEventID, myObject, myFunction );
 * myKaMap.deregisterForEvent( 'SOME_EVENT', myObject, myFunction );
 *
 * myObject is normally null but can be a javascript object to have myFunction
 * executed within the context of an object (becomes 'this' in the function).
 *
 *****************************************************************************/

function EventMgr( )
{
    this.events = [];
    this.lastEventID = 0;


    this.registerEventID = function( eventID ) 
    {
      var ev = new String(eventID);
      if (!this.events[eventID]) 
      {
        this.events[eventID] = [];
      }
    }

    this.registerForEvent = function(eventID, obj, func) 
    {
        var ev = new String(eventID);
        this.events[eventID].push( [obj, func] );
    }

    this.deregisterForEvent = function( eventID, obj, func ) 
    {
        var ev = new String(eventID);
        var bResult = false;
        if (!this.events[eventID]) 
        {
          return false;
        }

        for (var i=0;i<this.events[eventID].length;i++) {
            
            if (this.events[eventID][i][0] == obj &&
                this.events[eventID][i][1] == func) {
                    this.events[eventID].splice(i,1);
                    bResult = true;
                }
        }
        return bResult;
    }       

    this.triggerEvent = function( eventID ) 
    {
        var ev = new String(eventID);
        if (!this.events[eventID]) {
          return false;
        }

        var args = new Array();
        for(i=1; i<arguments.length; i++) {
          args[args.length] = arguments[i];
        }

        for (var i=0; i<this.events[eventID].length; i++) {
            this.events[eventID][i][1].apply( this.events[eventID][i][0],
                                              arguments );
        }
        return true;
    }
}
