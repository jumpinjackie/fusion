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


$extensionDir = getcwd() . "/../../../";
$viewDir = $extensionDir."mapviewerphp/";


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
try
{

    include $viewDir . "common.php";
    include $viewDir . "constants.php";

    MgInitializeWebTier($extensionDir. "webconfig.ini");

    $sessionId = $_REQUEST['session'];
    
    $user = new MgUserInformation($_REQUEST['session']);

    $siteConnection = new MgSiteConnection();
    $siteConnection->Open($user);

    $resourceService = 
      $siteConnection->CreateService(MgServiceType::ResourceService);
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

    $selection = new MgSelection($map);
    $selection->Open($resourceService, $mapname);

    $layers = $selection->GetLayers();
    $nLayers = 0;
    $iValidLayer = 0;
    if ($layers)
    {
        echo '<Selection>';
        $nLayers = $layers->GetCount();
        echo '<NumberOfLayers>' . $nLayers . '</NumberOfLayers>'; 
        $aSelection = array($nLayers);
        
        $oExtents = $selection->GetExtents($featureService);
        $oMin = $oExtents->GetLowerLeftCoordinate();
        $oMax = $oExtents->GetUpperRightCoordinate();
        echo "<minx>".$oMin->GetX()."</minx>";
        echo "<miny>".$oMin->GetY()."</miny>";
        echo "<maxx>".$oMax->GetX()."</maxx>";
        echo "<maxy>".$oMax->GetY()."</maxy>";

        for ($i = 0; $i < $layers->GetCount(); $i++)
        {
            $nTotalElements = 0;
            $layer = $layers->GetItem($i);
            if ($layer)
            {
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
                // Apply the filter to the feature resource for the
                // selected layer. This returns
                // an MgFeatureReader of all the selected features.
                $queryOptions->SetFilter($selectionString);
                $featureReader = $featureService->SelectFeatures($layerFeatureResource, $layerClassName, $queryOptions);

                //??
                //$classdefinition = $featureReader->GetClassDefinition();
          
                
                //TODO : use layer definition to only get properties defined.
                $propCount = $featureReader->GetPropertyCount();
                
                $aSelection[$iValidLayer]["nproperties"] = $propCount;
                $aSelection[$iValidLayer]["properties_name"] = array($propCount);
                $aSelection[$iValidLayer]["properties_type"] = array($propCount);
                $aSelection[$iValidLayer]["elements"] = array();

                echo '<PropertiesNumber>' . $propCount . '</PropertiesNumber>';
                
                for($i=0; $i<$propCount; $i++) 
                {
                     $aSelection[$iValidLayer]["properties_name"][$i] = 
                       $featureReader->GetPropertyName($i);
                     $aSelection[$iValidLayer]["properties_type"][$i] = 
                       $featureReader->GetPropertyType($featureReader->GetPropertyName($i));
                     
                } 
                echo '<PropertiesNames>' . implode(",", $aSelection[$iValidLayer]["properties_name"]) . '</PropertiesNames>';
                echo '<PropertiesTypes>' . implode(",", $aSelection[$iValidLayer]["properties_type"]) . '</PropertiesTypes>';
                
                $nElements = 0;
                while ($featureReader->ReadNext())
                {
                    echo '<ValueCollection>';
                    for($i=0; $i<$propCount; $i++) 
                    {
                        $aSelection[$iValidLayer]["elements"][$nElements][$i] = 
                          GetPropertyValueFromFeatReader($featureReader, 
                                                         $aSelection[$iValidLayer]["properties_type"][$i],
                                                         $aSelection[$iValidLayer]["properties_name"][$i]);
                        echo '<v>' . $aSelection[$iValidLayer]["elements"][$nElements][$i] . '</v>';
                    }
                     echo '</ValueCollection>';
                    $nElements++;
                    
                }
                echo '<ElementsSelected>' . $nElements . '</ElementsSelected>';
                $aSelection[$iValidLayer]["nelements"] = $nElements;
          
                $nTotalElements += $nElements; 
                $iValidLayer++;
                echo '</Layer>';

            }
        }
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

?>
