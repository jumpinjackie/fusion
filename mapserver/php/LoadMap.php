<?php
/*****************************************************************************
 * $Id$
 * Purpose: Load a mapfile into the session and return information about the
 *          map to the client
 * Project: Fusion
 * Author: DM Solutions Group Inc
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *****************************************************************************/
/* Common starts the session */
include(dirname(__FILE__).'/Common.php');
include(dirname(__FILE__).'/Utilities.php');

/* if scales are not set, these become the default values */
define('MIN_SCALE', 1);
define('MAX_SCALE', 1000000000);

/* could potentially make this optional */
$moveToSession = true;

/** 
   TODO make it possible to specify only a relative path
   in the WebLayout and have this code know where to
   look for it on the server somehow
 */
 
/* only do something if a mapfile was requested */
if (isset($_REQUEST['mapfile'])) {
    $oMap = ms_newMapObj($_REQUEST['mapfile']);
    
    /* optionally move the mapfile to the session */
    if ($moveToSession) {
        //path to map file in the session is used by the client
        $mapId = getSessionSavePath().($oMap->name).".map";
        //modify various paths if necessary
        $pathToMap = dirname($_REQUEST['mapfile']);
        $cwd = getcwd();
        chdir($pathToMap);
        $shapePath = $oMap->shapepath;
        $oMap->set('shapepath', realpath($shapePath));
        $symbolSet = $oMap->symbolsetfilename;
        if ($symbolSet != '') {
            $oMap->setSymbolSet(realpath($symbolSet));
        }
        $fontSet = $oMap->fontsetfilename;
        if ($fontSet != '') {
            $oMap->setFontSet(realpath($fontSet));
        }
        /* need to modify all image symbols reference in the map file
         eg STYLE 
             SYMBOL "../etc/markers/target-7.gif" : this is relative to the map file
        */
        for ($i=0; $i<$oMap->numlayers; $i++)
        {
            $oLayer = $oMap->GetLayer($i);

            for ($j=0; $j<$oLayer->numclasses; $j++)
            {
                $oClass = $oLayer->GetClass($j);
                for ($k=0; $k<$oClass->numstyles; $k++)
                {
                    $oStyle = $oClass->getStyle($k);
                    if ($oStyle->symbolname != "")
                    {
                        if (realpath($oStyle->symbolname))
                        {
                            $oStyle->set("symbolname", realpath($oStyle->symbolname));
                        }
                    }
                }
            }
        }
        $oMap->save($mapId);
        chdir($cwd);
    } else {
        $mapId = $_REQUEST['mapfile'];
    }
    $mapObj = NULL;
    if ($oMap) {
        header('Content-type: text/x-json');
        header('X-JSON: true');
        $mapObj->sessionId = $sessionID;
        $mapObj->mapId = $mapId;
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
        $minScale = $oMap->web->minscale == -1 ? MIN_SCALE : $oMap->web->minscale;
        $maxScale = $oMap->web->maxscale == -1 ? MAX_SCALE : $oMap->web->maxscale;
        //layers
        $mapObj->layers = array();
        for ($i=0;$i<$oMap->numlayers;$i++)
        {
             $layer=$oMap->GetLayer($i);
             $layerObj = NULL;
             $layerObj->propertyMappings = '';
             $layerObj->uniqueId = $i;
             $layerObj->layerName = $layer->name;
             switch($layer->type) {
                 case MS_LAYER_POINT:
                 case MS_LAYER_ANNOTATION:
                    $type = 0;
                    break;
                 case MS_LAYER_LINE:
                    $type = 1;
                    break;
                 case MS_LAYER_POLYGON:
                    $type = 2;
                    break;
                 case MS_LAYER_RASTER:
                    $type = 4;
                    break;
                 default:
                    $type = 0;
             }
             $layerObj->layerTypes = array($type);
             $layerObj->displayInLegend = true;
             $layerObj->expandInLegend = false;
             $layerObj->resourceId = $layer->name;
             $layerObj->parentGroup = '';
             $layerObj->legendLabel = $layer->name;
             $layerObj->selectable = true;
             $layerObj->visible = ($layer->status == MS_ON || $layer->status == MS_DEFAULT);
             $layerObj->actuallyVisible = true;
             $layerObj->editable = false;
             
             /* process the classes.  The legend expects things 
              * organized by scale range so we have to first
              * find all the scale breaks, then create ranges
              * for each scale break pair, then slot the classes
              * into the scale ranges that they apply to.
              */
             
             $aScaleRanges = array();
             //create a default scale range for the layer as a whole
             $layerMin = $layer->minscale == -1 ? $minScale : $layer->minscale;
             $layerMax = $layer->maxscale == -1 ? $maxScale : $layer->maxscale;
             
             //find all the unique scale breaks in this layer                  
             $aScaleBreaks = array($layerMin, $layerMax);
             for ($j=0; $j<$layer->numclasses; $j++) {
                 $oClass = $layer->getClass($j);
                 $classMin = $oClass->minscale == -1 ? $layerMin : max($oClass->minscale, $layerMin);
                 $classMax = $oClass->maxscale == -1 ? $layerMax : min($oClass->maxscale, $layerMax);
                 if (!in_array($classMin, $aScaleBreaks)) {
                     array_push($aScaleBreaks, $classMin);
                 }
                 if (!in_array($classMax, $aScaleBreaks)) {
                     array_push($aScaleBreaks, $classMax);
                 }
             }
             //sort them
             sort($aScaleBreaks);
             
             //create scale ranges for each pair of breaks
             for ($j=0; $j<count($aScaleBreaks)-1; $j++) {
                 $scaleRange = NULL;
                 $scaleRange->minScale = $aScaleBreaks[$j];
                 $scaleRange->maxScale = $aScaleBreaks[$j+1];
                 $scaleRange->styles = array();
                 array_push($aScaleRanges, $scaleRange);
             }
             
             //create classes and slot them into the scale breaks
             for ($j=0; $j<$layer->numclasses; $j++) {
                 $oClass = $layer->getClass($j);
                 $classObj = NULL;
                 $classObj->legendLabel = $oClass->name;
                 $classObj->filter = $oClass->getExpression();
                 $classMin = $oClass->minscale == -1 ? $layerMin : max($oClass->minscale, $layerMin);
                 $classMax = $oClass->maxscale == -1 ? $layerMax : min($oClass->maxscale, $layerMax);
                 $classObj->minScale = $classMin;
                 $classObj->maxScale = $classMax;
                 $classObj->index = $j;
                 for ($k=0; $k<count($aScaleRanges); $k++) {
                     if ($classMin < $aScaleRanges[$k]->maxScale &&
                         $classMax > $aScaleRanges[$k]->minScale) {
                         array_push($aScaleRanges[$k]->styles, $classObj);
                     }
                 }
             }
             $layerObj->scaleRanges = $aScaleRanges;
             array_push($mapObj->layers, $layerObj);
        } 
        $mapObj->groups = array();
        echo var2json($mapObj);
    }
}
?>
