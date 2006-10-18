<?php
/*****************************************************************************
 * $Id$
 * Purpose: common include file for all server side scripts, responsible for
 *          setting up the user and site connection.
 * Project: MapGuide Open Source GMap demo application
 * Author:  DM Solutions Group Inc
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

/* 
 * If MapGuide Web Server Extensions are not installed in the default
 * location, you must edit these values to reflect the actual installation
 * path.  You do not need to modify any other values to configure Fusion.
 */
 
$defaultInstallDir = "C:/Program Files/MapGuideOpenSource/";
$defaultExtensionDir = $defaultInstallDir . "WebServerExtensions/www/";

/**
 * Developer's notes:
 *
 * This file should be included by all server-side scripts.  It includes some
 * default paths to install locations and manages all session-related and 
 * user-related stuff except for actually creating a session.
 *
 * It also creates a MgResourceService instance for use by other scripts
 * and recreates an MgMap instance from the session if a mapname is passed.
 *
 * For widgets that are installed outside of the Fusion directory structure,
 * the value of $extensionDir can be set before including this script to avoid
 * some problems.
 */

//widgets outside Fusion can set the $extensionDir before including MGCommon.php

if (!isset($extensionDir)){
    $installDir = $defaultInstallDir;
    $extensionDir = $defaultExtensionDir;
}

$viewDir = $extensionDir."mapviewerphp/";

include $viewDir . "common.php";
include $viewDir . "constants.php";

// Initialize
MgInitializeWebTier($extensionDir. "webconfig.ini");

try {
    /* If no session has been established yet, then we use the credentials passed
     * to this script to connect to the site server.  By default, we use the
     * Anonymous user.
     */
    if (!isset($_REQUEST['session'])) {
        $username = isset($_REQUEST['username']) ? $_REQUEST['username'] : 'Anonymous';
        $password = isset($_REQUEST['password']) ? $_REQUEST['password'] : '';
        $user = new MgUserInformation($username, $password);
        $siteConnection = new MgSiteConnection();
        $siteConnection->Open($user);
    } else {
        /* If a session has previously been established, we can connect using the
         * credentials that the user logged in with previously ... these are stored
         * in the MapGuide session.
         * It is possible for the user to re-authenticate using a different set of
         * credentials.  Handle this here, but keep the session the same.
         */
        $sessionID = $_REQUEST['session'];
        session_start($sessionID);
        
        /* current user is re-authenticating or not? */
        if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
            $user = new MgUserInformation($_REQUEST['username'], $_REQUEST['password']);
            $user->SetMgSessionId($sessionID);
        } else {
            $user = new MgUserInformation($sessionID);
        }
        
        /* open a connection to the site.  This will generate exceptions if the user
         * is set up properly - not found, invalid password etc
         */
        $siteConnection = new MgSiteConnection();
        $siteConnection->Open($user);
        
        /* MgUserInformation doesn't tell us who is logged in so we store it
         * in the php session for convenience
         */
        if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
            $_SESSION['username'] = $_REQUEST['username'];
        }
        //echo "current user: ".$_SESSION['username'];
    }
} catch (MgAuthenticationFailedException $afe) {
    header('Content-type: text/xml');
    echo "<Exception>";
    echo "<Type>Authentication Failed</Type>";
    echo "<Message>" . $afe->GetMessage() . "</Message>";
    echo "<Details>" . $afe->GetDetails() . "</Details>";
    echo "</Exception>";
    exit;
} catch (MgUserNotFoundException $unfe) {
    header('Content-type: text/xml');
    echo "<Exception>";
    echo "<Type>User Not Found</Type>";
    echo "<Message>" . $unfe->GetMessage() . "</Message>";
    echo "<Details>" . $unfe->GetDetails() . "</Details>";
    echo "</Exception>";
    exit;
} catch (MgSessionExpiredException $see) {
    header('Content-type: text/xml');
    echo "<Exception>";
    echo "<Type>Session Expired</Type>";
    echo "<Message>" . $see->GetMessage() . "</Message>";
    echo "<Details>" . $see->GetDetails() . "</Details>";
    echo "</Exception>";
    exit;
} catch (MgException $e) {
    header('Content-type: text/xml');
    echo "<Exception>";
    echo "<Type>Exception</Type>";
    echo "<Message>" . $e->GetMessage() . "</Message>";
    echo "<Details>" . $e->GetDetails() . "</Details>";
    echo "</Exception>";
    exit;
}

//common resource service to be used by all scripts
$resourceService = $siteConnection->CreateService(MgServiceType::ResourceService);

if (isset($_REQUEST['mapname'])) { 
    $mapName = $_REQUEST['mapname'];
    $mapResourceID = new MgResourceIdentifier( 'Session:'.$sessionID.'//'.$mapName.'.MapDefinition');
    $mapStateID = new MgResourceIdentifier('Session:'.$sessionID.'//'.$mapName.'.'.MgResourceType::Map);
}
?>