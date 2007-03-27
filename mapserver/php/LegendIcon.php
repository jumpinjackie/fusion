<?php
/*****************************************************************************
 * $Id$
 * Purpose: Draw a legend icon 
 * Project: Fusion
 * Author: DM Solutions Group Inc
 *****************************************************************************
 * Copyright (c) 2005, DM Solutions Group Inc.
 *****************************************************************************/
include(dirname(__FILE__).'/Common.php');

if (!isset($mapName)) {
    die('mapname not set');
}
if (isset($_SESSION['maps']) && isset($_SESSION['maps'][$mapName])) {
    $oMap = ms_newMapObj($_SESSION['maps'][$mapName]);
    $oLayer = $oMap->getLayerByName($REQUEST_VARS['layername']);
    $oClass = $oLayer->getClass($REQUEST_VARS['classindex']);
    /* TODO: should size be configurable? */
    $oImg = $oClass->createLegendIcon(16,16);
    /* TODO: can we figure out what the content type is? */
    header('Content-type: image/png');
    $oImg->saveImage("");
    $oImg->free();
}
?>