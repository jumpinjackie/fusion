<?php 
function CreateFeatureSource($map, $dataSourceId, $featureName, $featureService, $geomType) {
    //create feature source
    $classDef = new AwClassDefinition();

    $classDef->SetName($featureName);
    $classDef->SetDescription("Feature class for drawing layer");
    $classDef->SetDefaultGeometryPropertyName("GEOM");

    //Set KEY property
    $prop = new AwDataPropertyDefinition("KEY");
    $prop->SetDataType(AwPropertyType::Int32);
    $prop->SetAutoGeneration(true);
    $prop->SetReadOnly(true);
    $classDef->GetIdentityProperties()->Add($prop);
    $classDef->GetProperties()->Add($prop);

    $prop = new AwGeometricPropertyDefinition("GEOM");
    //$prop->SetGeometryTypes(AwFeatureGeometricType::mfgtSurface); //TODO use the constant when exposed
    $prop->SetGeometryTypes($geomType);
    $classDef->GetProperties()->Add($prop);

    //Create the schema
    $schema = new AwFeatureSchema("DrawToolSchema", "Temporary draw layer schema");
    $schema->GetClasses()->Add($classDef);

    //finally, creation of the feature source
    $params = new AwCreateSdfParams("LatLong", GetMapSRS($map), $schema);
    $featureService->CreateFeatureSource($dataSourceId, $params);
}

function GetMapSrs($map)
{
    $srs = $map->GetMapSRS();
    if($srs != "")
       return $srs;
       
    //SRS is currently optional. Waiting for this to change, set the default SRS to ArbitrayXY meters
    //
    return "LOCALCS[\"*XY-MT*\",LOCAL_DATUM[\"*X-Y*\",10000],UNIT[\"Meter\", 1],AXIS[\"X\",EAST],AXIS[\"Y\",NORTH]]";
}

function BuildLayerDefinitionContent($dataSource, $featureName, $tip)
{
    $xmlLineTemplate = '<?xml version="1.0" encoding="UTF-8"?>
      <LayerDefinition version="1.0.0">
        <FeatureLayerDefinition>
          <Metadata />
          <LegendBitmap/>
          <ResourceId>%s</ResourceId>
          <FeatureClass>%s</FeatureClass>
          <Key/>
          <Geometry>%s</Geometry>
          <MapTip>%s</MapTip>
          <Filter></Filter>
          <FeatureScaleRange>
            <MinScale>0</MinScale>
            <MaxScale>1000000000000</MaxScale>
            <LineTypeStyle>
              <FeatureClassName>Line</FeatureClassName>
              <LineRule>
                <LineSymbolization>
                  <Stroke>
                    <LineStyle>Solid</LineStyle>
                    <Thickness>%s</Thickness>
                    <Color>%s</Color>
                    <Unit>Points</Unit>
                  </Stroke>
                </LineSymbolization>
                <LegendLabel/>
                <LegendBitmap/>
                <Filter/>
                <Label/>
              </LineRule>
            </LineTypeStyle>
          </FeatureScaleRange>
        </FeatureLayerDefinition>
      </LayerDefinition>
    ';

    $layerTempl = $xmlLineTemplate;
    $xmlStr = sprintf($layerTempl, 
                      $dataSource, 
                      $featureName, 
                      "GEOM", 
                      $tip, 
                      1, 
                      "ff0000");
    $src = new AwByteSource($xmlStr, strlen($xmlStr));
    return $src->GetReader();
}

function DataSourceExists($resourceSrvc, $dataSourceId)
{
    try
    {
        $cnt = $resourceSrvc->GetResourceContent($dataSourceId);
        return true;
    }
    catch(AwResourceNotFoundException $rnfe)
    {
        return false;
    }
}

function FindLayer($layers, $layerDef)
{
    $layer = null;
    for($i = 0; $i < $layers->GetCount(); $i++)
    {
        $layer1 = $layers->GetItem($i);
        if($layer1->GetLayerDefinition()->ToString() == $layerDef)
        {
            $layer = $layer1;
            break;
        }
    }
    return $layer;
}

function add_layer_resource_to_map($layerResourceID,
     $resourceService,
     $layerDef,
     $layerLegendLabel,
     &$map) 
     //Addsalayerdefition(whichcanbestoredeitherinthe 
         //Libraryorasessionrepository)tothemap. 
         //Returnsthelayer. 
{ 
    $newLayer = new AwLayer($layerResourceID, $resourceService); 
    //Addthenewlayertothemap'slayercollection 
    $newLayer->SetName($layerLegendLabel); 
    $newLayer->SetVisible(true); 
    $newLayer->SetLegendLabel($layerLegendLabel); 
    $newLayer->SetDisplayInLegend(true); 
    $layerCollection=$map->GetLayers();
    if(!FindLayer($layerCollection,$layerDef)) 
    { 
        //Insertthenewlayeratposition0soitisat 
        //thetopofthedrawingorder 
        $layerCollection->Insert(0,$newLayer); 
    } 
    return $newLayer; 
}

?>