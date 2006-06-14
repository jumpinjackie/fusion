<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: simple wrapper for redirecting XmlHttpRequests to a remote server
 *          to avoid javascript security limitations
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

//POST is broken...
$method = 'GET';
include('./http_post.php'); //TODO include auth credentials from a config file

$szResult = ($_REQUEST['s']); 
if (strpos($szResult, '?')) { 
	$szResult .= '&'; 
} else { 
	$szResult .= '?'; 
}

$sep = ''; 
foreach ($_REQUEST as $key => $value) { 
	if ($key != 's') { 
		$szResult .= $sep . $key .'=' .urlencode($value);
		$sep = '&';
	}
}


//echo "<PRE>";
//print_r ($server);
//array_shift($_REQUEST);
//print_r ($_REQUEST);
//echo "</PRE>";
//echo $szResult;
//exit;
//file_get_contents("http://localhost:8008/mapguide/mapagent/mapagent.fcgi?VERSION=1.0.0&OPERATION=GETRESOURCECONTENT&RESOURCEID=Library%3A%2F%2FSamples%2FSheboygan%2FLayouts%2FSheboyganPhp.WebLayout");
//	header('Content-type: text/xml');
//echo file_get_contents("http://localhost:8008/mapguide/mapagent/mapagent.fcgi?VERSION=1.0.0&OPERATION=GETRESOURCECONTENT&RESOURCEID=Library://Samples/Sheboygan/Layouts/SheboyganPhp.WebLayout");




if (stristr($szResult, 'MGgenerate') !== false) {
	header('Context-type: image/png');
} else {
	header('Content-type: text/xml');	
}
if ($method == 'GET') {           
    echo file_get_contents($szResult);
    exit;
} else {
   	$server = parse_url($_REQUEST['s']);
    echo http_post($server['host'],
               $server['user'],
               $server['pass'],
               isset($server['port'])?$server['port']:80,
               $server['path'],
               $_REQUEST);
}                
?>
