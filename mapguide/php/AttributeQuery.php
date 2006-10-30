<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: create a new selection based on one or more attribute filters and
 *          optionally a spatial filter
 *
 * Project: MapGuide Open Source GMap demo application
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2006, DM Solutions Group Inc.
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
 *****************************************************************************/

try {
    /* set up the session */
    include ("MGCommon.php");
    
    /* override join properties */
    $parent = isset($_REQUEST['parent']) ? $_REQUEST['parent'] : false;
    $parentField = isset($_REQUEST['parentfield']) ? $_REQUEST['parentfield'] : false;
    $child = isset($_REQUEST['child']) ? $_REQUEST['child'] : false;
    $childField = isset($_REQUEST['childfield']) ? $_REQUEST['childfield'] : false;
    $includeParent = isset($_REQUEST['includeparentattributes']) ? $_REQUEST['includeparentattributes'] : false;
    $useParentGeom = isset($_REQUEST['useparentgeometry']) ? $_REQUEST['useparentgeometry'] : false;

    /* the name of the layer in the map to query */
    $layer = $_REQUEST['layer'];

    /* a filter expression to apply, in the form of an FDO SQL statement */
    $filter = isset($_REQUEST['filter']) ? html_entity_decode(urldecode($_REQUEST['filter'])) : false;
    $filter = str_replace('*', '%', $filter);
    //echo "filter: $filter<BR>";
    
    /* we need a feature service to query the features */
    $featureService = $siteConnection->CreateService(MgServiceType::FeatureService);
    
    /* open the map from the session using the provided map name.  The map was
       previously created by calling MGLoadMap. */
    $map = new MgMap();
    $map->Open($resourceService, $mapName);

    /* get the named layer from the map */
    $layerObj = $map->GetLayers()->GetItem($layer);
    
    /* get the feature source from the layer */
    $featureResId = new MgResourceIdentifier($layerObj->GetFeatureSourceId());
    $featureGeometryName = $layerObj->GetFeatureGeometryName();
    //echo "feature geometry name is $featureGeometryName<BR>";
    /* the class that is used for this layer will be used to select
       features */
    /* get the feature source from the layer */
    $featureResId = new MgResourceIdentifier($layerObj->GetFeatureSourceId());
    if ($child) {
        $class = $child;
    } else {
        $class = $layerObj->GetFeatureClassName();
    }    
    //echo "feature class is $class<BR>";
    
    /* add the attribute query if provided */
    $queryOptions = new MgFeatureQueryOptions();
    if ($filter !== false) {
        $queryOptions->SetFilter($filter);
    }

    /* select the features */
    $featureReader = $featureService->SelectFeatures($featureResId, $class, $queryOptions);
    
    //TODO : use layer definition to only get properties defined.
    $propCount = $featureReader->GetPropertyCount();
    
    $props = array();
    $types = array();
    
    for($i=0; $i<$propCount; $i++) 
    {
         $props[$i] = $featureReader->GetPropertyName($i);
         $types[$i] = $featureReader->GetPropertyType($props[$i]);
    }
    header('Content-type: text/plain');
    echo "result={properties:[";
    
    $valSep = '';
    for($i=0; $i<$propCount; $i++) {
        echo $valSep."'".$props[$i]."'";
        $valSep = ',';
    }
    echo $valSep."'has_geometry'],\n";
    $nElements = 0;
    $recSep = '';
    $filterExpr = array();
    $allValues = array();
    $linkValues = array();
    while ($featureReader->ReadNext())
    {
        $featureValues = array();
        $linkValue = false;
        for($i=0; $i<$propCount; $i++) 
        {
            $value = GetPropertyValueFromFeatReader($featureReader, 
                                             $props[$i]);
            //clean up the values to make them safe for transmitting to the client
            $value = htmlentities($value);
            $value = addslashes($value);
            $value = preg_replace( "/\r?\n/", "<br>", $value );
            array_push($featureValues, $value);
            
            if ($useParentGeom && strcasecmp(trim($props[$i]),trim($childField)) == 0) {
                
                $linkValue = $value;
            }
        }
        array_push($featureValues, 0); //assume all features have no geometry first

        $len = array_push($allValues, $featureValues);
        if ($linkValue !== false) {
            array_push($filterExpr, $childField ."=".$linkValue);
            if (!array_key_exists($linkValue,$linkValues)) {
                $linkValues[$linkValue] = array();
            }
            array_push($linkValues[$linkValue], $len - 1);
        }
        $nElements ++;
    }
    $featureReader->Close();
    echo 'values:[';
    if (count($filterExpr) > 0) {
        $filter = '(' . implode(') OR (', $filterExpr).')';
        $parentOptions = new MgFeatureQueryOptions();
        $parentOptions->SetFilter($filter);
        $geomReader = $featureService->SelectFeatures($featureResId, $parent, $parentOptions);
        while($geomReader->ReadNext()) {
            $linkValue = GetPropertyValueFromFeatReader($geomReader, $parentField);
            if (isset($linkValues[$linkValue])) {
                foreach($linkValues[$linkValue] as $val) {
                    array_pop($allValues[$val]);
                    array_push($allValues[$val], 1);
                }
            }
        }
    }
    $sep = '';
    foreach($allValues as $values) {
        echo $sep.'["'.implode('","', $values).'"]';
        $sep = ',';
    }
    echo "]};";
    
} 
catch (MgException $e)
{
  echo "ERROR: " . $e->GetMessage() . "\n";
  echo $e->GetDetails() . "\n";
  echo $e->GetStackTrace() . "\n";
}

function GetPropertyValueFromFeatReader($featureReader, $propertyName) 
{
    $val = "";
    $propertyType = $featureReader->GetPropertyType($propertyName);
    switch ($propertyType) 
    {
       case MgPropertyType::Null :
         //fwrite($logFileHandle, "$propertyName is a null propertyn");
         $val= "";
         break;
       case MgPropertyType::Boolean :
         $val = booleanToString($featureReader->GetBoolean($propertyName));
         //$valStr = printBoolean($val);
         break;
       case MgPropertyType::Byte :
         $val = $featureReader->GetByte($propertyName);
         break;
       case MgPropertyType::DateTime :
         //$val = dateTimeToString($featureReader->GetDateTime($propertyName));
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
 
 function booleanToString($b) {
     $result = '';
     if (is_object($b)) {
         $result = ($b->GetValue()) ? 'true' : 'false';
     }
     return result;
 }
 
 function dateTimeToString($dt) {
     $result = '';
     if (is_object($dt)) {
         if ($dt->isDateTime()) {
             $result = dateTimeToDateString($dt) . ' ' . dateTimeToTimeString($dt);
         } else if ($dt->isTime()) {
             $result = dateTimeToTimeString($dt);
         } else if ($dt->isDate()) {
             $result = dateTimeToDateString($dt);
         }
     }
     return $result;
 }
 
function dateTimeToTimeString($dt) {
    $result = '';
    if ($dt->isTime() || $dt->isDateTime()) {
        //$result = $dt->GetHour() . ':' . $dt->GetMinute() . ':' . $dt->GetSecond() . '.' . $dt->GetMicrosecond();
    }
    return $result;
}

function dateTimeToDateString($dt) {
    $result = '';
    if ($dt->isDate() || $dt->isDateTime()) {
        $result = $dt->GetDay() . ' ' . $dt->GetMonth() . ' ' . $dt->GetYear();
    }
    return $result;
}
?>