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
        !isset($_REQUEST['distance']) ||
        !isset($_REQUEST['distanceunits'])) {
        echo "<Error>Arguments missing </Error>";
        exit;
    }

    $layerName = $_REQUEST['layer'];
    $distance = $_REQUEST['distance'];
    $distanceUnits = $_REQUEST['distanceunits'];
    $fillColor = $_REQUEST['fillcolor'];
    $borderColor = $_REQUEST['bordercolor'];


    $schemaName = 'Buffer';

    $map = new MgMap();
    $map->Open($resourceService, $mapName);

    $featureService = $siteConnection->CreateService(MgServiceType::FeatureService);
    $agfRW = new MgAgfReaderWriter();

    $layers = $map->GetLayers();
    try {
        $layer = $layers->GetItem($layerName);
        $layerId = $layer->GetLayerDefinition();
        $featureSourceName = $layer->GetFeatureSourceId();
        $featureSourceId = new MgResourceIdentifier($featureSourceName);
    } catch (MgObjectNotFoundException $nfe) {
        //$featureSourceName = "Session:".$sessionID."//".$layerName.".FeatureSource";
        $featureSourceName = "Library:"."//".$layerName.".FeatureSource";
        $featureSourceId = new MgResourceIdentifier($featureSourceName);
        CreateFeatureSource($map, $featureSourceId, $layerName, $featureService, 
                            MgFeatureGeometricType::Surface, $schemaName);

        //create the output layer definition of poylgon type
        //$layerDefinition = "Session:".$sessionID."//". $layerName.".LayerDefinition";
        $layerDefinition = "Library:"."//". $layerName.".LayerDefinition";
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
        echo $featureClassName;
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

        while ($featureReader->ReadNext()) {
            $oGeomagf = $featureReader->GetGeometry($geomPropName);
            $oGeom = $agfRW->Read($oGeomagf);
            $oNewgeom = $oGeom->Buffer($distance, null);

            $geomProp = new MgGeometryProperty("GEOM", $agfRW->Write($oNewgeom));
            $oPropertyColl = new MgPropertyCollection();

            $oPropertyColl->Add($geomProp);
            $oCommandsColl->Add(new MgInsertFeatures($schemaName.':'.$layerName, $oPropertyColl));
        }
        $featureReader->Close();
        $result = $featureService->UpdateFeatures($featureSourceId, $oCommandsColl, false);
        echo $result->GetItem(0)->GetValue();
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



