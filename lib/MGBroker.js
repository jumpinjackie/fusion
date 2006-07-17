/**
 * @project         MapGuide Open Source Chameleon
 * @revision        $Id$
 * @fileoverview    this file contains classes for communicating
 *                  with a MapGuide MapAgent
 * @author          Paul Spencer (pspencer@dmsolutions.ca)
 * @author          Zak James (zjames@dmsolutions.ca)
 * @author          Fred Warnock (fwarnock@dmsolutions.ca)
 * @copyright       &copy; 2006 DM Solutions Group Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of version 2.1 of the GNU Lesser
 * General Public License as published by the Free Software Foundation.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
 
/**
 * MGBroker is used to broker requests to the MapGuide Open Source
 * mapagent interface.  It is a very simple class that is configured
 * with a URL and credentials via the setSiteURL method and can
 * send requests to the server via the dispatchRequest method.
 */
var MGBroker = Class.create();
MGBroker.prototype = {
    /**
     * the URL to a MapGuide Open Source installation.  Set this using
     * setSiteURL
     * @type String
     */
    mapGuideURL : '',
    /**
     * the agent URL for the MapGuide Open Source installation.  Set from
     * setSiteURL
     * @type String
     */
    mapAgentURL : '',
    /**
     * @class
     * MGBroker constructor
     *
     * @constructor
     * create a new MGBroker instance
     */
    initialize : function() { 
    },
    /**
     * send a request to the MapGuide Open Source server using
     * XMLHttpRequest and return the result to the specified
     * function.
     * @param r {Object} an MGRequest-subclass instance that
     *        defines the operation to request.
     * @param f {Function} a function object to invoke when the
     *        XMLHttpRequest call completes
     */
    dispatchRequest : function( r, f ) {
        var ts = (new Date()).getTime();
        var a = new Ajax.Request( this.mapAgentURL, 
                          Object.extend({ parameters:r.encode() + '&ts='+ts+'&username='+this.user+'&password='+this.pass, onComplete:f }, r.options ) );
        a.originalRequest = r;
    },
    /**
     * set up a connection to a MapGuide Open Source site.  This function
     * expects that url is in the form http(s)://<address>/path-to-mapguide.
     * Path-to-mapguide is should be the base URL to a MapGuide Open
     * Source install.  It is expected that the mapagent is
     * in the expected place (mapagent/mapagent.fcgi) under that URL.  If
     * (for some strange reason) its not, then you can include the full
     * path to mapagent.fcgi in the URL and this function won't try to
     * guess its location.
     * The user name and password are passed on using basic HTML
     * authentication (http://<user>:<pass>@<server>/path-to-mapguide).
     * @param url {String} a properly formatted universal reverse locator
     *        to a MapGuide Open Source installation.
     * @param user {String} a valid user name
     * @param pass {String} the password for the given user.
     */
    setSiteURL : function(url, user, pass) {
        //url = url.replace('://', '://'+user+':'+pass+'@');
        this.user = user;
        this.pass = pass;
        if (url.indexOf('mapagent.fcgi') == -1) {
            if (url.charAt(url.length - 1) != '/') {
                url = url + '/';
            }
            this.mapGuideURL = url;            
            url = url + 'mapagent/mapagent.fcgi';
        }
        this.mapAgentURL = url;
    },
    /**
     * remove all authentication information from the broker
     */
    clearSiteURL: function() {
        this.user = '';
        this.pass = '';
        this.mapGuideURL = '';
        this.mapAgentURL = '';
    }
};

/**
 * MGRequest is the base class for all broker-compatible requests.  A request
 * is a wrapper around an operation that is supported by the mapagent.
 */
var MGRequest = Class.create();
MGRequest.prototype = {
    /**
     * core options shared by all requests
     */
    options : null,
    
    /**
     * core parameters shared by all requests
     */
    parameters : null,
    
    /**
     * @constructor
     * initialize a new instance of MGRequest
     */
    initializeRequest : function() {
        this.options = { method:'post' };
        this.parameters = { version : '1.0.0', locale : 'eng' };
    },
    
    /**
     * set the parameters associated with this request.  Parameters are
     * dependent on the specific MGRequest subclass except for two
     * mandatory parameters, version and locale, that are provided by
     * this base class.
     *
     * @param o {Object} an object that contains named key : value pairs 
     * representing parameters to a request
     */
    setParams : function( o ){ Object.extend( this.parameters, (o || {}) ); },

    /**
     * set the options associated with this request
     * @param o {Object} an object that contains named key : value pairs 
     * representing for a request
     */
    setOptions : function( o ){ Object.extend( this.options, (o || {}) ); },
    
    /**
     * returns a string containing all the request parameters in URL form suitable
     * for appending to a URL.
     * @return {String} the parameters in URL form.
     */
    encode : function() {
        var s = sep = '';
        for (var p in this.parameters) {
            if (this.parameters[p]) {
                s = s + sep + p + '=' + encodeURI(this.parameters[p]);
            }
            sep = '&';
        }
        return s;
    }
};

var MGEnumerateResources = Class.create();
Object.extend(MGEnumerateResources.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 * @class MGEnumerateResources
 * encapsulate a request to the server to enumerate resources in the library.
 */
Object.extend(  MGEnumerateResources.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGEnumerateResources
     *
     * @param resourceID {String} optional parameter indicating the resource
     * to enumerate.  If not set or null, it defaults to "Library://" which
     * is the root of the library.
     *
     * @param type {String} optional parameter indicating the type of resources
     * to enumerate.  If not set, it will default to an empty string which
     * indicates all types will be returned.
     *
     * @param depth {Integer} optional parameter that controls the depth of the
     * resource tree to enumerate.  If not set, it will default to -1 which
     * means the tree will be fully enumerated.
     *
     * @return {Object} an instance of MGEnumerateResources
     */
    initialize : function( resourceID, type, depth ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'ENUMERATERESOURCES',
            resourceid : (resourceID || "Library://"),
            type : (type || ""),
            depth : (typeof depth == 'undefined' ? -1 : depth) } );
    }
});

var MGGetResourceContent = Class.create();
Object.extend(MGGetResourceContent.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to get resource contents from the library.
 */
Object.extend(  MGGetResourceContent.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGGetResourceContent
     *
     * @param resourceID {String} optional parameter indicating the resource
     * to enumerate.  If not set or null, it defaults to "Library://" which
     * is the root of the library.
     *
     * @return {Object} an instance of MGGetResourceContent
     */
    initialize : function( resourceID ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'GETRESOURCECONTENT',
            resourceid : (resourceID || "Library://")
        } );
    }
});

var MGGetResourceHeader = Class.create();
Object.extend(MGGetResourceHeader.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to get resource header from the library.
 */
Object.extend(  MGGetResourceHeader.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGGetResourceHeader
     *
     * @param resourceID {String} optional parameter indicating the resource
     * to enumerate.  If not set or null, it defaults to "Library://" which
     * is the root of the library.
     *
     * @return {Object} an instance of MGGetResourceHeader
     */
    initialize : function( resourceID ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'GETRESOURCEHEADER',
            resourceid : (resourceID || "Library://")
        } );
    }
});

var MGCreateSession = Class.create();
Object.extend(MGCreateSession.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to create a new session on the server.
 *
 */
Object.extend(  MGCreateSession.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGCreateSession
     *
     * @return {Object} an instance of MGCreateSession
     */
    initialize : function( ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'CREATESESSION'
        } );
    }
});

var MGCopyResource = Class.create();
Object.extend(MGCopyResource.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to copy a resource.
 *
 */
Object.extend(  MGCopyResource.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGCopyResource
     *
     * @param sourceID {String} the Resource ID of the source
     * @param destinationID {String} the Resource ID of the destination
     * @param overwrite {Boolean} overwrite the destination if it exists
     *
     * @return {Object} an instance of MGCopyResource
     */
    initialize : function( sourceID, destinationID, overwrite ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'COPYRESOURCE',
            source : sourceID,
            destination: destinationID,
            overwrite : overwrite
        } );
    }
});

var MGDeleteResource = Class.create();
Object.extend(MGDeleteResource.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to delete a resource.
 *
 */
Object.extend(  MGDeleteResource.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGDeleteResource
     *
     * @param resourceID {String} the id of the resource to delete
     *
     * @return {Object} an instance of MGDeleteResource
     */
    initialize : function( resourceID ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'DELETERESOURCE',
            resourceid : resourceID
        } );
    }
});

var MGMoveResource = Class.create();
Object.extend(MGMoveResource.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to move a resource in the repository.
 *
 */
Object.extend(  MGMoveResource.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGMoveResource
     *
     * @param sourceID {String} the Resource ID of the source
     * @param destinationID {String} the Resource ID of the destination
     * @param overwrite {Boolean} overwrite the destination if it exists
     *
     * @return {Object} an instance of MGMoveResource
     */
    initialize : function( sourceID, destinationID, overwrite ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'MOVERESOURCE',
            source : sourceID,
            destination : destinationID,
            overwrite : overwrite
        } );
    }
});

var MGSetResource = Class.create();
Object.extend(MGSetResource.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to set the content XML of a resource.
 *
 */
Object.extend(  MGSetResource.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGSetResource
     *
     * @return {Object} an instance of MGSetResource
     */
    initialize : function( resourceID, content, header ) {
        this.initializeRequest();
        this.setParams( {
            method: 'post', /* SetContent requires post method */
            operation : 'SETRESOURCE',
            resourceid : resourceID,
            content : content,
            header : header
        } );
    }
});

MGDescribeSchema
var MGDescribeSchema = Class.create();
Object.extend(MGDescribeSchema.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to describe the schema of a FeatureSource.
 *
 */
Object.extend(  MGDescribeSchema.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGDescribeSchema
     *
     * @param resourceID {String} the id of the resource to describe the schema for
     * @param schema {String} what does this do?
     *
     * @return {Object} an instance of MGDescribeSchema
     */
    initialize : function( resourceID, schema ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'DESCRIBEFEATURESCHEMA',
            resourceid : resourceID,
            schema : schema
        } );
    }
});

var MGGetSpatialContexts = Class.create();
Object.extend(MGGetSpatialContexts.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to retrieve the spatial context of a resource.
 *
 */
Object.extend(  MGGetSpatialContexts.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGGetSpatialContexts
     *
     * @param resourceID {String} the id of the resource to retrieve the spatial context for
     * @param activeonly {Boolean} what does this do?
     *
     * @return {Object} an instance of MGGetSpatialContexts
     */
    initialize : function(resourceID, activeonly) {
        this.initializeRequest();
        this.setParams( {
            operation : 'GETSPATIALCONTEXTS',
            resourceid : resourceID,
            activeonly : activeonly?'1':'0'
        } );
    }
});

var MGEnumerateResourceReferences = Class.create();
Object.extend(MGEnumerateResourceReferences.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to enumerate the references to a resource id.
 *
 */
Object.extend(  MGEnumerateResourceReferences.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGEnumerateResourceReferences
     *
     * @param resourceID {String} the id of the resource to retrieve the spatial context for
     *
     * @return {Object} an instance of MGEnumerateResourceReferences
     */
    initialize : function( resourceID ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'ENUMERATERESOURCEREFERENCES',
            resourceid: resourceID
        } );
    }
});

var MGEnumerateResourceData = Class.create();
Object.extend(MGEnumerateResourceData.prototype, MGRequest.prototype);
/**
 * @extends MGRequest
 *
 * encapsulate a request to the server to enumerate the data associated with
 * a FeatureSource
 * N.B. This does not enumerate resource data for 'unmanaged' FeatureSources
 *      (those referencing files or directories outside the respository)
 *      MGDescribeSchema should be used for those sources.
 */
Object.extend(  MGEnumerateResourceData.prototype, {
    /**
     * @constructor
     * initialize a new instance of MGEnumerateResourceData
     *
     * @param resourceID {String} the id of the FeatureSource to retrieve data for
     *
     * @return {Object} an instance of MGEnumerateResourceData
     */
    initialize : function( resourceID ) {
        this.initializeRequest();
        this.setParams( {
            operation : 'ENUMERATERESOURCEDATA',
            resourceid: resourceID
        } );
    }
});
