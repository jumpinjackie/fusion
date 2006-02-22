<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: Get xml layer list for GMap and return to the client
 *
 * Project: MapGuide Open Source GMap demo application
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2005, DM Solutions Group Inc.
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
 *
 *****************************************************************************/

include ("MGcommon.php");

// Converts a boolean to "yes" or "no"
// --from MG Web Tier API Reference
function BooleanToString($boolean)
{
    if (is_bool($boolean))
        return ($boolean ? "true" : "false");
    else
        return "ERROR in BooleanToString.";
}

//Get a runtime map from a map definition
$map = new AwMap();
$map->Open($resourceService, $mapName);


//Get layer collection as xml
header('content-type: text/xml');
$layers=$map->GetLayers();
echo "<legend>";
echo "<layercollection>";

//create a mapping service for the legend images
$mappingService = $siteConnection->CreateService(AwServiceType::MappingService);
//TODO: make the temp location configurable
$tempImgPath = "c:/Program Files/Apache Group/Apache2/htdocs/ms_tmp/";

for($i=0;$i<$layers->GetCount();$i++) 
{ 
    $layer=$layers->GetItem($i);
    //create a legend icon if none exists
    if (!file_exists($tempImgPath.$layer->GetObjectId().".png"))
    {
        $legendImgName = $tempImgPath.$layer->GetObjectId().".png";
        echo $legendImgName;
        $legendByteReader = $mappingService->GenerateLegendImage($layer->GetLayerDefinition(),
                                                100000, 10, 10, 1, 1, 0);
        //Some layers won't have icons for a given scale, so test the bytereader returned.                                        
        if ($legendByteReader) {
            $legendByteSink = new AwByteSink($legendByteReader);
            $legendByteSink->ToFile($legendImgName);
        }
    }
    $layerDefinition = $layer->GetLayerDefinition();
    echo '<layer>';
    echo '<layername>'.$layer->GetName().'</layername>';
    echo '<rid>'.$layerDefinition->ToString().'</rid>';
    if ($layer->GetGroup()) {
        echo '<parentgroup>'.$layer->GetGroup()->GetObjectId().'</parentgroup>';
    }
    echo '<legendlabel>'.$layer->GetLegendLabel().'</legendlabel>';
    echo '<selectable>'.$layer->GetSelectable().'</selectable>';
	echo '<legendimage>'.$layer->GetObjectId().'.png</legendimage>';
    echo '<visible>'.BooleanToString($layer->GetVisible()).'</visible>';
    echo '<actuallyvisible>'.BooleanToString($layer->isVisible()).'</actuallyvisible>';
    echo '</layer>';
} 
echo "</layercollection>"; 

//Get layer groups as xml
$groups = $map->GetLayerGroups();
echo "<groupcollection>"; 
for($i=0;$i<$groups->GetCount();$i++) 
{ 
    $group=$groups->GetItem($i);
    $layerDefinition = $layer->GetLayerDefinition();
    echo '<group>';
    echo '<groupname>'.$group->GetName().'</groupname>';
    echo '<legendlabel>'.$group->GetLegendLabel().'</legendlabel>';
    echo '<uniqueid>'.$group->GetObjectId().'</uniqueid>';
    $parent = $group->GetGroup();
    if ($parent){
        echo '<parentuniqueid>'.$parent->GetObjectId().'</parentuniqueid>';
    }

    echo '<visible>'.BooleanToString($group->GetVisible()).'</visible>';
    echo '<actuallyvisible>'.BooleanToString($group->isVisible()).'</actuallyvisible>';
    echo '</group>';
} 
echo"</groupcollection>"; 

echo "</legend>";
                                              
?>