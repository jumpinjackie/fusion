<?php
/**
 * SetLayers
 *
 * $Id: $
 *
 * Copyright (c) 2007, DM Solutions Group Inc.
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
 */

/*****************************************************************************
 * Utility function to load scale ranges for the layers. Initially
 * scale ranges were returned as part of in LoadMap.php. This allows
 * to reduce the size of information that is returned by LoadMap, by putting
 * elements that are unnessary to the map draw her.  
 *****************************************************************************/

/* set up the session */
include ("Common.php");
include('../../common/php/Utilities.php');
include ("Utilities.php");


if (isset($_SESSION['maps']) && isset($_SESSION['maps'][$mapName])) {
    $oMap = ms_newMapObj($_SESSION['maps'][$mapName]);
}

$scaleObj = NULL;
$scaleObj->layers = array();

define('ICON_SIZE', 16);
$nIconWidth = $oMap->legend->keysizex;
$nIconHeight = $oMap->legend->keysizey;
if ($nIconWidth <=0)
  $nIconWidth = ICON_SIZE;
if ($nIconWidth <=0)
  $nIconWidth = ICON_SIZE;
$nTotalClasses=0;
$aIcons = array();


/*special case to force the the legend icons to be drawn using a gd driver
  This was fixed in ticket http://trac.osgeo.org/mapserver/ticket/2682 which
  will be available for mapserver version 5.2.1 and 5.4
  Note that we do not check the outputformat of the map (assuming that we are 
  using GD or AGG renderers)
*/
$nVersion = ms_GetVersionInt();
if ($nVersion <= 50200) /*5.2 and before*/
  $oMap->selectOutputFormat("png24");


for($i=0;$i<$oMap->numlayers;$i++) 
{    
    if (isset($_SESSION['scale_ranges']) && isset($_SESSION['scale_ranges'][$i]))
    {
        $layer = $oMap->getLayer($i);
        $scaleranges = $_SESSION['scale_ranges'][$i];
        //print_r($scaleranges);
        //echo "aaa <br>";
        $layerObj = NULL;
        $layerObj->uniqueId = $i;

        /*generate the legend icons here*/
        //echo count($scaleranges) . "<br>\n";
        $nScaleRanges = count($scaleranges);
        for ($j=0; $j<$nScaleRanges; $j++)
        {
            $nStyles = count($scaleranges[$j]->styles);
            for ($k=0; $k<$nStyles; $k++)
            {
                $nClassIndex = $scaleranges[$j]->styles[$k]->index;
                $oClass = $layer->getClass($nClassIndex);
                

                $oImg = $oClass->createLegendIcon($nIconWidth, $nIconHeight);
                array_push($aIcons, $oImg);
                $scaleranges[$j]->styles[$k]->icon_x = ($nTotalClasses*$nIconWidth);
                $scaleranges[$j]->styles[$k]->icon_y=0;
                $nTotalClasses++;
            }
        }

        $layerObj->scaleRanges = $scaleranges;
        array_push($scaleObj->layers, $layerObj);
    }
 }  

if ($nTotalClasses > 0)
 {
     //set the image path and image dir based on what fusion config file
     $configObj = $_SESSION['fusionConfig'];

     $original_imagepath = $oMap->web->imagepath;
     $original_imageurl = $oMap->web->imageurl;

     if (isset($configObj->mapserver->imagePath) && $configObj->mapserver->imagePath !="")
        $oMap->web->set("imagepath", $configObj->mapserver->imagePath);
     
     if(isset($configObj->mapserver->imageUrl) && $configObj->mapserver->imageUrl!="")
         $oMap->web->set("imageurl", $configObj->mapserver->imageUrl);

     //build and image containing all the icons and return url
     $nTmpWidth = $oMap->width;
     $nTmpHeight = $oMap->height;
    
     $oMap->set("width", $nTotalClasses*$nIconWidth);
     $oMap->set("height", $nIconHeight);
     $oImage = $oMap->prepareImage();

     $oMap->set("width", $nTmpWidth);
     $oMap->set("height", $nTmpHeight);
    
     for ($i=0; $i<$nTotalClasses;$i++)
       $oImage->pasteImage($aIcons[$i], -1, $i*$nIconWidth, 0);


     $scaleObj->icons_url = $oImage->saveWebImage();
     $scaleObj->icons_width = $nIconWidth;
     $scaleObj->icons_height = $nIconHeight;

      $oMap->web->set("imagepath", $original_imagepath);
      $oMap->web->set("imageurl", $original_imageurl);
      
 }

header('Content-type: text/x-json');
header('X-JSON: true');

echo var2json($scaleObj);
exit;

