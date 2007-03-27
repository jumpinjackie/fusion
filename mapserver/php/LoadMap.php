<?php
include(dirname(__FILE__).'/Common.php');
include(dirname(__FILE__).'/Utilities.php');
/* load a Map into the user's session and return some information about what's in the map. */

define('MAX_SCALE', 1000000000);
if (isset($_REQUEST['mapfile']))
{
    echo "/*".$_REQUEST['mapfile']."*/";
    $oMap = ms_newMapObj($_REQUEST['mapfile']);
    $mapObj = NULL;
    if ($oMap)
    {
        header('Content-type: text/x-json');
        header('X-JSON: true');
        $mapObj->sessionId = $sessionID;
        $mapObj->mapId = '';
        $mapObj->metersPerUnit = 1;
        $mapObj->dpi = $oMap->resolution;
        $mapObj->mapName = $oMap->name;
        if (!isset($_SESSION['maps'])) {
            $_SESSION['maps'] = array();
        }
        if (!isset($_SESSION['maps'][$mapObj->mapName])) {
            $_SESSION['maps'][$mapObj->mapName] = $_REQUEST['mapfile'];
        }
        $mapObj->extent = array( $oMap->extent->minx, $oMap->extent->miny, 
                                 $oMap->extent->maxx, $oMap->extent->maxy );
        $minScale = max($oMap->minscale, 1);
        $maxScale = ($oMap->maxscale == NULL || $oMap->maxscale == -1) ? 
                            MAX_SCALE : $oMap->maxscale;
        //layers
        $mapObj->layers = array();
        for ($i=0;$i<$oMap->numlayers;$i++)
        {
             $layer=$oMap->GetLayer($i);
             $layerObj = NULL;
             $layerObj->propertyMappings = '';
             $layerObj->uniqueId = $i;
             $layerObj->layerName = $layer->name;
             $layerObj->layerTypes = array($layer->type);
             $layerObj->displayInLegend = true;
             $layerObj->expandInLegend = true;
             $layerObj->resourceId = $layer->name;
             $layerObj->parentGroup = '';
             $layerObj->legendLabel = $layer->name;
             $layerObj->selectable = true;
             $layerObj->visible = ($layer->status == MS_ON || $layer->status == MS_DEFAULT);
             $layerObj->actuallyVisible = true;
             $layerObj->editable = false;
             $aScaleRanges = array();
             $scaleRange = NULL;
             $layerMin = $layer->minscale == NULL ? 1 : $layer->minscale;
             $layerMax = ($layer->maxscale == NULL || $layer->maxscale == -1) ? 
                                MAX_SCALE : $layer->maxscale;
             $scaleRange->minScale = max($layerMin, $minScale);
             $scaleRange->maxScale = min($layerMax, $maxScale);
             $scaleRange->styles = array();
             array_push($aScaleRanges, $scaleRange);
             for ($j=0; $j<$layer->numclasses; $j++) {
                 $oClass = $layer->getClass($j);
                 $classObj = NULL;
                 $classObj->legendLabel = $oClass->name;
                 $classObj->filter = $oClass->getExpression();
                 $classMin = $oClass->minscale == NULL ? 1 : $oClass->minscale;
                 $classMax= ($oClass->maxscale == NULL || $oClass->maxscale == -1) ? 
                                MAX_SCALE : $oClass->maxscale;
                 $classObj->minscale = max($classMin, $layerMin, $minScale);
                 $classObj->maxscale = min($classMax, $layerMax, $maxScale);
                 $classObj->index = $j;
                 array_push($scaleRange->styles, $classObj);
             }
             $layerObj->scaleRanges = $aScaleRanges;
             array_push($mapObj->layers, $layerObj);
        } 
        $mapObj->groups = array();
        echo var2json($mapObj);
    }
}
?>
