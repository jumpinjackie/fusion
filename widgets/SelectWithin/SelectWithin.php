<?php

//
//  Copyright (C) 2004-2007 by Autodesk, Inc.
//
//  This library is free software; you can redistribute it and/or
//  modify it under the terms of version 2.1 of the GNU Lesser
//  General Public License as published by the Free Software Foundation.
//
//  This library is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//  Lesser General Public License for more details.
//
//  You should have received a copy of the GNU Lesser General Public
//  License along with this library; if not, write to the Free Software
//  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
//

  $fusionMGpath = '../../MapGuide/php/';
  include $fusionMGpath . 'Common.php';

  $mapName = "";
  $sessionId = "";
  $layers = null;
  $queryInfo = false;   //seemed to be always set to true in MG version

  GetRequestParameters();

  try {
    $featureSrvc = $siteConnection->CreateService(MgServiceType::FeatureService);
    $renderingSrvc = $siteConnection->CreateService(MgServiceType::RenderingService);

    //load the map runtime state
    $map = new MgMap();
    $map->Open($resourceService, $mapName);

    $layers = explode(",", $layers);
    if (count($layers) > 0) {

      $layerNames = new MgStringCollection();
      for ($i = 0; $i < count($layers); $i++)
        $layerNames->Add($layers[$i]);

      // create a multi-polygon or a multi-geometry containing the input selected features
      $inputGeom = MultiGeometryFromSelection($featureSrvc, $resourceService, $map, $mapName);
      if ($inputGeom) {
        // Query all the features belonging the the layer list that intersects with the input geometries
        $fi = $renderingSrvc->QueryFeatures($map, $layerNames, $inputGeom, MgFeatureSpatialOperations::Intersects, -1);
        if ($fi) {
          $resultSel = $fi->GetSelection();
          if( $resultSel) {

            //this block comes from setSelection
            $resultSel->Save($resourceService, $mapName);
            if ($queryInfo) {
              //Query feature info for the feature in the selection set. This will return the current set
              //along with property info
              //There must be only one feature in the feature set
              $layers = $resultSel->GetLayers();
              if($layers == null || $layers->GetCount() != 1) {
                echo "Error: There must be exactly one feature in the set."; ///NOXLATE dbg report only
                return;
              }
              $layer = $layers->GetItem(0);
              $featureClassName = $layer->GetFeatureClassName();
              $filter = $resultSel->GenerateFilter($layer, $featureClassName);
              $featureSrvc = $siteConnection->CreateService(MgServiceType::FeatureService);
              $query = new MgFeatureQueryOptions();
              $query->SetFilter($filter);
              $featureSource = new MgResourceIdentifier($layer->GetFeatureSourceId());
              $features = $featureSrvc->SelectFeatures($featureSource, $featureClassName, $query);
              $featCount = 0;
              while($features->ReadNext()) {
                if($featCount++ == 1)
                break;
              }
              if($featCount != 1) {
                echo "Error: There must be exactly one feature in the set."; ///NOXLATE dbg report only
                return;
              }
              $renderingSrvc = $siteConnection->CreateService(MgServiceType::RenderingService);
              $layerNames = new MgStringCollection();
              $layerNames->Add($layer->GetName());
              $featInfo = $renderingSrvc->QueryFeatures($map, $layerNames, NULL, MgFeatureSpatialOperations::Intersects, $selText, 1, 2);
              header('Content-Type: text/xml; charset: UTF-8');
              echo $featInfo->ToXml()->ToString();
            } else {
              header("Content-type: text/xml");
              echo $resultSel->ToXml();
            }
          }
        }
      }
    }
  } catch(MgException $e) {
    echo "\nException: " . $e->GetDetails();
    return;
  } catch(Exception $ne) {
    return;
  }

function MultiGeometryFromSelection($featureSrvc, $resourceSrvc, $map, $mapName)
{
    $sel = new MgSelection($map);
    $sel->Open($resourceSrvc, $mapName);
    $selLayers = $sel->GetLayers();
    $geomColl = new MgGeometryCollection();
    $agfRW = new MgAgfReaderWriter();
    $polyOnly = true;

    for($i = 0; $i < $selLayers->GetCount(); $i++)
    {
        $layer = $selLayers->GetItem($i);
        $filter = $sel->GenerateFilter($layer, $layer->GetFeatureClassName());
        $query = new MgFeatureQueryOptions();
        $query->SetFilter($filter);
        $featureSource = new MgResourceIdentifier($layer->GetFeatureSourceId());
        $features = $featureSrvc->SelectFeatures($featureSource, $layer->GetFeatureClassName(), $query);
        if($features)
        {
            $classDef = $features->GetClassDefinition();
            $geomPropName = $classDef->GetDefaultGeometryPropertyName();
            $j = 0;
            $isPoly = true;
            while($features->ReadNext())
            {
                $geomReader = $features->GetGeometry($geomPropName);
                $geom = $agfRW->Read($geomReader);
                if($j ++ == 0)
                {
                    $type = $geom->GetGeometryType();
                    if($type == MgGeometryType::MultiPolygon || $type == MgGeometryType::CurvePolygon || $type == MgGeometryType::MultiCurvePolygon)
                    {
                        $isPoly = false;
                        $polyOnly = false;
                    }
                    else if($type != MgGeometryType::Polygon)
                        break;
                }
                $geomColl->Add($geom);
            }
        }
    }
    if($geomColl->GetCount() == 0)
        return null;

    $gf = new MgGeometryFactory();
    if($polyOnly)
    {
        $polyColl = new MgPolygonCollection();
        for($i = 0; $i < $geomColl->GetCount(); $i++)
            $polyColl->Add($geomColl->GetItem($i));
        return $gf->CreateMultiPolygon($polyColl);
    }
    else
        return $gf->CreateMultiGeometry($geomColl);
}

function GetParameters($params)
{
    global $layers, $mapName, $sessionId, $queryInfo;

    $mapName = $params['mapname'];
    $sessionId = $params['session'];
    $layers = $params['layers'];
    if(isset($params['queryinfo']))
        $queryInfo = $params['queryinfo'] == "1";
}

function GetRequestParameters()
{
    if($_SERVER['REQUEST_METHOD'] == "POST")
        GetParameters($_POST);
    else
        GetParameters($_GET);
}
?>
