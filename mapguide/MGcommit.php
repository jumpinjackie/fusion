<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: Add drawing features to the map as a new layer
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
include ("MGcommon.php");
include ('MGutilities.php');




$renderingSrvc = $siteConnection->CreateService(AwServiceType::RenderingService);
$featureService = $siteConnection->CreateService(AwServiceType::FeatureService);
$mappingService = $siteConnection->CreateService(AwServiceType::MappingService);


$map = new AwMap();
$map->Open($resourceService, $mapName);

//---------------------------------------------------
//Create a feature source from the temporary features
//---------------------------------------------------

//write the feature
$dataSource = "Session:" . $sessionID . "//DrawTool.FeatureSource";
$dataSourceId = new AwResourceIdentifier($dataSource);

$targetDataSource = "Library://DrawTool.FeatureSource";
$targetDataSourceId = new AwResourceIdentifier($targetDataSource);
CreateFeatureSource($map, $targetDataSourceId, 'Drawing', $featureService, 4);

/*$contentReader = $resourceService->GetResourceContent($dataSourceId);
$resourceService->SetResource($targetDataSourceId, $contentReader, null);
*/
$dataContentReader = $resourceService->GetResourceData($dataSourceId, 'DrawTool.sdf');
$resourceService->SetResourceData($targetDataSourceId, 'DrawTool.sdf', 'File', $dataContentReader);
/*$agf = new AwAgfReaderWriter();*/

//---------------------------------------------------
//Create the layer definition
//---------------------------------------------------
$featureName = "Drawing";

$layerDef = "Session:" . $sessionID . "//DrawTool.LayerDefinition";
$layerDefId = new AwResourceIdentifier($layerDef);

$targetLayerDef = "Library://DrawTool.LayerDefinition";
$targetLayerDefId = new AwResourceIdentifier($targetLayerDef);

$contentReader = $resourceService->GetResourceContent($layerDefId);
$layerContent = $contentReader->ToString();
$layerContent = str_replace($dataSource, $targetDataSource, $layerContent);

$byteSource = new AwByteSource($layerContent, strlen($layerContent));
$resourceService->SetResource($targetLayerDefId, $byteSource->GetReader(), null);

/*//modify feature source this layer references
$layer = new AwLayer($targetLayerDefId, $resourceService);
header('content-type: text/html');
$layer->SetFeatureSourceId($targetDataSourceId);
echo $layer->GetFeatureSourceId();
exit;
*/
$layerName = 'Digitized Features';

$layer = add_layer_resource_to_map($targetLayerDefId, $resourceService, $targetLayerDef, $layerName, &$map);
$layer->ForceRefresh();

$map->Save($resourceService);

header('content-type: text/xml');
echo "<message>commit succeeded</message>";
?>