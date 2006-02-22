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
/* this creates a session if one doesn't exist */
include ("MGcommon.php");

$szMapResource = $_GET['map'];

//Get a runtime map from a map definition
$libraryResourceID = new  AwResourceIdentifier($szMapResource);





//make a copy of the map in the session so we can make temporary changes to it

$contentReader = $resourceService->GetResourceContent($libraryResourceID);
$resourceService->SetResource($mapResourceID, $contentReader, null);

$map = new AwMap();

$szMapName = $mapResourceID->GetName();
$map->Create($resourceService, $mapResourceID, $szMapName);//'Sheboygan');


//create an empty selection object and store it in the session repository
$sel = new AwSelection($map);
$sel->Save($resourceService, $szMapName);


$mapStateId = new AwResourceIdentifier("Session:" . $sessionID . "//" . $szMapName . "." . AwResourceType::Map);
$map->Save($resourceService, $mapStateId);


//set map dimensions
$map->SetDisplayDpi(96);
$map->SetDisplayWidth($_GET['width']);
$map->SetDisplayHeight($_GET['height']);

//get extents
$extents = $map->GetMapExtent();
$oMin = $extents->GetLowerLeftCoordinate();
$oMax = $extents->GetUpperRightCoordinate();
/*$nWidth = $oMax->GetX() - $oMin->GetX();
$nHeight = $oMax->GetY() - $oMin->GetY();
*/


//
$srs = $map->GetMapSRS();
if($srs != "")
{
  $csFactory = new AwCoordinateSystemFactory();
  $cs = $csFactory->Create($srs);
  $metersPerUnit = $cs->ConvertCoordinateSystemUnitsToMeters(1.0);
  //  $unitsType = $cs->GetUnits();
}
else
{
  $metersPerUnit = 1.0;
  //$unitsType = "Meters";
}   


$map->Save($resourceService, $mapStateId);


//return XML
header('content-type: text/xml');
echo "<mapguidesession>";
echo "<mapname>$szMapName</mapname>";
echo "<sessionid>$sessionID</sessionid>";
echo "<metersperunit>$metersPerUnit</metersperunit>";
echo "<mapname>$szMapName</mapname>";
echo "<extent>";
echo "<minx>".$oMin->GetX()."</minx>";
echo "<miny>".$oMin->GetY()."</miny>";
echo "<maxx>".$oMax->GetX()."</maxx>";
echo "<maxy>".$oMax->GetY()."</maxy>";
echo "</extent>";
echo "</mapguidesession>";
                                                
?>
