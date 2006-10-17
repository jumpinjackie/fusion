<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: get map initial information
 *
 * Project: MapGuide Open Source : Chameleon
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
include('MGCommon.php');

try
{
    $mappingService = $siteConnection->CreateService(MgServiceType::MappingService);

    // Get a runtime map from a map definition
    if (isset($_REQUEST['mapid']))
    {
      $mapid = $_REQUEST['mapid'];
      //echo $mapid;
      $resourceID = new  MgResourceIdentifier($mapid);
    }


    //make a copy of the map in the session so we can make temporary changes to it
    //$contentReader = $resourceService->GetResourceContent($resourceID);

    //$resourceService->SetResource($resourceID, $contentReader, null);

    $map = new MgMap();
    $mapName = $resourceID->GetName();

    //echo "<br> maname $mapName <br>";

    $map->Create($resourceService, $resourceID, $mapName);


    $mapStateId = new MgResourceIdentifier("Session:" . $sessionID . "//" . $map->GetName() . "." . MgResourceType::Map);


    //create an empty selection object and store it in the session repository
    $sel = new MgSelection($map);
    $sel->Save($resourceService, $mapName);


    $map->Save($resourceService, $mapStateId);


    //$sessionId =  $map->GetSessionId();
    $mapName = $map->GetName() ;
    $extents = $map->GetMapExtent();
    @$oMin = $extents->GetLowerLeftCoordinate();
    @$oMax = $extents->GetUpperRightCoordinate();

    @$srs = $map->GetMapSRS();
    if($srs != "")
    {
      @$csFactory = new MgCoordinateSystemFactory();
      @$cs = $csFactory->Create($srs);
      @$metersPerUnit = $cs->ConvertCoordinateSystemUnitsToMeters(1.0);
      //  $unitsType = $cs->GetUnits();
    }
    else
    {
      $metersPerUnit = 1.0;
      //$unitsType = "Meters";
    }   


    header('content-type: text/xml');
    echo "<mapguidesession>";
    echo "<sessionid>$sessionID</sessionid>";
    echo "<mapid>$mapid</mapid>";
    echo "<metersperunit>$metersPerUnit</metersperunit>";
    echo "<mapname>$mapName</mapname>";
    echo "<extent>";
    echo "<minx>".$oMin->GetX()."</minx>";
    echo "<miny>".$oMin->GetY()."</miny>";
    echo "<maxx>".$oMax->GetX()."</maxx>";
    echo "<maxy>".$oMax->GetY()."</maxy>";
    echo "</extent>";
    echo "</mapguidesession>";
}
catch (MgException $e)
{
  echo "ERROR: " . $e->GetMessage() . "\n";
  echo $e->GetDetails() . "\n";
  echo $e->GetStackTrace() . "\n";
}
exit;
