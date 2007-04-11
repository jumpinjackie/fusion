<?php
/**
 * Convert an XML document into our special kind of JSON
 */
include(dirname(__FILE__).'/Utilities.php');

if (isset($_FILES['xml'])) {
    $xml = file_get_contents($_FILES['xml']['tmp_name']);
} else {
    $REQUEST_VARS = array_merge($_GET, $_POST);

    if (!isset($REQUEST_VARS['xml'])) {
        die('xml not set');
    }

    $xml = $REQUEST_VARS['xml'];
    $xml = str_replace('\"', '"', $xml);
}

$document = DOMDocument::loadXML($xml);
if ($document == null) {
    die ('/* invalid xml document:'.$xml.' */');
}
$root = $document->documentElement;

header('Content-type: text/plain');
header('X-JSON: true');
echo '{"' . $root->tagName . '":' . xml2json($root) . '}';
?>