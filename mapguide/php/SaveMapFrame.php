<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">

<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <script type="text/javascript" charset="utf-8">
    function Save(){
        setTimeout(function(){
            window.frames['theImage'].document.execCommand('SaveAs', true, "<?php echo $_REQUEST['mapname'].'.'.$REQUEST['format']?>");
        },2500);
    };
    </script>
</head>
<body onload='Save()'>
<H4>Preparing Image for download...</H4>
<?php
include('MGCommon.php');
echo "<iframe style='visibility: hidden;' id='theImage' src='SaveMap.php?format=".$_REQUEST['format'].
                            "&mapname=".$_REQUEST['mapname'].
                            "&session=".$_REQUEST['session'].
                            "'></iframe>";
?>
</body>
</html>
