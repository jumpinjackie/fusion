<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: common include file for all server side scripts, responsible for
 *          setting up the user and site connection.
 *
 * Project: MapGuide Open Source GMap demo application
 *
 * Author: DM Solutions Group Inc
 *
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
//set up the MG server session and pass it back to the javascript init
include ("c:/Program Files/MapServerEnterprise/WebExtensions/MapViewerPhp/Constants.php");

// Initialize
AwInitializeWebTier ("c:/Program Files/MapServerEnterprise/WebExtensions/webconfig.ini");
$user = new AwUserInformation('Administrator', 'admin');
$siteConnection = new AwSiteConnection();
$siteConnection->Open($user);

$site = new AwSite();
$site->Open($user);

if (!isset($_GET['session'])) {
	$sessionID = $site->CreateSession();
}
else
{
	$sessionID = $_GET['session'];
}
$user->SetAwSessionId($sessionID);

//resource ID for the map to be used by all scripts

//$mapResourceID = new AwResourceIdentifier( 'Session:'.$sessionID.'//Map.MapDefinition');
$mapResourceID = new AwResourceIdentifier("Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition");


//$mapResourceID = new AwResourceIdentifier( 'Session:'.$sessionID.'//Map.MapDefinition');
//$mapName = $mapResourceID->GetName();
//$mapStateID = new AwResourceIdentifier('Session:'.$sessionID.'//'.$mapName.'.'.AwResourceType::Map);


//common resource service to be used by all scripts
$resourceService = $siteConnection->CreateService(AwServiceType::ResourceService);
?>
