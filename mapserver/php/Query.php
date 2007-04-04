<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: create a new selection based on one or more attribute filters and
 *          a spatial filter
 *
 * Project: Fusion MapServer
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2006, DM Solutions Group Inc.
 *
 *****************************************************************************/

/* set up the session */
include ("Common.php");
include ("Utilities.php");

/* the name of the layer in the map to query */
if ($_REQUEST['layers'] != '') {
    $layers = explode(',',$_REQUEST['layers']);
} else {
    $layers = array();
}

echo "<!--";
print_r($_REQUEST);
echo "-->";

/* selection variant if set */
$variant = 'intersects';
if (isset($_REQUEST['variant'])) {
    if (strcasecmp($_REQUEST['variant'],'contains') == 0) {
        $variant = 'contains';
    } else if (strcasecmp($_REQUEST['variant'],'inside') == 0) {
        $variant = 'inside';
    }
}
/* a filter expression to apply, in the form of an FDO SQL statement */
$filter = isset($_REQUEST['filter']) ? str_replace(array('*', '"'), array('%', "'"),html_entity_decode(urldecode( $_REQUEST['filter']))) : false;
echo "<!-- filter: $filter -->\n";
/* a spatial filter in the form on a WKT geometry */
$spatialFilter = (isset($_REQUEST['spatialfilter']) && $_REQUEST['spatialfilter'] != '') ? urldecode($_REQUEST['spatialfilter']) : false;
//echo "spatial filter is $spatialFilter<BR>";

if (!isset($mapName)) {
    die('mapname not set');
}
if (isset($_SESSION['maps']) && isset($_SESSION['maps'][$mapName])) {
    $oMap = ms_newMapObj($_SESSION['maps'][$mapName]);
}

/* add the spatial filter if provided.  It is expected to come as a
   WKT string, so we need to convert it to a shape */
if ($spatialFilter !== false ) {
    $oSpatialFilter = ms_shapeObjFromWkt($spatialFilter);
}

/* if extending the current selection */
$bExtendSelection = isset($_REQUEST['extendselection']) && strcasecmp($_REQUEST['extendselection'], 'true') == 0;
if ($bExtendSelection) {
    //TODO figure out how to load an existing selection here
    $oMap->loadquery(getSessionSavePath()."query.qry");
}

$bAllLayers = false;
$nLayers = count($layers);
$nSelections = 0;
if ($nLayers == 0) {
    $nLayers = $oMap->numlayers;
    $bAllLayers = true;
}
for ($i=0; $i<$nLayers; $i++) {
    if (!$bAllLayers) {
        $oLayer = $oMap->GetLayerByName($layers[$i]);
    } else {
        $layerObj = $oMap->GetLayer($i);
    }
        
    if (@$oLayer->queryByShape($oSpatialFilter) == MS_SUCCESS) {
        $nSelections++;
    }


    if ($bExtendSelection) {
    } else {
    }
}
if ($bExtendSelection) {
}

header( 'Content-type: text/xml');
if ($nSelections > 0) {
    $oMap->savequery(getSessionSavePath()."query.qry");
    SaveQuery($oMap, getSessionSavePath()."query2.qry");
    echo "<SelectionResult>";
    echo '<Selection>true</Selection>';
    echo '<QueryFile>'.getSessionSavePath()."query.qry"."</QueryFile>";
    //TODO: dump out the extents of the selection
    echo "</SelectionResult>";
} else {
    echo "<SelectionResult>";
    echo '<Selection>false</Selection>';
    echo "</SelectionResult>";
}


?>
