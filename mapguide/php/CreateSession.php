<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: initialize a server-side session for GMap and return to the client
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
$installDir = "C:/Program Files/MapGuideOpenSource/";
$extensionDir = $installDir . "WebServerExtensions/www/";
$viewDir = $extensionDir . "mapviewerphp/";

try
{

  include $viewDir . "common.php";
  include $viewDir . "constants.php";

  MgInitializeWebTier($extensionDir. "webconfig.ini");

  $user = new MgUserInformation('Administrator', 'admin');

  $siteConnection = new MgSiteConnection();
  $siteConnection->Open($user);


  $site = $siteConnection->GetSite();
  $sessionId =  $site->CreateSession();

  $user->SetMgSessionId($sessionId);

  header('content-type: text/xml');
  echo "<mapguidesession>";
  echo "<sessionid>$sessionId</sessionid>";
  echo "</mapguidesession>";

}
catch (MgException $e)
{
     echo "ERROR: " . $e->GetMessage() . "n";
     echo $e->GetDetails() . "n";
     echo $e->GetStackTrace() . "n";
}
