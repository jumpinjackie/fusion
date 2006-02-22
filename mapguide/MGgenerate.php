<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: redraw the current MapDefinition and return a URL to the temporary
 *          image
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
//----------------------------------------------------------------------------
//Entry point
//----------------------------------------------------------------------------
include('MGcommon.php');
include('MGutilities.php');

// Get an instance of the required services.
//C:\Program Files\MapServerEnterprise\WebExtensions\Help\d9\dc5\_resource_service_8h-source.html
//Enables you to manipulate repositories and resources.
/// \remarks
/// Contains methods to:
///   * get, add, move, copy, list, and delete resources
///   * get, set, rename, list, and delete resource data
///   * set permission for repositories and resources
$renderingSrvc = $siteConnection->CreateService(AwServiceType::RenderingService);
$featureService = $siteConnection->CreateService(AwServiceType::FeatureService);
$mappingService = $siteConnection->CreateService(AwServiceType::MappingService);

$map = new AwMap();
$map->Open($resourceService, $mapName);

$selection = new AwSelection($map);

/*
$map->SetDisplayDpi(96);
*/
$map->SetDisplayWidth($_GET['width']);
$map->SetDisplayHeight($_GET['height']);

$geomFactory = new AwGeometryFactory();

//create a coordinate
$extents = explode(',',$_GET['extents']);
$precision = 6;
$lowerLeft = $geomFactory->CreateCoordinateXY(round($extents[0],$precision), round($extents[1],$precision));
$upperRight = $geomFactory->CreateCoordinateXY(round($extents[2],$precision), round($extents[3],$precision));
$clientExtents = new AwEnvelope($lowerLeft, $upperRight);

$bgcolor = new AwColor(255,255,255);

$featureName = "Drawing";

$coordinateCollection = new AwCoordinateCollection();
$wktReaderWriter = new AwWktReaderWriter();

//OVERLAY DRAWING
//iterate over any coordinate pairs
if (isset($_GET['coords']))
{
    $aCoords = explode(',', $_GET['coords']);
    foreach ($aCoords as $i)
    {
        $aCoord = explode(' ',$i);
        if (count($aCoord) == 2)
        {
            $coordinate = $geomFactory->CreateCoordinateXY($aCoord[0], $aCoord[1]);
            $coordinateCollection->Add($coordinate);
        }
    }
    $lineString = $geomFactory->CreateLineString($coordinateCollection);        

    //write the feature
    $dataSource = "Session:" . $sessionID . "//DrawTool.FeatureSource";
    //debug - test storing this in Library
    //$dataSource = "Library://DrawTool.FeatureSource";
    $dataSourceId = new AwResourceIdentifier($dataSource);
    $agf = new AwAgfReaderWriter();

    //Create the layer definition
    $layerDef = "Session:" . $sessionID . "//DrawTool.LayerDefinition";
    //$layerDef = "Library://DrawTool.LayerDefinition";
    $layerDefId = new AwResourceIdentifier($layerDef);
    $layerDefContent = BuildLayerDefinitionContent($dataSource, $featureName, '');
    $layers = $map->GetLayers();
    $layer = FindLayer($layers, $layerDef);

    $resourceService->SetResource($layerDefId, $layerDefContent, null);

    //Add the layer to the map, if it's not already in it
    if($layer == null)
    {
        CreateFeatureSource($map, $dataSourceId, $featureName, $featureService, 4);

        $layer = new AwLayer($layerDefId, $resourceService);
        $layers->Insert(0, $layer);
    }
    
    $geomReader = $agf->Write($lineString);
    $geomProp = new AwGeometryProperty("GEOM", $geomReader);   
    $drawProps = new AwPropertyCollection();
    $drawProps->Add($geomProp);

    $cmd = new AwInsertFeatures($featureName, $drawProps);
    $commands = new AwFeatureCommandCollection();
    $commands->Add($cmd);

    $res = $featureService->UpdateFeatures($dataSourceId, $commands, false);
    $res->GetItem(0)->GetValue()->Close();
    
    /* cause the layer to re-fetch the features on the next draw */
    $layer->ForceRefresh();
    
    //save the session mapfile to make the new layer remain on reload
    try {
       $map->Save($resourceService);   
    }
    catch (AwException $e)
    {
        echo "ERROR: " . $e->GetMessage() . "n";
        echo $e->GetDetails() . "n";
        echo $e->GetStackTrace() . "n";
    }
                   
}
$oByteReader =$renderingSrvc->rendermap($map, $selection, $clientExtents, 
                                        $map->GetDisplayWidth(), $map->GetDisplayHeight(), $bgcolor, "PNG");
//TODO: make the temp location configurable
$imgName = "c:/Program Files/Apache Group/Apache2/htdocs/ms_tmp/".$sessionID . rand() . '.png';
$oByteSink = new AwByteSink($oByteReader);
$oByteSink->ToFile($imgName); 

//return image
//header('content-type: text/html');
header('content-type: image/png');
echo file_get_contents($imgName);
unlink($imgName);                          

//session_write_close();
?>