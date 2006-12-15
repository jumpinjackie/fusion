<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: get map initial information
 *
 * Project: Fusion
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
    $featureService = $siteConnection->CreateService(MgServiceType::FeatureService);

    // Get a runtime map from a map definition
    if (isset($_REQUEST['mapid']))
    {
        $mapid = $_REQUEST['mapid'];
        //echo $mapid;
        $resourceID = new  MgResourceIdentifier($mapid);
        $map = new MgMap();
        $mapName = $resourceID->GetName();

        //echo "<br> maname $mapName <br>";

        $map->Create($resourceService, $resourceID, $mapName);


        $mapStateId = new MgResourceIdentifier("Session:" . $sessionID . "//" . $map->GetName() . "." . MgResourceType::Map);


        //create an empty selection object and store it in the session repository
        $sel = new MgSelection($map);
        $sel->Save($resourceService, $mapName);


        $map->Save($resourceService, $mapStateId);
    } else {
        $map = new MgMap();
        $map->Open($resourceService, $mapName);
        $mapid = $map->GetMapDefinition()->ToString();
    }

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


    header('Content-type: text/x-json');
    header('X-JSON: true');
    echo "{";
    echo "sessionId:'$sessionID',";
    echo "mapId:'$mapid',";
    echo "metersPerUnit:$metersPerUnit,";
    echo "mapName:'".addslashes(htmlentities($mapName))."',";
    echo "extent:[";
    echo $oMin->GetX().",";
    echo $oMin->GetY().",";
    echo $oMax->GetX().",";
    echo $oMax->GetY()."],";
    
    $layers=$map->GetLayers();
    
    echo "layers:[";
    $layerSep = '';
    for($i=0;$i<$layers->GetCount();$i++) 
    { 
        $layer=$layers->GetItem($i);
        $mappings = GetLayerPropertyMappings($resourceService, $layer);
        if (!isset($_SESSION['property_mappings'])) {
            $_SESSION['property_mappings'] = array();
        }
        $_SESSION['property_mappings'][$layer->GetObjectId()] = $mappings;
        $layerDefinition = $layer->GetLayerDefinition();
        $aLayerTypes = GetLayerTypes($featureService, $layer);
        //echo '<pre>'; print_r($aLayerTypes); echo '</pre>'; exit; 
        
        echo $layerSep.'{';
        echo "propertyMappings:{";
        $sep = '';
        foreach($mappings as $name => $value) {
            echo $sep."$name:'$value'";
            $sep = ',';
        }
        echo "},";
        echo "uniqueId:'".$layer->GetObjectId()."',";
        echo "layerName:'".addslashes(htmlentities($layer->GetName()))."',";
        echo 'layerTypes:[';
        $sep = '';
        for ( $j=0; $j < count($aLayerTypes); $j++ )
        { 
            echo $sep . $aLayerTypes[$j];
            $sep = ',';
        }
        echo '],';
        echo "displayInLegend:".BooleanToString($layer->GetDisplayInLegend()).",";
        echo "expandInLegend:".BooleanToString($layer->GetExpandInLegend()).",";
        echo "resourceId:'".$layerDefinition->ToString()."',";
        echo "parentGroup:";
        echo $layer->GetGroup() ? "'".$layer->GetGroup()->GetObjectId()."'," : 'null,';
        echo "legendLabel:'".addslashes(htmlentities($layer->GetLegendLabel()))."',";
        echo "selectable:".BooleanToString($layer->GetSelectable()).",";
        echo "visible:".BooleanToString($layer->GetVisible()).",";
        echo "actuallyVisible:".BooleanToString($layer->isVisible()).",";
        echo "editable:true,";
        buildScaleRanges($layer);
        echo '}';
        $layerSep = ',';
    } 
    echo "],"; 

    //Get layer groups as xml
    $groups = $map->GetLayerGroups();
    echo "groups:["; 
    $groupSep = '';
    for($i=0;$i<$groups->GetCount();$i++) 
    { 
        $group=$groups->GetItem($i);
        $layerDefinition = $layer->GetLayerDefinition();
        echo $groupSep.'{';
        echo "groupName:'".addslashes(htmlentities($group->GetName()))."',";
        echo "legendLabel:'".addslashes(htmlentities($group->GetLegendLabel()))."',";
        echo "uniqueId:'".$group->GetObjectId()."',";
        echo "displayInLegend:".BooleanToString($group->GetDisplayInLegend()).",";
        echo "expandInLegend:".BooleanToString($group->GetExpandInLegend()).",";
        echo "layerGroupType:'".$group->GetLayerGroupType()."',";
        $parent = $group->GetGroup();
        echo "parentUniqueId:";
        echo $parent != null ? "'".$parent->GetObjectId()."," : "null,";
        echo "visible:".BooleanToString($group->GetVisible()).",";
        echo "actuallyVisible:".BooleanToString($group->isVisible());
        echo '}';
        $groupSep = ',';
    } 
    echo"]"; 
    
    echo "}";
}
catch (MgException $e)
{
  echo "ERROR: " . $e->GetMessage() . "\n";
  echo $e->GetDetails() . "\n";
  echo $e->GetStackTrace() . "\n";
}
exit;

function buildScaleRanges($layer) {
    global $resourceService;
    $resID = $layer->GetLayerDefinition();
    $layerContent = $resourceService->GetResourceContent($resID);

    $xmldoc = DOMDocument::loadXML(ByteReaderToString($layerContent));
    $type = 0;
    $scaleRanges = $xmldoc->getElementsByTagName('VectorScaleRange');
    if($scaleRanges->length == 0) {
        $scaleRanges = $xmldoc->getElementsByTagName('GridScaleRange');
        if($scaleRanges->length == 0) {
            $scaleRanges = $xmldoc->getElementsByTagName('DrawingLayerDefinition');
            if($scaleRanges->length == 0)
                return;
            $type = 2;
        }
        else
            $type = 1;
    }
    $typeStyles = array("PointTypeStyle", "LineTypeStyle", "AreaTypeStyle");
    $ruleNames = array("PointRule", "LineRule", "AreaRule", );
    $output = 'scaleRanges: [';
    $scaleSep = '';
    for($sc = 0; $sc < $scaleRanges->length; $sc++)
    {
        $scaleRange = $scaleRanges->item($sc);
        $minElt = $scaleRange->getElementsByTagName('MinScale');
        $maxElt = $scaleRange->getElementsByTagName('MaxScale');
        $minScale = "0";
        $maxScale = "1000000000000.0";  // as MDF's VectorScaleRange::MAX_MAP_SCALE
        if($minElt->length > 0)
            $minScale = $minElt->item(0)->nodeValue;
        if($maxElt->length > 0)
            $maxScale = $maxElt->item(0)->nodeValue;

        if($type != 0)
            break;
        $output .= $scaleSep."{";
        $output .= "minScale:".$minScale.",";
        $output .= "maxScale:".$maxScale.",";
        $output .= 'styles:[';
        $styleIndex = 0;
        $styleSep = '';
        for($ts=0, $count = count($typeStyles); $ts < $count; $ts++)
        {
            $typeStyle = $scaleRange->getElementsByTagName($typeStyles[$ts]);
            $catIndex = 0;
            for($st = 0; $st < $typeStyle->length; $st++) {
                $rules = $typeStyle->item(0)->getElementsByTagName($ruleNames[$ts]);
                for($r = 0; $r < $rules->length; $r++) {
                    $rule = $rules->item($r);
                    $label = $rule->getElementsByTagName("LegendLabel");
                    $filter = $rule->getElementsByTagName("Filter");

                    $labelText = $label->length==1? $label->item(0)->nodeValue: "";
                    $filterText = $filter->length==1? $filter->item(0)->nodeValue: "";
                    $output .= $styleSep."{";
                    $output .= "legendLabel:'".addslashes(htmlentities(trim($labelText)))."',";
                    $output .= "filter:'".addslashes(htmlentities(trim($filterText)))."',";
                    $output .= "geometryType:".($ts+1).",";
                    $output .= "categoryIndex:".($catIndex++);
                    $output .= '}';
                    $styleSep = ',';
                }
            }
        }
        $output .= ']}';
        $scaleSep = ',';
    }
    $output .= '],';
    echo $output;
}

function ByteReaderToString($byteReader)
{
    $buffer = '';
    do
    {
        $data = str_pad("\0", 50000, "\0");
        $len = $byteReader->Read($data, 50000);
        if ($len > 0)
        {
            $buffer = $buffer . substr($data, 0, $len);
        }
    } while ($len > 0);

    return $buffer;
}

// Converts a boolean to "yes" or "no"
// --from MG Web Tier API Reference
function BooleanToString($boolean)
{
    if (is_bool($boolean))
        return ($boolean ? "true" : "false");
    else
        return "'ERROR in BooleanToString.'";
}

//-----------------------------------------------------------------
//function GetFeatureClassAndSchema
//@param MgFeatureService featureService
//@param MgResourceIdentifier dataSourceId
//@param MgLayer layer
//@return the classdefinition reference.
//
//@desc Get class definition and schema from the layer.
//@desc This works around changes between MG 1.0.1 and 1.0.2
//@desc described in MG341 (see mapguide.osego.org)
//@desc This function can be removed when all servers are updated.
//------------------------------------------------------------------
function GetFeatureClassDefinition($featureService, $layer, $dataSourceId){

    $qualifiedClass = $layer->GetFeatureClassName();
    if (strpos($qualifiedClass, ':') === false ) {
        $class = $qualifiedClass;
        $schema = $featureService->GetSchemas($dataSourceId)->GetItem(0);
    } else {
        list($schema, $class) = explode(':', $qualifiedClass);
    }
    return $featureService->GetClassDefinition($dataSourceId, $schema, $class);
}

//-----------------------------------------------------------------
//function GetLayerTypes
//@param MgFeatureService featureService
//@param MgLayer layer
//@return the layer types as an array.
//
//@desc utility function to determine the set of allowed feature types for a layer's
//@desc feature source.
//@desc N.B. this is a workaround because the MgLayer::GetLayerType function seems to
//@desc produce the same answer (1) for all layer types.
//------------------------------------------------------------------
function GetLayerTypes($featureService, $layer) {

    $dataSourceId = new MgResourceIdentifier($layer->GetFeatureSourceId());
    
    //get class definition from the featureSource
    $classDefinition = GetFeatureClassDefinition($featureService, $layer, $dataSourceId);

    //MgPropertyDefinition classProps
    $classProps = $classDefinition->GetProperties();
    $aLayerTypes = array();
    for ($i=0; $i< $classProps->GetCount(); $i++)
    {
        $prop = $classProps->GetItem($i);
        if ($prop->GetPropertyType() == MgFeaturePropertyType::GeometricProperty) {
            $featureClass = $prop->GetGeometryTypes();
            if ($featureClass & MgFeatureGeometricType::Surface) {
                array_push($aLayerTypes, '2'/*'surface'*/);
            }
            if ($featureClass & MgFeatureGeometricType::Curve) {
                array_push($aLayerTypes, '1'/*'curve'*/);
            }
            if ($featureClass & MgFeatureGeometricType::Solid) {
                array_push($aLayerTypes, '3'/*'solid'*/); //could use surface here for editing purposes?
            }
            if ($featureClass & MgFeatureGeometricType::Point){
                array_push($aLayerTypes, '0'/*'point'*/);
            }
            break;
        }
    }
    return $aLayerTypes;
}

function GetLayerPropertyMappings($resourceService, $layer) {
    $mappings = array();
    $byteReader = $resourceService->GetResourceContent($layer->GetLayerDefinition());
    $xmldoc = DOMDocument::loadXML(ByteReaderToString($byteReader));
    $mappingNodeList = $xmldoc->getElementsByTagName('PropertyMapping');
    for ($i=0; $i<$mappingNodeList->length; $i++) {
        $mapping = $mappingNodeList->item($i);
        $nameElt = $mapping->getElementsByTagName('Name');
        $name = $nameElt->item(0)->nodeValue;
        $valueElt = $mapping->getElementsByTagName('Value');
        $value = $valueElt->item(0)->nodeValue;
        $mappings[$name] = $value;
    }
    return $mappings;
}
?>