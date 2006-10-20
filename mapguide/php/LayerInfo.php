<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: get info about a layer and its underlying data source
 *
 * Project: MapGuide Open Source
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

include ("MGCommon.php");
include ("MGUtilities.php");

$featureService = $siteConnection->CreateService(MgServiceType::FeatureService);

// Converts a boolean to "yes" or "no"
// --from MG Web Tier API Reference
function BooleanToString($boolean)
{
    if (is_bool($boolean))
        return ($boolean ? "true" : "false");
    else
        return "ERROR in BooleanToString.";
}

//Get a runtime map from a map definition
$map = new MgMap();
$map->Open($resourceService, $mapName);

//Get the layer
$layerCollection=$map->GetLayers();
$layer = $layerCollection->GetItem($_REQUEST['layer']);
if ($layer == null) {
    echo '<Error>Layer '.$_REQUEST['layer'].' Not Found</Error>';
    exit;
}
$dataSourceId = new MgResourceIdentifier($layer->GetFeatureSourceId());
//echo $dataSourceId->ToString();exit;
$agf = new MgAgfReaderWriter();

/*****************************************************************************
 TODO: check GetCapabilities of the feature provider to ensure that it has
       the appropriate capability to insert and update
 *****************************************************************************/

/*****************************************************************************
 TODO: check user permissions to edit the resource
 *****************************************************************************/

/*****************************************************************************
 get the layer's geometric type(s)
 *****************************************************************************/
 
/*****************************************************************************
 get the layer's attributes and types
 *****************************************************************************/

//get class definition from the featureSource
$classDefinition = GetFeatureClassDefinition($featureService, $layer, $dataSourceId);

//MgPropertyDefinition classProps
$classProps = $classDefinition->GetProperties();
$featureGeometryName = $layer->GetFeatureGeometryName();
$aLayerTypes = array();
for ($i=0; $i< $classProps->GetCount(); $i++)
{
    $prop = $classProps->GetItem($i);
    if ($prop->GetPropertyType() == MgFeaturePropertyType::GeometricProperty) {
        $featureClass = $prop->GetGeometryTypes();
        if ($featureClass & MgFeatureGeometricType::Surface) {
            array_push($aLayerTypes, 'surface');
        } else if ($featureClass & MgFeatureGeometricType::Curve) {
            array_push($aLayerTypes, 'curve');
        } else if ($featureClass & MgFeatureGeometricType::Solid) {
            array_push($aLayerTypes, 'solid'); //could use surface here for editing purposes?
        } else if ($featureClass & MgFeatureGeometricType::Point){
            array_push($aLayerTypes, 'point');
        }
        break;
    }
}

//Get layer collection as xml
header('content-type: text/xml');
echo "<LayerInfo>";
for ( $i=0; $i < count($aLayerTypes); $i++ )
{ 
    echo "<LayerType>".$aLayerTypes[$i]."</LayerType>";
}
echo "<Editable>true</Editable>";
echo "</LayerInfo>";
exit;
?>