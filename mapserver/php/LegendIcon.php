<?php
include(dirname(__FILE__).'/Common.php');

if (!isset($mapName)) {
    die('mapname not set');
}
if (isset($_SESSION['maps']) && isset($_SESSION['maps'][$mapName])) {
    $oMap = ms_newMapObj($_SESSION['maps'][$mapName]);
    $oLayer = $oMap->getLayerByName($_REQUEST['layername']);
    $oClass = $oLayer->getClass($_REQUEST['classindex']);
    $oImg = $oClass->createLegendIcon(16,16);
    $imagetype = $oMap->imagetype;
    header('Content-type: image/png');
    $oImg->saveImage("");
    $oImg->free();
    exit;
}
?>