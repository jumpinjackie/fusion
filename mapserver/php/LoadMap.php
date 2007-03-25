<?php
include(dirname(__FILE__).'/Common.php');

/* load a Map into the user's session and return some information about what's in the map. */

if (isset($_REQUEST['mapfile']))
{
    $oMap = ms_newMapObj($_REQUEST['mapfile']);
    if ($oMap)
    {
        header('Content-type: text/x-json');
        header('X-JSON: true');
        echo "{";
        echo "sessionId:'$sessionID',";
        echo "mapId:'',";
        echo "metersPerUnit:1,";
        echo "dpi:". $oMap->resolution .",";
        echo "mapName:'".$oMap->name."',";
        echo "extent:[";
        echo $oMap->extent->minx.",";
        echo $oMap->extent->miny.",";
        echo $oMap->extent->maxx.",";
        echo $oMap->extent->maxy."],";
 
        //layers
        
        echo "layers:[";
        for ($i=0;$i<$oMap->numlayers;$i++)
        {
             echo "{";
             
             echo "propertyMappings:{},";
             $layer=$oMap->GetLayer($i);
             echo "uniqueId:$i,";
             echo "layerName:'".$layer->name."',";
             echo 'layerTypes:['. $layer->type .'],';
             echo "displayInLegend:true,";
             echo "expandInLegend:true,";
             echo "resourceId:'',";
             echo "parentGroup:null,";
             echo "legendLabel:'".$layer->name."',";
             echo "selectable:true,";
             if ($layer->status == MS_ON || $layer->status == MS_DEFAULT)
               echo "visible:true,";
             else
               echo "visible:false,";
             echo "actuallyVisible:true,";
             echo "editable:false,";
             echo "scaleRanges:[]";
             
             echo "},";       
        } 
        echo "],";
        echo  "groups:[]";
        
        echo "}";

    }
}
        
?>
