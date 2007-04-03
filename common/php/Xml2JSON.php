<?php
/**
 * Convert an XML document into our special kind of JSON
 */
include(dirname(__FILE__).'/Utilities.php');

if (!isset($_POST['xml'])) {
    die('xml not set');
}

$xml = urldecode($_POST['xml']);
$document = DOMDocument::loadXML($xml);
if ($document == null) {
    die ('/* invalid xml document:'.$xml.' */');
}
$root = $document->documentElement;
$result = "{";
$result .= '"'.$root->tagName.'":';
$result .= xml2json($root);
$result .= '}';

header('Content-type: text/plain');
header('X-JSON: true');

echo $result;
?>