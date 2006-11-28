<?php
include ('MGCommon.php');
include ('MGUtilities.php');

try {

    /* */
    header('content-type: text/xml');
    if (!isset($_REQUEST['session']) || 
        !isset($_REQUEST['mapname']) ||
        !isset($_REQUEST['layer']) || 
        !isset($_REQUEST['fillcolor']) ||
        !isset($_REQUEST['bordercolor']) ||
        !isset($_REQUEST['distance'])) {
        echo "<Error>Arguments missing </Error>";
        exit;
    }

    $layerName = $_REQUEST['layer'];
    $distance = $_REQUEST['distance'];
    $fillColor = $_REQUEST['fillcolor'];
    $borderColor = $_REQUEST['bordercolor'];

    $schemaName = 'Buffer';

    $map = new MgMap();
    $map->Open($resourceService, $mapName);

    /* Get the map SRS - we use this to convert distances */
    $srsFactory = new MgCoordinateSystemFactory();
    //safely get an SRS ... (in MGUtilities)
    $srsDefMap = GetMapSRS($map);
    $mapSrsUnits = "";
    $srsMap = $srsFactory->Create($srsDefMap);
    $arbitraryMapSrs = ($srsMap->GetType() == MgCoordinateSystemType::Arbitrary);
    if($arbitraryMapSrs)
        $mapSrsUnits = $srsMap->GetUnits();

    $featureService = $siteConnection->CreateService(MgServiceType::FeatureService);
    $agfRW = new MgAgfReaderWriter();

    $layers = $map->GetLayers();
    try {
        $layer = $layers->GetItem($layerName);
        $layerId = $layer->GetLayerDefinition();
        $featureSourceName = $layer->GetFeatureSourceId();
        $featureSourceId = new MgResourceIdentifier($featureSourceName);
    } catch (MgObjectNotFoundException $nfe) {
        $featureSourceName = "Session:".$sessionID."//".$layerName.".FeatureSource";
        //$featureSourceName = "Library:"."//".$layerName.".FeatureSource";
        $featureSourceId = new MgResourceIdentifier($featureSourceName);
        CreateFeatureSource($map, $featureSourceId, $layerName, $featureService, 
                            MgFeatureGeometricType::Surface, $schemaName);

        //create the output layer definition of poylgon type
        $layerDefinition = "Session:".$sessionID."//". $layerName.".LayerDefinition";
        //$layerDefinition = "Library:"."//". $layerName.".LayerDefinition";
        $layerId = new MgResourceIdentifier($layerDefinition);
        $layerContent = '<?xml version="1.0" encoding="UTF-8"?>
            <LayerDefinition version="1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xsi:noNamespaceSchemaLocation="LayerDefinition-1.0.0.xsd">
            <VectorLayerDefinition>
              <ResourceId>%s</ResourceId>
              <FeatureName>%s:%s</FeatureName>
              <FeatureNameType>FeatureClass</FeatureNameType>
              <Geometry>GEOM</Geometry>
              <VectorScaleRange>
                <AreaTypeStyle>
                  <AreaRule>
                    <LegendLabel/>
                    <AreaSymbolization2D>
                      <Fill>
                        <FillPattern>Solid</FillPattern>
                        <ForegroundColor>%s</ForegroundColor>
                        <BackgroundColor>FF000000</BackgroundColor>
                      </Fill>
                      <Stroke>
                        <LineStyle>Solid</LineStyle>
                        <Thickness>0</Thickness>
                        <Color>%s</Color>
                        <Unit>Points</Unit>
                      </Stroke>
                    </AreaSymbolization2D>
                  </AreaRule>
                </AreaTypeStyle>
              </VectorScaleRange>
            </VectorLayerDefinition>
            </LayerDefinition>
            ';
        $layerContent = sprintf($layerContent,
                            $featureSourceName,
                            $schemaName,
                            $layerName,
                            $fillColor,
                            $borderColor);
        $oByteSource = new MGByteSource($layerContent, strlen($layerContent));
        $resourceService->SetResource($layerId, $oByteSource->GetReader(), null);

        $layer = new MGLayer($layerId, $resourceService);
        $layer->SetName($layerName);
        $layer->SetLegendLabel($layerName);
        $layer->SetDisplayInLegend(true);
        $layer->SetSelectable(true);
        $layers->Insert(0, $layer);
    }
    
    //loop through the selection of the input layer. If no selection, select all features
    $queryOptions = new MgFeatureQueryOptions();  
    $selection = new MgSelection($map);
    $selection->Open($resourceService, $mapName);
    $selLayers = $selection->GetLayers();
        
    
    $nCount = $selLayers->GetCount();
    for ($i=0; $i<$nCount; $i++) {
        $selLayer = $selLayers->GetItem($i);
        $featureClassName = $selLayer->GetFeatureClassName();
        $filter = $selection->GenerateFilter($selLayer, $featureClassName);
        if ($filter == '') {
            continue;
        }
        $queryOptions->SetFilter($filter);
        $featureSource = new MgResourceIdentifier($selLayer->GetFeatureSourceId());
        $featureReader = $featureService->SelectFeatures($featureSource, $featureClassName, $queryOptions);
        
        $oCommandsColl = new MgFeatureCommandCollection();

        $classDef = $featureReader->GetClassDefinition();
        $geomPropName = $classDef->GetDefaultGeometryPropertyName();
        
        /* figure out the layer SRS - taken from buffer.php in
         * original mapguide ajax viewer
         *
         * The layer may be excluded if it doesn't meet some specific
         * needs ... commented inline below
         */
        
        $spatialContext = $featureService->GetSpatialContexts($featureSource, true);
        $layerSrsWkt = "";
        if($spatialContext != null) {
            $spatialContext->ReadNext();
            $layerSrsWkt = $spatialContext->GetCoordinateSystemWkt();
            /* skip this layer if the srs is empty */
            if($layerSrsWkt == "") {
                $excludedLayers ++;
                continue;
            }
        } else {
            /* skip this layer if there is no spatial context at all */
            $excludedLayers ++;
            continue;
        }
        
        /* create a coordinate system from the layer's SRS wkt */
        $layerCs = $srsFactory->Create($layerSrsWkt);
        $arbitraryDsSrs = ($layerCs->GetType() == MgCoordinateSystemType::Arbitrary);
        $dsSrsUnits = "";

        if($arbitraryDsSrs) {
            $dsSrsUnits = $srsDs->GetUnits();
        }
        // exclude layer if:
        //  the map is non-arbitrary and the layer is arbitrary or vice-versa
        //     or
        //  layer and map are both arbitrary but have different units
        //
        if(($arbitraryDsSrs != $arbitraryMapSrs) || ($arbitraryDsSrs && ($dsSrsUnits != $mapSrsUnits)))
        {
            $excludedLayers ++;
            continue;
        }

        // calculate distance in the data source SRS units
        //
        $dist = $layerCs->ConvertMetersToCoordinateSystemUnits($distance);

        // calculate great circle unless data source srs is arbitrary
        if(!$arbitraryDsSrs)
            $measure = new MgCoordinateSystemMeasure($layerCs);
        else
            $measure = null;

        // create a SRS transformer if necessary.
        if($srsDefDs != $srsDefMap)
            $srsXform = new MgCoordinateSystemTransform($layerCs, $srsMap);
        else
            $srsXform = null;

        while ($featureReader->ReadNext()) {
            $oGeomAgf = $featureReader->GetGeometry($geomPropName);
            $oGeom = $agfRW->Read($oGeomAgf);
            /* use measure to accomodate differences in SRS */
            $oNewGeom = $oGeom->Buffer($dist, $measure);

            $geomProp = new MgGeometryProperty("GEOM", $agfRW->Write($oNewGeom));
            $oPropertyColl = new MgPropertyCollection();

            $oPropertyColl->Add($geomProp);
            $oCommandsColl->Add(new MgInsertFeatures($schemaName.':'.$layerName, $oPropertyColl));
        }
        $featureReader->Close();
        $result = $featureService->UpdateFeatures($featureSourceId, $oCommandsColl, false);
    }
    $layer->ForceRefresh();
    $map->Save($resourceService);
    echo "<Buffer>";
    echo "<Layer>".$layerId->ToString();
    echo "</Layer>";
    echo "</Buffer>";
} catch (MgException $e) {
    echo "last error";
    echo "ERROR: " . $e->GetMessage() . "\n";
    echo $e->GetDetails() . "\n";
    echo $e->GetStackTrace() . "\n";
}



