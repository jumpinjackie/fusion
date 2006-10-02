<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: Get all attribute informations for elements in the 
 * current selection
 *
 * Project: Genus Map Window
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2006, DM Solutions Group Inc.
 *
 *****************************************************************************/

include('MGCommon.php');

function GetPropertyValueFromFeatReader($featureReader, $propertyType, $propertyName) 
{
    $val = "";

    switch ($propertyType) 
    {
       case MgPropertyType::Null :
         //fwrite($logFileHandle, "$propertyName is a null propertyn");
         $val= "";
         break;
       case MgPropertyType::Boolean :
         $val = $featureReader->GetBoolean($propertyName);
         //$valStr = printBoolean($val);
         break;
       case MgPropertyType::Byte :
         $val = $featureReader->GetByte($propertyName);
         break;
       case MgPropertyType::DateTime :
         $val = $featureReader->GetDateTime($propertyName);
         //$valStr = printDateTime($val);
         break;
       case MgPropertyType::Single :
         $val = $featureReader->GetSingle($propertyName);
         break;
       case MgPropertyType::Double :
         $val = $featureReader->GetDouble($propertyName);
         break;
       case MgPropertyType::Int16 :
         $val = $featureReader->GetInt16($propertyName);
         break;
       case MgPropertyType::Int32 :
         $val = $featureReader->GetInt32($propertyName);
         break;
       case MgPropertyType::Int64 :
         $val = $featureReader->GetInt64($propertyName);
         break;
       case MgPropertyType::String :
         $val = $featureReader->GetString($propertyName);
         break;
       case MgPropertyType::Blob :
         //fwrite($logFileHandle, "$propertyName is blobn");
         break;
       case MgPropertyType::Clob :
         //fwrite($logFileHandle, "$propertyName is clobn");
              break;
       case MgPropertyType::Feature :
         /*
              $val = $featureReader->GetFeatureObject($propertyName);
             if ($val != NULL) {
                  fwrite($logFileHandle, "$propertyName is a featuren");
                  printFeatureReader($val);
             }
         */
         break;
       case MgPropertyType::Geometry :  
         /*
              fwrite($logFileHandle, "$propertyName is a geometryn");
              $val = $featureReader->GetGeometry($propertyName);
              if ($val != NULL) {
                 $aGeometry = $agfReaderWriter->Read($val);
                 //$aGeometry->Envelope();
                 $wktRepresentation = $wktReaderWriter->Write($aGeometry);
                 fwrite($logFileHandle, "WKT Representation: "$wktRepresentation"n");
              } else {
                 fwrite($logFileHandle, "This geometry property is nulln");
              }
         */
         break;
       case MgPropertyType::Raster :
         /*
              $val = $featureReader->GetRaster($propertyName);
             fwrite($logFileHandle, "$propertyName is a rastern");
         */
         break;
       default : 
         $val = "";
    }
    
    return $val;
 }

header('content-type: text/xml');
$featureService = $siteConnection->CreateService(MgServiceType::FeatureService);

$selLayers = "";
$aSelLayers = array();
$bAllLayers = true;
if (isset($_REQUEST['layerNames']))
{
    $selLayers = $_REQUEST['layerNames'];
    $aSelLayers = split(",", $selLayers);
    $bAllLayers = false;
}


$map = new MgMap();
$map->Open($resourceService, $mapName);

$spatialFilter = (isset($_REQUEST['geometry']) && $_REQUEST['geometry'] != '') ? urldecode($_REQUEST['geometry']) : false;

/* open the map from the session using the provided map name.  The map was
   previously created by calling MGLoadMap. */
$map = new MgMap();
$map->Open($resourceService, $mapName);

echo '<Selection>';

$layers = $map->GetLayers();

for ($i=0; $i<$layers->GetCount();$i++) {
    $layer = $map->GetLayers()->GetItem($i);
    if ($bAllLayers || in_array($layer->GetName(), $aSelLayers)) {
        /* get the feature source from the layer */
        $featureResId = new MgResourceIdentifier($layer->GetFeatureSourceId());
        $featureGeometryName = $layer->GetFeatureGeometryName();
        /* the class that is used for this layer will be used to select
           features */
        $class = $layer->GetFeatureClassName();
        $queryOptions = new MgFeatureQueryOptions();
        /* add the spatial filter if provided.  It is expected to come as a
           WKT string, so we need to convert it to an MgGeometry */
        if ($spatialFilter !== false ) {
            //echo 'setting spatial filter<br>';
            $wktRW = new MgWktReaderWriter();
            $geom = $wktRW->Read($spatialFilter);
            $queryOptions->SetSpatialFilter($featureGeometryName, $geom, MgFeatureSpatialOperations::Intersects);
        }

        $bLayerAdded = false;
        $nElements = 0;
        $propNames = array();
        $propTypes = array();

        /* select the features */
        try
        {
            $featureReader = $featureService->SelectFeatures($featureResId, $class, $queryOptions);
            while($featureReader->ReadNext()) {
                //do this only once
                if (!$bLayerAdded) {
                    $bLayerAdded = true;
                    echo '<Layer>';
                    echo '<Name>' . $layer->GetName() . '</Name>';

                    $propCount = $featureReader->GetPropertyCount();
                    echo '<PropertiesNumber>' . $propCount . '</PropertiesNumber>';

                    for($j=0; $j<$propCount; $j++) {
                        $name = $featureReader->GetPropertyName($j);
                        array_push($propNames, $name);
                        array_push($propTypes, $featureReader->GetPropertyType($name));
                    } 
                    echo '<PropertiesNames>' . implode(",", $propNames) . '</PropertiesNames>';
                    echo '<PropertiesTypes>' . implode(",", $propTypes) . '</PropertiesTypes>';
                    echo '<ValueCollection>';
                }
                /* do this for every feature */
                for($j=0; $j<$propCount; $j++) {
                    echo '<v>';
                    echo GetPropertyValueFromFeatReader($featureReader, $propTypes[$j],  $propNames[$j]);
                    echo '</v>';
                }
                $nElements++;
            }
        }
        catch (MgException $e)
        {

        }
        
        if ($bLayerAdded) {
            echo '</ValueCollection>';
            echo '<ElementsSelected>' . $nElements . '</ElementsSelected>';
            echo '</Layer>';
        }
    }
}

echo '</Selection>';

exit;

?>
