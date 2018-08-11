<?php

require_once("../../layers/MapGuide/php/Common.php");
require_once('../../common/php/Utilities.php');

if (InitializationErrorOccurred())
{
    DisplayInitializationErrorHTML();
    exit;
}

$locale = GetDefaultLocale();
$params = $_GET;

if (!array_key_exists("template", $params)) 
{
    echo "<p>Missing required parameter: template</p>";
    exit;
}
if (!array_key_exists("ApplicationDefinition", $params)) 
{
    echo "<p>Missing required parameter: ApplicationDefinition</p>";
    exit;
}

$bDebug = (array_key_exists("debug", $params) && $params["debug"] == "1");

$templateName = strtolower($params["template"]);
$appDef = $params["ApplicationDefinition"];
$templatePath = dirname(__FILE__)."/$templateName/index.templ";

if (!file_exists($templatePath)) {
    echo "<p>Template ($templateName) not found</p>";
    exit;
}

//Requests to this script can be made from anywhere, so disable XML entity loading to
//guard against malicious XML
libxml_disable_entity_loader(true);

try {
    $resourceService = $siteConnection->CreateService(MgServiceType::ResourceService);
    $appDefId = new MgResourceIdentifier($appDef);
    $content = $resourceService->GetResourceContent($appDefId);

    $document = new DOMDocument();
    $document->loadXML($content->ToString());

    $goog = $document->getElementsByTagName("GoogleScript");

    $root = $document->documentElement;
    $json = '{"' . $root->tagName . '":' . xml2json($root) . '}';

    $scriptName = "fusionSF-compressed";
    if ($bDebug) {
        $scriptName = "fusion";
    }

    $content = file_get_contents($templatePath);

    $content = str_replace("%__LIB_BASE__%", "../../lib", $content);
    $content = str_replace("%__TEMPLATE_BASE__%", "$templateName", $content);
    $content = str_replace("%__FUSION_SCRIPT__%", $scriptName, $content);
    if ($goog->length == 1) {
        $content = str_replace("%__SCRIPTS__%", '<script type="text/javascript" src="'.$goog->item(0)->textContent.'"></script>', $content);
    } else { //Nothing to inject
        $content = str_replace("%__SCRIPTS__%", "", $content);
    }
    $content = str_replace("%__APPDEF_JSON__%", $json, $content);

    header("Content-Type: text/html");
    echo $content;
} catch (MgException $ex) {
    $initializationErrorMessage = $ex->GetExceptionMessage();
    $initializationErrorDetail = $ex->GetDetails();
    $initializationErrorStackTrace = $ex->GetStackTrace();
    DisplayInitializationErrorHTML();
}
?>