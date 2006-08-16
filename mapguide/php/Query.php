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

    /* the name of the layer in the map to query */
    $layer = $_REQUEST['layer'];

    /* a filter expression to apply, in the form of an FDO SQL statement */
    $filter = isset($_REQUEST['filter']) ? html_entity_decode(urldecode($_REQUEST['filter'])) : false;
    //echo "filter: $filter<BR>";
    /* a spatial filter in the form on a WKT geometry */
    $spatialFilter = (isset($_REQUEST['spatialfilter']) && $_REQUEST['spatialfilter'] != '') ? urldecode($_REQUEST['spatialfilter']) : false;
    //echo "spatial filter is $spatialFilter<BR>";
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
    $class = $layerObj->GetFeatureClassName();
    //echo "feature class is $class<BR>";
    
    /* add the attribute query if provided */
    $queryOptions = new MgFeatureQueryOptions();
    if ($filter !== false) {
        //echo 'setting filter<BR>';
        $queryOptions->SetFilter($filter);
    }

    /* add the spatial filter if provided.  It is expected to come as a
       WKT string, so we need to convert it to an MgGeometry */
    if ($spatialFilter !== false ) {
        //echo 'setting spatial filter<br>';
        $wktRW = new MgWktReaderWriter();
        $geom = $wktRW->Read($spatialFilter);
        $queryOptions->SetSpatialFilter($featureGeometryName, $geom, MgFeatureSpatialOperations::Inside);
    }

    /* select the features */
    $featureReader = $featureService->SelectFeatures($featureResId, $class, $queryOptions);

    /* add the features to the map selection and save it*/
    $selection = new MgSelection($map);
    $selection->AddFeatures($layerObj, $featureReader, 0);
    $selection->Save($resourceService, $mapName);
    
    header( 'Content-type: text/xml');
    $layers = $selection->GetLayers();
    
    if ($layers && $layers->GetCount() >= 0) {
        echo '<Selection>true</Selection>';
    } else {
        echo '<Selection>false</Selection>';
    }
} 
catch (MgException $e)
{
  echo "ERROR: " . $e->GetMessage() . "\n";
  echo $e->GetDetails() . "\n";
  echo $e->GetStackTrace() . "\n";
}
?>