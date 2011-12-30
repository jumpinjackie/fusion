<?php
    $fusionMGpath = '../../layers/MapGuide/php/';
    require_once $fusionMGpath . 'Common.php';
    if(InitializationErrorOccurred())
    {
        DisplayInitializationErrorHTML();
        exit;
    }
    require_once $fusionMGpath . 'Utilities.php';
    require_once $fusionMGpath . 'JSON.php';
	require_once 'classes/markupcommand.php';

	$args = ($_SERVER['REQUEST_METHOD'] == "POST") ? $_POST : $_GET;

	$errorMsg = null;
	$errorDetail = null;
    
    SetLocalizedFilesPath(GetLocalizationPath());
    if(isset($_REQUEST['LOCALE'])) {
        $locale = $_REQUEST['LOCALE'];
    } else {
        $locale = GetDefaultLocale();
    }
    
    $newLayerLocal = GetLocalizedString('REDLINENEWLAYER', $locale );
    $layerSettingsLocal = GetLocalizedString('REDLINELAYERSETTINGS', $locale );
    $nameLocal = GetLocalizedString('REDLINENAME', $locale );
    $pointStyleLocal = GetLocalizedString('REDLINEPOINTSTYLE', $locale );
    $markerStyleLocal = GetLocalizedString('REDLINEMARKERTYPE', $locale );
    $squareLocal = GetLocalizedString('REDLINEMARKERSQUARE', $locale );
    $circleLocal = GetLocalizedString('REDLINEMARKERCIRCLE', $locale );
    $triangleLocal = GetLocalizedString('REDLINEMARKERTRIANGLE', $locale );
    $starLocal = GetLocalizedString('REDLINEMARKERSTAR', $locale );
    $crossLocal = GetLocalizedString('REDLINEMARKERCROSS', $locale );
    $xLocal = GetLocalizedString('REDLINEMARKERX', $locale );
    $unitsPtLocal = GetLocalizedString('REDLINEUNITSPT', $locale );
    $unitsInLocal = GetLocalizedString('REDLINEUNITSIN', $locale );
    $unitsMmLocal = GetLocalizedString('REDLINEUNITSMM', $locale );
    $unitsCmLocal = GetLocalizedString('REDLINEUNITSCM', $locale );
    $unitsMLocal = GetLocalizedString('REDLINEUNITSM', $locale );
    $markerSizeLocal = GetLocalizedString('REDLINEMARKERSIZE', $locale );
    $markerColorLocal = GetLocalizedString('REDLINEMARKERCOLOR', $locale );
    $lineStyleLocal = GetLocalizedString('REDLINELINESTYLE', $locale );
    $linePatternLocal = GetLocalizedString('REDLINELINEPATTERN', $locale );
    $solidLocal = GetLocalizedString('REDLINEPATTERNSOLID', $locale );
    $dashLocal = GetLocalizedString('REDLINEPATTERNDASH', $locale );
    $dotLocal = GetLocalizedString('REDLINEPATTERNDOT', $locale );
    $dashDotLocal = GetLocalizedString('REDLINEPATTERNDASHDOT', $locale );
    $dashDotDotLocal = GetLocalizedString('REDLINEPATTERNDASHDOTDOT', $locale );
    $railLocal = GetLocalizedString('REDLINEPATTERNRAIL', $locale );
    $borderLocal = GetLocalizedString('REDLINEPATTERNBORDER', $locale );
    $divideLocal = GetLocalizedString('REDLINEPATTERNDIVIDE', $locale );
    $fenceLineLocal = GetLocalizedString('REDLINEPATTERNFENCELINE', $locale );
    $netLocal = GetLocalizedString('REDLINEPATTERNNET', $locale );
    $lineLocal = GetLocalizedString('REDLINEPATTERNLINE', $locale );
    $line45Local = GetLocalizedString('REDLINEPATTERNLINE45', $locale );
    $line90Local = GetLocalizedString('REDLINEPATTERNLINE90', $locale );
    $line135Local = GetLocalizedString('REDLINEPATTERNLINE135', $locale );
    $squareLocal = GetLocalizedString('REDLINEPATTERNSQUARE', $locale );
    $boxLocal = GetLocalizedString('REDLINEPATTERNBOX', $locale );
    $crossLocal = GetLocalizedString('REDLINEPATTERNCROSS', $locale );
    $dolmitLocal = GetLocalizedString('REDLINEPATTERNDOLMIT', $locale );
    $hexLocal = GetLocalizedString('REDLINEPATTERNHEX', $locale );
    $sacncrLocal = GetLocalizedString('REDLINEPATTERNSACNCR', $locale );
    $steelLocal = GetLocalizedString('REDLINEPATTERNSTEEL', $locale );
    $sizeUnitsLocal = GetLocalizedString('REDLINESIZEUNITS', $locale );
    $thicknessLocal = GetLocalizedString('REDLINELINETHICKNESS', $locale );
    $lineColorLocal = GetLocalizedString('REDLINELINECOLOR', $locale );
    $transparentLocal = GetLocalizedString('REDLINETRANSPARENT', $locale );
    $polygonStyleLocal = GetLocalizedString('REDLINEPOLYGONSTYLE', $locale );
    $fillPatternLocal = GetLocalizedString('REDLINEFILLPATTERN', $locale );
    $fillTransparencyLocal = GetLocalizedString('REDLINEFILLTRANSPARENCY', $locale );
    $foregroundLocal = GetLocalizedString('REDLINEFOREGROUND', $locale );
    $backgroundLocal = GetLocalizedString('REDLINEBACKGROUND', $locale );
    $borderPatternLocal = GetLocalizedString('REDLINEBORDERPATTERN', $locale );
    $borderColorLocal = GetLocalizedString('REDLINEBORDERCOLOR', $locale );
    $labelStyleLocal = GetLocalizedString('REDLINELABELSTYLE', $locale );
    $labelSizeUnitsLocal = GetLocalizedString('REDLINELABELSIZEUNITS', $locale );
    $borderThicknessLocal = GetLocalizedString('REDLINEBORDERTHICKNESS', $locale );
    $fontSizeLocal = GetLocalizedString('REDLINELABELFONTSIZE', $locale );
    $boldLocal = GetLocalizedString('REDLINEFONTBOLD', $locale );
    $italicLocal = GetLocalizedString('REDLINEFONTITALIC', $locale );
    $underlineLocal = GetLocalizedString('REDLINEFONTUNDERLINE', $locale );
    $labelColorLocal = GetLocalizedString('REDLINELABELCOLOR', $locale );
    $labelBackgroundStyleLocal = GetLocalizedString('REDLINELABELBACKGROUNDSTYLE', $locale );
    $ghostedLocal = GetLocalizedString('REDLINELABELGHOSTED', $locale );
    $opaqueLocal = GetLocalizedString('REDLINELABELOPAQUE', $locale );
?>
<html>
<head>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8">
	<title>New Markup Layer</title>
    <link rel="stylesheet" href="Redline.css" type="text/css">
	<script language="javascript">
		var SET_MARKER_COLOR 		= 1;
		var SET_LINE_COLOR 			= 2;
		var SET_FILL_FORE_COLOR 	= 3;
		var SET_FILL_BACK_COLOR		= 4;
		var SET_BORDER_COLOR 		= 5;
		var SET_LABEL_FORE_COLOR 	= 6;
		var SET_LABEL_BACK_COLOR 	= 7;
		var setColor = 0;
	
		var markerColor = "FF0000";
		var lineColor = "0000FF";
		var fillForeColor = "00FF00";
		var fillBackColor = "00FF00";
		var fillBackTrans = true;
		var borderColor = "000000";
		var labelForeColor = "000000";
		var labelBackColor = "FFFFFF";
		
        function CheckName()
        {
            var el = document.getElementById("markupName");
            var mkName = el.value.replace(/^\s+|\s+$/g,"");
            if (mkName == "") {
                alert("Please enter a name for this new markup layer");
                el.focus();
                return false;
            }
            return true;
        }
		
		function PickColor(whichColor, allowTransparency, transparent)
        {
            var clr;
			setColor = whichColor;
			
            if (setColor == SET_MARKER_COLOR)
                clr = markerColor;
            else if (setColor == SET_LINE_COLOR)
                clr = lineColor;
            else if (setColor == SET_FILL_FORE_COLOR)
                clr = fillForeColor;
            else if (setColor == SET_FILL_BACK_COLOR)
                clr = fillBackColor;
            else if (setColor == SET_BORDER_COLOR)
                clr = borderColor;
            else if (setColor == SET_LABEL_FORE_COLOR)
                clr = labelForeColor;
            else if (setColor == SET_LABEL_BACK_COLOR)
                clr = labelBackColor;
           else
                return;
				
            height = allowTransparency? 470: 445;
            w = window.open("../../layers/MapGuide/php/ColorPicker.php?LOCALE=<?=$locale?>&CLR=" + clr + "&ALLOWTRANS=" + (allowTransparency? "1":"0") + "&TRANS=" + (transparent.value == "true"? "1":"0"), "colorPicker", "toolbar=no,status=no,width=355,height=" + height);
            w.focus();
        }

        function OnColorPicked(clr, trans)
        {
            if (setColor == SET_MARKER_COLOR)
                markerColor = clr;
            else if (setColor == SET_LINE_COLOR)
                lineColor = clr;
            else if (setColor == SET_FILL_FORE_COLOR)
                fillForeColor = clr;
            else if (setColor == SET_FILL_BACK_COLOR)
			{
                fillBackColor = clr;
				fillBackTrans = trans;
			}
            else if (setColor == SET_BORDER_COLOR)
                borderColor = clr;
            else if (setColor == SET_LABEL_FORE_COLOR)
                labelForeColor = clr;
            else if (setColor == SET_LABEL_BACK_COLOR)
                labelBackColor = clr;
           else
                return;

            UpdateColors();
        }

        function UpdateColors()
        {
            var elt;
            document.getElementById("markerColor").value = markerColor;
            elt = document.getElementById("markerSwatch").style;
            elt.backgroundColor = "#" + markerColor;
            elt.color = "#" + markerColor;

            document.getElementById("lineColor").value = lineColor;
            elt = document.getElementById("lineSwatch").style;
            elt.backgroundColor = "#" + lineColor;
            elt.color = "#" + lineColor;

            document.getElementById("fillForeColor").value = fillForeColor;
            elt = document.getElementById("fillFgSwatch").style;
            elt.backgroundColor = "#" + fillForeColor;
            elt.color = "#" + fillForeColor;

            document.getElementById("fillBackColor").value = fillBackColor;
            document.getElementById("fillBackTrans").value = fillBackTrans;
            elt = document.getElementById("fillBgSwatch").style;
            elt.backgroundColor = fillBackTrans ? "#FFFFFF" : "#" + fillBackColor;
            elt.color = fillBackTrans ? "#000000" : "#" + fillBackColor;

            document.getElementById("borderColor").value = borderColor;
            elt = document.getElementById("borderSwatch").style;
            elt.backgroundColor = "#" + borderColor;
            elt.color = "#" + borderColor;

            document.getElementById("labelForeColor").value = labelForeColor;
            elt = document.getElementById("labelFgSwatch").style;
            elt.backgroundColor = "#" + labelForeColor;
            elt.color = "#" + labelForeColor;

            document.getElementById("labelBackColor").value = labelBackColor;
            elt = document.getElementById("labelBgSwatch").style;
            elt.backgroundColor = "#" + labelBackColor;
            elt.color = "#" + labelBackColor;
        }
		
		 function Cancel()
        {
			window.location.href="markupmain.php?SESSION=<?= $args['SESSION']?>&MAPNAME=<?= $args['MAPNAME']?>";
		}
	</script>
	
</head>

<body marginwidth=5 marginheight=5 leftmargin=5 topmargin=5 bottommargin=5 rightmargin=5>

<?php if ($errorMsg == null) { ?>

<form action="markupmain.php" method="post" enctype="application/x-www-form-urlencoded" id="newMarkupLayerForm" target="_self">

<input name="SESSION" type="hidden" value="<?= $args['SESSION'] ?>">
<input name="MAPNAME" type="hidden" value="<?= $args['MAPNAME'] ?>">
<input name="MARKUPCOMMAND" type="hidden" value="<?= MarkupCommand::Create ?>">

<table class="RegText" border="0" cellspacing="0" width="100%%">
	<tr><td id="elTitle" colspan="2" class="Title"><?= $newLayerLocal ?><hr></td></tr>

	<tr><td colspan="2" class="SubTitle"><?= $layerSettingsLocal ?></td></tr>
	<tr><td colspan="2"><?= $nameLocal ?></td></tr>
	<tr><td colspan="2"><input class="Ctrl" id="markupName" name="MARKUPNAME" type="text" maxlength="255" style="width:100%"><br><br></td></tr>

	<tr><td colspan="2" class="SubTitle"><?= $pointStyleLocal ?></td></tr>
	<tr>
		<td colspan="2">
			<?=$markerStyleLocal?><br>
			<select class="Ctrl" name="MARKERTYPE" size="1">
				<option value="Square" selected="selected"><?=$squareLocal?></option>
				<option value="Circle"><?=$circleLocal?></option>
				<option value="Triangle"><?=$triangleLocal?></option>
				<option value="Star"><?=$starLocal?></option>
				<option value="Cross"><?=$crossLocal?></option>
				<option value="X"><?=$xLocal?></option>
			</select>
		</td>
	</tr>
	<tr>
		<td>
			<?=$sizeUnitsLocal?><br>
			<select class="Ctrl" name="MARKERSIZEUNITS" size="1">
				<option value="Points" selected="selected"><?=$unitsPtLocal?></option>
				<option value="Inches"><?=$unitsInLocal?></option>
				<option value="Millimeters"><?=$unitsMmLocal?></option>
				<option value="Centimeters"><?=$unitsCmLocal?></option>
				<option value="Meters"><?=$unitsMLocal?></option>
			</select>
		</td>
		<td>
			<?=$markerSizeLocal?><br>
			<input class="Ctrl" name="MARKERSIZE" type="text" value="10">
		</td>
	</tr>
	<tr>
		<td colspan="2">
			<?=$markerColorLocal?><br>
			<span class="Swatch" id="markerSwatch" style="color: #ff0000; background-color: #ff0000">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_MARKER_COLOR,false,false)">
			<br><br>
		</td>
	</tr>

	<tr><td colspan="2" class="SubTitle"><?=$lineStyleLocal?></td></tr>
	<tr>
		<td colspan="2">
			<?=$linePatternLocal?><br>
			<select class="Ctrl" name="LINEPATTERN" size="1">
				<option value="Solid" selected="selected"><?=$solidLocal?></option>
				<option value="Dash"><?=$dashLocal?></option>
				<option value="Dot"><?=$dotLocal?></option>
				<option value="DashDot"><?=$dashDotLocal?></option>
				<option value="DashDotDot"><?=$dashDotDotLocal?></option>
				<option value="Rail"><?=$railLocal?></option>
				<option value="BORDER"><?=$borderLocal?></option>
				<option value="DIVIDE"><?=$divideLocal?></option>
				<option value="FENCELINE1"><?=$fenceLineLocal?></option>
			</select>
		</td>
	</tr>	
	<tr>
		<td width="50%">
			<?=$sizeUnitsLocal?><br>
			<select class="Ctrl" name="LINESIZEUNITS" size="1">
				<option value="Points"><?=$unitsPtLocal?></option>
				<option value="Inches"><?=$unitsInLocal?></option>
				<option value="Millimeters"><?=$unitsMmLocal?></option>
				<option value="Centimeters" selected="selected"><?=$unitsCmLocal?></option>
				<option value="Meters"><?=$unitsMLocal?></option>
			</select>
		</td>
		<td width="50%">
			<?=$thicknessLocal?><br>
			<input class="Ctrl" name="LINETHICKNESS" type="text" value="0">
		</td>
	</tr>
	<tr>	
		<td colspan="2">
			<?=$lineColorLocal?><br>
			<span class="Swatch" id="lineSwatch" style="color: #0000ff; background-color: #0000ff">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_LINE_COLOR,false,false)">
			<br><br>
		</td>
	</tr>	
	
	
	<tr><td colspan="2" class="SubTitle"><?=$polygonStyleLocal?></td></tr>
	<tr>
		<td width="50%">
			<?=$fillPatternLocal?><br>
			<select class="Ctrl" name="FILLPATTERN" size="1">
				<option value="Solid" selected><?=$solidLocal?></option>
				<option value="Net"><?=$netLocal?></option>
				<option value="Line"><?=$lineLocal?></option>
				<option value="Line_45"><?=$line45Local?></option>
				<option value="Line_90"><?=$line90Local?></option>
				<option value="Line_135"><?=$line135Local?></option>
				<option value="Square"><?=$squareLocal?></option>
				<option value="Box"><?=$boxLocal?></option>
				<option value="Cross"><?=$crossLocal?></option>
				<option value="Dash"><?=$dashLocal?></option>
				<option value="Dolmit"><?=$dolmitLocal?></option>
				<option value="Hex"><?=$hexLocal?></option>
				<option value="Sacncr"><?=$sacncrLocal?></option>
				<option value="Steel"><?=$steelLocal?></option>
			</select>
		</td>
		<td width="50%">
			<?=$fillTransparencyLocal?><br>
			<input class="Ctrl" name="FILLTRANSPARENCY" type="text"  maxlength="3" value="0" style="width:50px">%
		</td>
	</tr>
	<tr>	
		<td width="50%" valign="top">
			<?=$foregroundLocal?><br>
			<span class="Swatch" id="fillFgSwatch" style="color: #00ff00; background-color: #00ff00">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_FILL_FORE_COLOR,false,false)">
			<br><br>
		</td>
		<td width="50%" valign="top">
			<?=$backgroundLocal?><br>
			<span class="Swatch" id="fillBgSwatch">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_FILL_BACK_COLOR,true,fillBackTrans)">
			<br>
		</td>
	</tr>	
	<tr><td colspan="2"><hr></td></tr>
	<tr>
		<td colspan="2">
			<?=$borderPatternLocal?><br>
			<select class="Ctrl" name="BORDERPATTERN" size="1">
				<option value="Solid" selected="selected"><?=$solidLocal?></option>
				<option value="Dash"><?=$dashLocal?></option>
				<option value="Dot"><?=$dotLocal?></option>
				<option value="DashDot"><?=$dashDotLocal?></option>
				<option value="DashDotDot"><?=$dashDotDotLocal?></option>
				<option value="Rail"><?=$railLocal?></option>
				<option value="BORDER"><?=$borderLocal?></option>
				<option value="DIVIDE"><?=$divideLocal?></option>
				<option value="FENCELINE1"><?=$fenceLineLocal?></option>
			</select>
		</td>
	</tr>	
	<tr>
		<td width="50%">
			<?=$sizeUnitsLocal?><br>
			<select class="Ctrl" name="BORDERSIZEUNITS" size="1">
				<option value="Points"><?=$unitsPtLocal?></option>
				<option value="Inches"><?=$unitsInLocal?></option>
				<option value="Millimeters"><?=$unitsMmLocal?></option>
				<option value="Centimeters" selected="selected"><?=$unitsCmLocal?></option>
				<option value="Meters"><?=$unitsMLocal?></option>
			</select>
		</td>
		<td width="50%">
			<?=$borderThicknessLocal?><br>
			<input class="Ctrl" name="BORDERTHICKNESS" type="text" value="0">
		</td>
	</tr>
	<tr>	
		<td colspan="2">
			<?=$borderColorLocal?><br>
			<span class="Swatch" id="borderSwatch" style="color: #000000; background-color: #000000">&nbsp;transparent&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_BORDER_COLOR,false,false)">
			<br><br>
		</td>
	</tr>	

	<tr><td colspan="2" class="SubTitle"><?=$labelStyleLocal?></td></tr>
	<tr>
		<td width="50%">
			<?=$sizeUnitsLocal?><br>
			<select class="Ctrl" name="LABELSIZEUNITS" size="1">
				<option value="Points" selected="selected"><?=$unitsPtLocal?></option>
				<option value="Inches"><?=$unitsInLocal?></option>
				<option value="Millimeters"><?=$unitsMmLocal?></option>
				<option value="Centimeters"><?=$unitsCmLocal?></option>
				<option value="Meters"><?=$unitsMLocal?></option>
			</select>
		</td>
		<td width="50%">
			<?=$fontSizeLocal?><br>
			<input class="Ctrl" name="LABELFONTSIZE" type="text" value="10">
		</td>
	</tr>
	<tr>
		<td colspan="2" valign="middle">
			<input name="LABELBOLD" type="checkbox" value="bold"><label><?=$boldLocal?></label>&nbsp;&nbsp;
			<input name="LABELITALIC" type="checkbox" value="italic"><label><?=$italicLocal?></label>&nbsp;&nbsp;
			<input name="LABELUNDERLINE" type="checkbox" value="underline"><label><?=$underlineLocal?></label>
		</td>
	</tr>
	<tr>	
		<td width="50%" valign="top">
			<?=$labelColorLocal?><br>
			<span class="Swatch" id="labelFgSwatch" style="color: #000000; background-color: #000000">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_LABEL_FORE_COLOR,false,false)">
			<br><br>
		</td>
		<td width="50%" valign="top">
			<?=$backgroundLocal?><br>
			<span class="Swatch" id="labelBgSwatch" style="color: #FFFFFF; background-color: #FFFFFF">&nbsp;<?=$transparentLocal?>&nbsp;</span>&nbsp;&nbsp;
			<input class="Ctrl" type="button" value="..." style="width: 22px;" onClick="PickColor(SET_LABEL_BACK_COLOR,false,false)">
			<br>
		</td>
	</tr>	
	<tr>
		<td colspan="2">
			<?=$labelBackgroundStyleLocal?><br>
			<select class="Ctrl" name="LABELBACKSTYLE" size="1">
				<option value="Ghosted" selected="selected"><?=$ghostedLocal?></option>
				<option value="Opaque"><?=$opaqueLocal?></option>
				<option value="Transparent"><?=$transparentLocal?></option>
			</select>
		</td>
	</tr>	

	<tr>
		<td colspan="2" align="right">
			<hr>
			<input class="Ctrl" name="" type="submit" value="OK" onClick="return CheckName()" style="width:85px">
			<input class="Ctrl" type="button" value="Cancel" style="width:85px" onClick="return Cancel()">
		</td>
	</tr>

</table>

<input name="MARKERCOLOR" type="hidden" id="markerColor" value="FF0000">
<input name="LINECOLOR" type="hidden" id="lineColor" value="0000FF">
<input name="FILLFORECOLOR" type="hidden" id="fillForeColor" value="00FF00">
<input name="FILLBACKCOLOR" type="hidden" id="fillBackColor" value="00FF00">
<input name="FILLBACKTRANS" type="hidden" id="fillBackTrans" value="true">
<input name="BORDERCOLOR" type="hidden" id="borderColor" value="000000">
<input name="LABELFORECOLOR" type="hidden" id="labelForeColor" value="000000">
<input name="LABELBACKCOLOR" type="hidden" id="labelBackColor" value="FFFFFF">

</form>

<?php } else { ?>

<table class="RegText" border="0" cellspacing="0" width="100%%">
	<tr><td class="Title">Error<hr></td></tr>
	<tr><td><?= $errorMsg ?></td></tr>
	<tr><td><?= $errorDetail ?></td></tr>
</table>

<?php } ?>

</body>

</html>
