<?php
/* initialize a session and return the session id to the caller */
include(dirname(__FILE__).'/Common.php');
initializeSession( "sid", "", "" );
$sessionId = session_id();

header('content-type: text/xml');
echo "<!--".getSessionSavePath()."-->";
echo "<mapguidesession>";
echo "<sessionid>$sessionId</sessionid>";
echo "</mapguidesession>";
?>