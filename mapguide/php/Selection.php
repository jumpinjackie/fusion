<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: Get all attribute informations for elements in the 
 * current selection
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
 *
 *****************************************************************************/


include('MGCommon.php');
include('MGUtilities.php');

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

try
{
    header('Content-type: text/xml');
    $featureService = $siteConnection->CreateService(MgServiceType::FeatureService);
    $queryOptions = new MgFeatureQueryOptions();

    /*mapname*/
    $mapname = "";
    if (isset($_REQUEST['mapname']))
    {
        $mapname = $_REQUEST['mapname'];
        
    }

    /*TODO selection layers : only return selection on these layers. Comma separated list (layers1,layer2)*/
    $selLayers = "";
    $aSelLayers = array();
    if (isset($_REQUEST['layers']))
    {
        $selLayers = $_REQUEST['layers'];
        $aSelLayers = split(",", $selLayers);
    }


    $map = new MgMap();
    $map->Open($resourceService, $mapname);
    
    /* Get the map SRS - we use this to convert distances */
    $srsFactory = new MgCoordinateSystemFactory();
    //safely get an SRS ... (in MGUtilities)
    $srsDefMap = GetMapSRS($map);
    $srsMap = $srsFactory->Create($srsDefMap);
    $mapSrsUnits = $srsMap->GetUnits();
    
    $selection = new MgSelection($map);
    $selection->Open($resourceService, $mapname);
    $layers = $selection->GetLayers();
    $nLayers = 0;
    $nActualLayers = 0;
    $iValidLayer = 0;
    if ($layers)
    {
        echo '<Selection>';
        $nLayers = $layers->GetCount();
        $aSelection = array($nLayers);
        
        $oExtents = $selection->GetExtents($featureService);
        if ($oExtents) {
            $oMin = $oExtents->GetLowerLeftCoordinate();
            $oMax = $oExtents->GetUpperRightCoordinate();
            echo "<minx>".$oMin->GetX()."</minx>";
            echo "<miny>".$oMin->GetY()."</miny>";
            echo "<maxx>".$oMax->GetX()."</maxx>";
            echo "<maxy>".$oMax->GetY()."</maxy>";
        }
        
        $nTotalElements = 0;
        for ($i = 0; $i < $nLayers; $i++)
        {
            $nElements = 0;
            $layer = $layers->GetItem($i);
            $mappings = $_SESSION['property_mappings'][$layer->GetObjectId()];
            if (count($mappings) == 0) {
                continue;
            }
            if ($layer && $layer->IsVisible() && $layer->GetSelectable())
            {
                $nActualLayers ++;
                echo '<Layer>';
                echo '<Name>' . $layer->GetName() . '</Name>';
                
                $aSelection[$iValidLayer] = array();
                $aSelection[$iValidLayer]["name"] = $layer->GetName();

                //gives the feature class name
                $layerClassName = $layer->GetFeatureClassName();
                //echo "GetFeatureClassName : $layerClassName <br>";

                // Create a filter containing the IDs of the selected
                // features on this layer
                //gives something like this : (FeatId=21) OR (FeatId=50) ...
                $selectionString = $selection->GenerateFilter($layer, $layerClassName);
                //echo "selection->GenerateFilter : $selectionString <br>";
          
                // Get the feature resource for the selected layer
                $layerFeatureId = $layer->GetFeatureSourceId();
                //echo "layerFeatureId = $layerFeatureId <br>\n";

                $layerFeatureResource = new MgResourceIdentifier($layerFeatureId);
                
                //only retrieve properties that we actually need
                foreach($mappings as $name => $value) {
                    $queryOptions->AddFeatureProperty($name);
                }
                
                $queryOptions->AddFeatureProperty($layer->GetFeatureGeometryName());
                
                // Apply the filter to the feature resource for the
                // selected layer. This returns
                // an MgFeatureReader of all the selected features.
                $queryOptions->SetFilter($selectionString);
                $featureReader = $featureService->SelectFeatures($layerFeatureResource, $layerClassName, $queryOptions);

                //??
                //$classdefinition = $featureReader->GetClassDefinition();
          
                
                //TODO : use layer definition to only get properties defined.
                $propCount = $featureReader->GetPropertyCount();
                
                $aSelection[$iValidLayer]["nproperties"] = $propCount - 1;
                $aSelection[$iValidLayer]["properties_name"] = array($propCount);
                $aSelection[$iValidLayer]["properties_value"] = array($propCount);
                $aSelection[$iValidLayer]["properties_type"] = array($propCount);
                $aSelection[$iValidLayer]["elements"] = array();

                echo '<PropertiesNumber>' . $propCount . '</PropertiesNumber>';
                
                $k=0;
                for($j=0; $j<$propCount; $j++) 
                {
                    $propName = $featureReader->GetPropertyName($j);
                    $propType = $featureReader->GetPropertyType($propName);
                    if ($propType == MgPropertyType::Geometry) {
                        continue;
                    }
                    $mapping = isset($mappings[$propName]) ? $mappings[$propName] : $propName;

                    $aSelection[$iValidLayer]["properties_name"][$k] = $propName;
                    $aSelection[$iValidLayer]["properties_value"][$k] = $mapping;
                    $aSelection[$iValidLayer]["properties_type"][$k] = $propType;
                    $k++;
                } 
                echo '<PropertiesNames>' . implode(",", $aSelection[$iValidLayer]["properties_value"]) . '</PropertiesNames>';
                echo '<PropertiesTypes>' . implode(",", $aSelection[$iValidLayer]["properties_type"]) . '</PropertiesTypes>';
                
                $nElements = 0;
                
                $spatialContext = $featureService->GetSpatialContexts($layerFeatureResource, true);
                $srsLayerWkt = false;
                if($spatialContext != null) {
                    $spatialContext->ReadNext();
                    $srsLayerWkt = $spatialContext->GetCoordinateSystemWkt();
                    /* skip this layer if the srs is empty */
                }
                if ($srsLayerWkt == null) {
                    $srsLayerWkt = $srsDefMap;
                }
                /* create a coordinate system from the layer's SRS wkt */
                $srsLayer = $srsFactory->Create($srsLayerWkt);
                
                // exclude layer if:
                //  the map is non-arbitrary and the layer is arbitrary or vice-versa
                //     or
                //  layer and map are both arbitrary but have different units
                //
                $bLayerSrsIsArbitrary = ($srsLayer->GetType() == MgCoordinateSystemType::Arbitrary);
                $bMapSrsIsArbitrary = ($srsMap->GetType() == MgCoordinateSystemType::Arbitrary);
                
                $bComputedProperties = true;
                if (($bLayerSrsIsArbitrary != $bMapSrsIsArbitrary) || 
                    ($bLayerSrsIsArbitrary && ($srsLayer->GetUnits() != $srsMap->GetUnits()))) {
                    $bComputedProperties = false;
                } else {
                    $srsTarget = null;
                    $srsXform = null;
                    $bNeedsTransform = true;

                    if ($srsLayer->GetUnitScale() != 1.0) {
                        if ($srsMap->GetUnitScale() == 1.0) {
                            $srsTarget = $srsMap;
                            $srsXform = new MgCoordinateSystemTransform($srsLayer, $srsTarget);
                            $bNeedsTransform = false;
                        }
                    }
                }

                while ($featureReader->ReadNext())
                {
                    $dimension = '';
                    $bbox = '';
                    $center = '';
                    $area = '';
                    $length = '';
                    
                    if ($bComputedProperties) {
                        $classDef = $featureReader->GetClassDefinition();
                        $geomName = $classDef->GetDefaultGeometryPropertyName();
                        if ($geomName != '') {
                            $geomByteReader = $featureReader->GetGeometry($geomName);
                            $agf = new MgAgfReaderWriter();
                            $geom = $agf->Read($geomByteReader);

                            $envelope = $geom->Envelope();
                            $ll = $envelope->GetLowerLeftCoordinate();
                            $ur = $envelope->GetUpperRightCoordinate();
                            $bbox = ' bbox="'.$ll->GetX().','.$ll->GetY().','.$ur->GetX().','.$ur->GetY().'"';
                            $centroid = $geom->GetCentroid()->GetCoordinate();
                            $center = ' center="'.$centroid->GetX().','.$centroid->GetY().'"';
                            
                            /* 0 = point, 1 = curve, 2 = surface */
                            $dimension = ' type="'.$geom->GetDimension().'"';
                            
                            if ($geom->GetDimension() > 0) {
                                if ($bNeedsTransform) {
                                    $srsTarget = $srsFactory->Create(getUtmWkt($centroid->GetX(),
                                                                               $centroid->GetY()));
                                    $srsXform = new MgCoordinateSystemTransform($srsLayer, $srsTarget);
                                }
                                if ($srsXform != null) {
                                    $geom = $geom->Transform($srsXform);
                                }

                                if ($geom->GetDimension() > 1) {
                                    $area = ' area="'.$geom->GetArea().'"';
                                }
                                if ($geom->GetDimension() > 0) {
                                    $length = ' distance="'.$geom->GetLength().'"';
                                }
                            }
                        }
                    }
                    echo '<ValueCollection '.$dimension.$bbox.$center.$area.$length.'>';
                    for($j=0; $j<$k; $j++) 
                    {
                        $aSelection[$iValidLayer]["elements"][$nElements][$j] = 
                          GetPropertyValueFromFeatReader($featureReader, 
                                                         $aSelection[$iValidLayer]["properties_type"][$j],
                                                         $aSelection[$iValidLayer]["properties_name"][$j]);
                        $value = htmlentities($aSelection[$iValidLayer]["elements"][$nElements][$j]);
                        $value = addslashes($value);
                        $value = preg_replace( "/\r?\n/", "<br>", $value );
                        
                        echo '<v>' . $value . '</v>';
                        
                    }
                     echo '</ValueCollection>';
                    $nElements++;
                    
                }
                echo '<ElementsSelected>' . $nElements . '</ElementsSelected>';
                $aSelection[$iValidLayer]["nelements"] = $nElements;
          
                $nTotalElements += $nElements; 
                $iValidLayer++;
                echo '</Layer>';

            } else {
                echo "<Layer />";
            }
        }
        echo '<NumberOfLayers>' . $nActualLayers . '</NumberOfLayers>'; 
        echo '<TotalElementsSelected>' . $nTotalElements . '</TotalElementsSelected>';
        echo '</Selection>';

        
    }
    else
    {
      echo '<Selection>';
      echo '<TotalElementsSelected>0</TotalElementsSelected>';
      echo '</Selection>';
    }
}
catch (MgException $e)
{
  echo "ERROR: " . $e->GetMessage() . "\n";
  echo $e->GetDetails() . "\n";
  echo $e->GetStackTrace() . "\n";
}
exit;

/* return a UTM WKT appropriate for a given lat/lon */
function getUtmWkt($lon, $lat) {
    /** WGS 84 / Auto UTM **/
    $zone = floor( ($lon + 180.0) / 6.0 ) + 1;
    
    //WGS84 AUTO UTM
    $epsg42001 = "PROJCS[\"WGS 84 / Auto UTM\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Decimal_Degree\",0.0174532925199433]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"central_meridian\",%.16f],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",%.16f],UNIT[\"Meter\",1]]";

    //WGS 84 AUTO TRANSVERSE MERCATOR
    $epsg42002 = "PROJCS[\"WGS 84 / Auto Tr. Mercator\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Decimal_Degree\",0.0174532925199433]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"central_meridian\",%.16f],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",%.16f],UNIT[\"Meter\",1]]";
    
    //WGS 84 AUTO ORTHOGRAHPIC
    $epsg42003 = "PROJCS[\"WGS 84 / Auto Orthographic\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Decimal_Degree\",0.0174532925199433]],PROJECTION[\"Orthographic\"],PARAMETER[\"central_meridian\",%.16f],PARAMETER[\"latitude_of_origin\",%.16f],UNIT[\"Meter\",1]]";
    
    //WGS 84 AUTO EQUIRECTANGULAR
    $epsg42004 = "PROJCS[\"WGS 84 / Auto Equirectangular\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Decimal_Degree\",0.0174532925199433]],PROJECTION[\"Equirectangular\"],PARAMETER[\"central_meridian\",0],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"standard_parallel_1\",%.16f],UNIT[\"Meter\",1]]";
    

    //$wkt = sprintf( $epsg42001, -183.0 + $zone * 6.0, ($lat >= 0.0) ? 0.0 : 10000000.0 );
    //$wkt = sprintf( $epsg42002, $lon, ($lat >= 0.0) ? 0.0 : 10000000.0 );
    $wkt = sprintf( $epsg42003, $lon, $lat);
    //$wkt = sprintf( $epsg42004, $lat);
    return $wkt;
}
?>
