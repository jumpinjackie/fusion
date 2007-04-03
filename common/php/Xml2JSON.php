<?php
/**
 * Convert an XML document into our special kind of JSON
 */
include(dirname(__FILE__).'/Utilities.php');

if (!isset($_POST['xml'])) {
    die('xml not set');
}

$xml = $_POST['xml'];
$xml = str_replace('\"', '"', $xml);

$document = DOMDocument::loadXML($xml);
if ($document == null) {
    die ('/* invalid xml document:'.$xml.' */');
}
$root = $document->documentElement;

header('Content-type: text/plain');
header('X-JSON: true');
echo '{"' . $root->tagName . '":' . xml2json($root) . '}';
?>