<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: create a POST request to a remote server and return the result
 *
 * Project: MapGuide Open Source GMap demo application
 *
 * Author: http.inc by nf@bigpond.net.au, http://nf.wh3rd.net/
 *         no license included, 
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


function http_post($server, $username, $password, $port, $url, $vars) {

// example:
//  http_post(
//	"www.fat.com",
//	80, 
//	"/weightloss.pl", 
//	array("name" => "obese bob", "age" => "20")
//	);

	$user_agent = "Mozilla/4.0 (compatible; MSIE 5.5; Windows 98)";

    //$urlencoded = $vars;
    
	$urlencoded = "";
	while (list($key,$value) = each($vars))
		$urlencoded.= urlencode($key) . "=" . urlencode($value) . "&";
	$urlencoded = substr($urlencoded,0,-1);	
    
	$content_length = strlen($urlencoded);

	$headers = "POST $url HTTP/1.1
Accept: */*
Accept-Language: en-au
Content-Type: text/xml
User-Agent: $user_agent
Host: $server
Connection: Keep-Alive
Cache-Control: no-cache
Content-Length: $content_length

";
echo "<PRE>";
print_r ($headers);
print_r ($urlencoded);
echo "</PRE>";
	$fp = fsockopen($server, $port, $errno, $errstr);
	if (!$fp) {
		return false;
	}
    
	fputs($fp, $headers);
	fputs($fp, $urlencoded);
	fputs($fp, "\r\n\n");
	
	$ret = "";
	while (!feof($fp))
		$ret.= fgets($fp, 1024);
        
	fclose($fp);
	
	return $ret;

}


?>