<?php
/*****************************************************************************
 * @project         Fusion
 * @revision        $Id$
 * @fileoverview    this file redirects requests from the client to another 
 *                  server
 * @author          Paul Spencer (pspencer@dmsolutions.ca)
 * @copyright       &copy; 2006 DM Solutions Group Inc.
 *
 *****************************************************************************
 *
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

$user = 'Administrator';
$pass = 'admin';
/* very simple wrapper for redirecting requests */
$server = parse_url($_REQUEST['s']);
$scheme = $server['scheme'];
$host = $server['host'];
$method = 'POST';//$_SERVER['REQUEST_METHOD']; //'POST';
$port = isset($server['port'])?$server['port']:80;
$path = $server['path'];
$url = '';
if ($scheme == 'https') {
    $url .= 'ssl://';
}
$url .= $host;
$data = array();
$query = '';
$sep = '';
foreach ($_REQUEST as $key => $value) {
    if ($key != 's') {
          $query .= $sep . $key .'=' .urlencode($value);
          $sep = '&';
          $data[$key] = rawurldecode($value);
    }
}
//TODO: not necessarily xml!    
header('Content-type: text/xml');
$aResults = parseContent(sendToHost($url, $port, $method, $path, $data));

foreach($aResults['header'] as $header) {
  header($header);
}
echo implode("\n", $aResults['body']);
    
/*
 * PS: 
 * taken from
 * http://www.faqts.com/knowledge_base/view.phtml/aid/12039/fid/51
 * no apparent license or copyright.
 * modified to add $port
 * 
 * sendToHost
 * ~~~~~~~~~~
 * Params:
 *   $host      - Just the hostname.  No http:// or 
                  /path/to/file.html portions
 *   $method    - get or post, case-insensitive
 *   $path      - The /path/to/file.html part
 *   $data      - The query string, without initial question mark
 *   $useragent - If true, 'MSIE' will be sent as 
                  the User-Agent (optional)
 *
 * Examples:
 *   sendToHost('www.google.com','get','/search','q=php_imlib');
 *   sendToHost('www.example.com','post','/some_script.cgi',
 *              'param=First+Param&second=Second+param');
 */

function sendToHost($host, $port, $method, $path, $data, $useragent=0) {
    // Supply a default method of GET if the one passed was empty
    if (empty($method)) {
        $method = 'GET';
    }
    $method = strtoupper($method);
    $fp = fsockopen($host, $port);
    if (!$fp) {
        echo 'fsockopen failed<BR>';
        return;
    }
    if ($method == 'GET') {
        $path .= '?' . $data;
    }
    
    $header = '';
    $body = '';
    srand((double)microtime()*1000000);
    $boundary = "---------------------".substr(md5(rand(0,32000)),0,10);
    
    $header .= "$method $path HTTP/1.0\r\n";
    $header .= "Host: $host\r\n";
    $header .= "Content-type: multipart/form-data, boundary=$boundary\r\n";
    
    // attach post vars
    foreach($data as $index => $value){
      // if ($index == 'content') {
      //     $fplog = fopen('C:\\preview.log', 'w');
      //     fwrite($fplog, $value);
      //     fclose($fp);
      // }
      $body .= "--$boundary\r\n";
      if (substr($value,0,5) == '<?xml') {
          $body .= "Content-Disposition: form-data; name=\"".$index."\"; filename=\"blah.xml\"\r\n";
          $body .= "Content-type: text/xml\r\n";
      } else if ($index == 'filename') {
          $body .= "Content-Disposition: form-data; name=\"".$index."\"; filename=\"blah.xml\"\r\n";
          $body .= "Content-type: application/octet-stream\r\n";
          
          $h = fopen( $value, 'rb');
          while (!feof($h)) {
              $body.= fread($h, 4096);
          }
          //$body .= fread($h, filesize($value));
          fclose($h);
          //write other form vars needed for file upload to mapagent
          $body .= "--$boundary\r\n";
          $body .= "Content-Disposition: form-data; name=\"DATANAME\"; value=\"".$value."\"\r\n";
          $body .= "--$boundary\r\n";
          $body .= "Content-Disposition: form-data; name=\"DATALENGTH\"; value=\"".filesize($value)."\"\r\n";
          continue;
      } else {
          $body .= "Content-Disposition: form-data; name=\"".$index."\"\r\n";
      }
      //if (get_magic_quotes_gpc()) {
          $value = stripslashes($value);
      //}
      $body .= "\r\n".rawurldecode($value)."\r\n";
    }
    $body .= "--$boundary--\r\n";
    $header .= "Content-length: " . strlen($body) . "\r\n";
    $header .= "Connection: close\r\n\r\n";
    
    fputs($fp, $header.$body);
    $buf = '';
    while (!feof($fp)) {
        $buf .= fgets($fp,4096);
    }
    fclose($fp);
    
    return $buf;
}   

function parseContent( $r ) {
    $header = array();
    $body = array();
    $ar = explode("\n", $r);
    foreach($ar as $idx => $line) {
        if (trim($line) == '') {
            $header = array_slice( $ar, 0, $idx);
            $body = array_slice( $ar, $idx+1);
            break;
        }
    }
//     echo $r;
//     print_r($header);
//     print_r($body);
    return array( 'header' => $header, 'body' => $body );
}
?>
