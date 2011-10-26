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
	require_once 'classes/markupmanager.php';
	require_once 'classes/markupcommand.php';

	$args = ($_SERVER['REQUEST_METHOD'] == "POST") ? $_POST : $_GET;

	$refreshMap = false;
	$errorMsg = null;
	$errorDetail = null;
	
    SetLocalizedFilesPath(GetLocalizationPath());
    if(isset($_REQUEST['LOCALE'])) {
        $locale = $_REQUEST['LOCALE'];
    } else {
        $locale = GetDefaultLocale();
    }
    
	try
	{
		$markupManager = new MarkupManager($args);
		
		if (array_key_exists('MARKUPCOMMAND', $args))
		{
			$cmd = $args['MARKUPCOMMAND'];
			switch ($cmd) {
			case MarkupCommand::Create:
				$markupManager->CreateMarkup();
				$refreshMap = true;
				break;
			case MarkupCommand::Open:
				$markupManager->OpenMarkup();
				$refreshMap = true;
				break;
			case MarkupCommand::Delete:
				$markupManager->DeleteMarkup();
				break;
			case MarkupCommand::Refresh:
				break;
			case MarkupCommand::Close:
				$markupManager->CloseMarkup();
				$refreshMap = true;
				break;
            case MarkupCommand::Download:
                $markupManager->DownloadMarkup();
                break;
			}
		}
		
		$availableMarkup = $markupManager->GetAvailableMarkup();
		$openMarkup = $markupManager->GetOpenMarkup();
		
		// Remove open markup from the list of available markup.
		
		$availableMarkup = array_diff($availableMarkup, $openMarkup);
        
        $manageLocal = GetLocalizedString('REDLINEMANAGE', $locale );
        $availableLayersLocal = GetLocalizedString('REDLINEAVAILABLELAYERS', $locale );
        $loadedLayersLocal = GetLocalizedString('REDLINELOADEDLAYERS', $locale );
        $newLocal = GetLocalizedString('REDLINENEW', $locale );
        $addToMapLocal = GetLocalizedString('REDLINEADDTOMAP', $locale );
        $deleteLocal = GetLocalizedString('REDLINEDELETE', $locale );
        $refreshLocal = GetLocalizedString('REDLINEREFRESH', $locale );
        $addEditLocal = GetLocalizedString('REDLINEEDIT', $locale );
        $removeFromMapLocal = GetLocalizedString('REDLINEREMOVEFROMMAP', $locale );
        $downloadLocal = GetLocalizedString('REDLINEDOWNLOADSDF', $locale );
	}
	catch (MgException $mge)
	{
		$errorMsg = $mge->GetMessage();
		$errorDetail = $mge->GetDetails();
	}
	catch (Exception $e)
	{
		$errorMsg = $e->GetMessage();
	}
?>
<html>
<head>
	<title>Manage Markups</title>
    <link rel="stylesheet" href="Redline.css" type="text/css">
	
	<script language="javascript">
        var session = '<?= $args['SESSION'] ?>';
        var mapName = '<?= $args['MAPNAME'] ?>';
	
		var CMD_NEW 	= <?= MarkupCommand::Create ?>;
		var CMD_OPEN	= <?= MarkupCommand::Open ?>;
		var CMD_DELETE	= <?= MarkupCommand::Delete ?>;
		var CMD_REFRESH	= <?= MarkupCommand::Refresh ?>;
		var CMD_EDIT	= <?= MarkupCommand::Edit ?>;
		var CMD_CLOSE	= <?= MarkupCommand::Close ?>;
        var CMD_DOWNLOAD = <?= MarkupCommand::Download ?>;
			
		function SubmitCommand(cmd)
		{
            var commandInput = document.getElementById("commandInput");
			commandInput.value = cmd;

            var markupForm = document.getElementById("markupForm");
			if (cmd == CMD_NEW)
				markupForm.action = "newmarkup.php";
			else if (cmd == CMD_EDIT)
				markupForm.action = "editmarkup.php";
			else
				markupForm.action = "markupmain.php";
					
			markupForm.submit();
		}
		
		function OnAvailableMarkupChange()
		{
            var availableSelect = document.getElementById("availableMarkup");
			var openBtn = document.getElementById("openBtn");
			var deleteBtn = document.getElementById("deleteBtn");
            var downloadBtn = document.getElementById("downloadBtn");
			
			if (availableSelect.selectedIndex >= 0)
			{
				openBtn.disabled = false;
				deleteBtn.disabled = false;
                downloadBtn.disabled = false;
			}
			else
			{
				openBtn.disabled = true;
				deleteBtn.disabled = true;
                downloadBtn.disabled = true;
			}
		} 

		function OnOpenMarkupChange()
		{
            var openSelect = document.getElementById("openMarkup");
			var editBtn = document.getElementById("editBtn");
			var closeBtn = document.getElementById("closeBtn");
			
			if (openSelect.selectedIndex >= 0)
			{
				editBtn.disabled = false;
				closeBtn.disabled = false;
			}
			else
			{
				editBtn.disabled = true;
				closeBtn.disabled = true;
			}
		} 
		
		function OnLoad()
		{
			OnAvailableMarkupChange();
			OnOpenMarkupChange();
		
		<?php if ($refreshMap) { ?>
			var map = parent.Fusion.getMapByName(mapName);
            map.reloadMap();
		<?php } ?>
		}
	</script>
	
</head>

<body onLoad="OnLoad()" marginwidth=5 marginheight=5 leftmargin=5 topmargin=5 bottommargin=5 rightmargin=5>

<?php if ($errorMsg == null) { ?>

<form action="" method="post" enctype="application/x-www-form-urlencoded" id="markupForm" target="_self">
<table class="RegText" border="0" cellspacing="0" width="100%">
	<tr><td class="Title"><?=$manageLocal?><hr></td></tr>
	<tr><td class="SubTitle"><?=$availableLayersLocal?></td></tr>
	<tr>
		<td class="RegText">
			<select name="MARKUPLAYER" size="15" class="Ctrl" id="availableMarkup" onChange="OnAvailableMarkupChange()" style="width: 100%">
				<?php
					$selected = 'selected';
					foreach($availableMarkup as $markupResId => $markupName) {
				?>
				<option value="<?= $markupResId ?>" <?=$selected ?> ><?= $markupName ?></option> 
				<?php
						$selected = ''; 
					} 
				?>
		  	</select>
		</td>
	</tr>
	<tr>
		<td>
			<input class="Ctrl" type="button" id="newBtn" onClick="SubmitCommand(CMD_NEW)" value="<?=$newLocal?>" style="width:85px">
			<input class="Ctrl" type="button" id="openBtn" onClick="SubmitCommand(CMD_OPEN)" value="<?=$addToMapLocal?>" style="width:85px">
			<input class="Ctrl" type="button" id="deleteBtn" onClick="SubmitCommand(CMD_DELETE)" value="<?=$deleteLocal?>" style="width:85px">
			<input class="Ctrl" type="button" id="refreshBtn" onClick="SubmitCommand(CMD_REFRESH)" value="<?=$refreshLocal?>" style="width:85px">
            <input class="Ctrl" type="button" id="downloadBtn" onClick="SubmitCommand(CMD_DOWNLOAD)" value="<?=$downloadLocal?>" style="width:85px">
			<br><br>
		</td>
	</tr>
	<tr><td class="SubTitle"><?=$loadedLayersLocal?></td></tr>
	<tr>
		<td class="RegText">
			<select name="OPENMARKUP" size="10" class="Ctrl" id="openMarkup" onChange="OnOpenMarkupChange()" style="width: 100%">
				<?php
					$selected = 'selected';
					foreach($openMarkup as $markupLayer => $markupName) {
				?>
				<option value="<?= $markupLayer ?>" <?=$selected ?> ><?= $markupName ?></option> 
				<?php
						$selected = ''; 
					} 
				?>
		  	</select>
		</td>
	</tr>
	<tr>
		<td>
			<input class="Ctrl" type="button" id="editBtn" onClick="SubmitCommand(CMD_EDIT)" value="<?=$addEditLocal?>" style="width:125px">
			<input class="Ctrl" type="button" id="closeBtn" onClick="SubmitCommand(CMD_CLOSE)" value="<?=$removeFromMapLocal?>" style="width:125px">
			<br><br>
		</td>
	</tr>	
</table>
<input name="SESSION" type="hidden" value="<?= $args['SESSION'] ?>">
<input name="MAPNAME" type="hidden" value="<?= $args['MAPNAME'] ?>">
<input name="MARKUPCOMMAND" type="hidden" value="" id="commandInput">
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
