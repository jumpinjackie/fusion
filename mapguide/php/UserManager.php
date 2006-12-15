<?php
/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: manage user login and preferences
 *
 * Project: Fusion
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2006, DM Solutions Group Inc.
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
include('MGCommon.php');

/////////////////
//CONFIGURATION//
/////////////////

putenv('TMP=C:/temp');
define('DB_LOCATION', "c:\\temp\\users.sqlite");
define('SALT', "U2FsdGVkX1/TY2/7nsjOUmLc/sOW4O8z+/zmyQQjy3k=");

//define account for elevated permissions needed to add a user
define('MG_ADMIN_USER', 'NanaimoAdmin');
define('MG_ADMIN_PASSWD', 'admin');
define('MG_USER_DIRECTORY_ROOT', 'Library://Nanaimo/Users/');

//array of preferences and their default value;
// global $aszInitialPrefs;
// $aszInitialPrefs = array('extents' => '-81, 43,-87,50',
//                          'interface' => 'basic'
//                          );

////////////////////////
//END OF CONFIGURATION//
////////////////////////

// ==================
// = handle request =
// ==================
$command = isset($_REQUEST['COMMAND'])?$_REQUEST['COMMAND']:NULL;
if ($command) {
    $manager = new MGUserManager(NULL);
    switch ( $command )
    {
        case 'LOGIN':
            header('Content-type: text/xml');
            $preferences = $manager->Login($_REQUEST['username'], $_REQUEST['password']);
            if ($preferences) {
                echo $preferences;
            } else {
                echo '<ERROR>Bad username or password.</ERROR>';
            }
        break;
        case 'REGISTER':
        $manager->AddUser($_REQUEST['newusername'], $_REQUEST['newpassword'],
                            $_REQUEST['firstname'], $_REQUEST['surname']);            
        break;
        case 'SETUSERPREF':
            //TODO use current user, not query id 
            $manager->SetUserPref($_REQUEST['userid'], $_REQUEST['prefid'],
                                $_REQUEST['userprefvalue']);
        break;
    }
}

// ====
// = MGUserManager - a class for manipulating the a user database
// = storing preferences and managing valid users.
// ====
Class MGUserManager {

    private $db = null;
    private $site = null;
    private $currentUserId = null;
    private $aszInitialPrefs = array('Extents' => '-81, 43,-87,50',
                             'Mode' => 'advanced',
                             'Keymap' => 'True',
                             'SelectionType' => 'INTERSECTS',
                             'ToolUnits' => 'metres',
                             'Print_ShowTitle'=>'True',
                             'Print_Title'=>'Nanaimo Map',
                             'Print_ShowLegend'=>'True',
                             'Print_ShowNorthArrow'=>'True'
                        );
    
    function __construct($args) {

        //debug
        //if(file_exists(DB_LOCATION)) { unlink(DB_LOCATION);}

        global $siteConnection;
        global $user;
        $this->site = $siteConnection->GetSite();
        $this->site->Open($user);

        $createTables = (file_exists(DB_LOCATION))?false:true;
        $this->db = new SQLiteDatabase(DB_LOCATION);

        if ($createTables) {
            //build db tables
            $this->db->query("CREATE TABLE users (userid INTEGER PRIMARY KEY,
                                username VARCHAR(255) NOT NULL UNIQUE,
                                password VARCHAR ( 255 ) NOT NULL,
                                firstname VARCHAR ( 255 ),
                                surname VARCHAR ( 255 ));");
            $this->db->query("CREATE TABLE prefs (prefid INTEGER PRIMARY KEY, name VARCHAR ( 255 ) NOT NULL, default_value VARCHAR ( 255 ));");
            $this->db->query("CREATE TABLE user_prefs (userid INTEGER NOT NULL, prefid INTEGER NOT NULL, value VARCHAR(255));");
            //add default preferences;
            $szPrefsSQL = '';
            // $aszInitialPrefs = array('Extents' => '-81, 43,-87,50',
            //                          'Mode' => 'advanced',
            //                          'Keymap' => 'True',
            //                          'SelectionType' => 'INTERSECTS',
            //                          'ToolUnits' => 'metres',
            //                          'Print_ShowTitle'=>'True',
            //                          'Print_Title'=>'Nanaimo Map',
            //                          'Print_ShowLegend'=>'True',
            //                          'Print_ShowNorthArrow'=>'True'
            //                     );
            foreach($this->aszInitialPrefs as $key => $value) {
                $szPrefsSQL .= 'INSERT INTO prefs (name, default_value) VALUES ("'.$key.'","'.$value.'");';
            }
            if ($szPrefsSQL != ''){
                $this->db->queryExec($szPrefsSQL);
            }
        }
        
    }


     // = =======================================================================
     // = AddUser will be invoked with new user credentials assuming login failed
     // = in MgCommon
     // = =======================================================================           
    function AddUser ($username, $password,
                             $firstName, $surName
                             // $street, $city,
                            //$province, $postcode = ''
                     ) {
        $encryptedPassword = crypt($password, SALT);
        $success = $this->db->queryExec('INSERT INTO users (username, password, firstname, surname) VALUES ("'.$username.'", "'.$encryptedPassword.'", "'.$firstName.'", "'.$surName.'" );');
        if ($success) {
            $userId = $this->db->lastInsertRowid();
            try {
                $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
                $siteConnection = new MgSiteConnection();
                $siteConnection->Open($user);
                $site = $siteConnection->GetSite();
                $site->AddUser($username, $username, $password, $firstName." ".$surName);                
                //set author role
                $usersToGrant = new MgStringCollection();
                $roleToUpdate = new MgStringCollection();
                $roleToUpdate->Add( MgRole::Author );
                $usersToGrant->Add( $username ) ;
                $site->GrantRoleMembershipsToUsers( $roleToUpdate, $usersToGrant );                
                
                // Create user directory in repository:
                // Create Header
                $headerContent = $this->GetUserFolderHeader($username);
                $header_byteSource = new MgByteSource($headerContent, strlen($headerContent));
                $header_byteSource->setMimeType("text/xml");
                $header_byteReader = $header_byteSource->GetReader();

                $resourceService = $siteConnection->CreateService(MgServiceType::ResourceService);

                // Create Folder
                $id = new MgResourceIdentifier(MG_USER_DIRECTORY_ROOT.$username.'/');
                $resourceService->SetResource($id, NULL, $header_byteReader);

                //setup default prefs
                foreach($this->aszInitialPrefs as $key => $value) {
                    $result = $this->db->SingleQuery('SELECT prefid FROM prefs WHERE name="'.$key.'";');
                    if ($result) {
                        $prefid = $result;
                    }
                    //TODO: improve efficiency by combining queries
                    $this->AddUserPref($userId, $prefid, $value);
                }
            } catch (MgDuplicateUserException $du_e) {
                echo '<ERROR>Duplicate user!</ERROR>';
                return FALSE;
            } catch (MgException $e) {
                echo "ERROR: " . $e->GetMessage() . "\n";
                echo $e->GetDetails() . "\n";
                echo $e->GetStackTrace() . "\n";
                return FALSE;
            }

            return $userId;
        }
    }
    
    function DeleteUser ($userId, $userName) {
        $success = $this->db->queryExec('DELETE FROM users WHERE userid ='.$userId.';'.
                                        'DELETE FROM user_prefs WHERE userid ='.$userId.';');
        if ($success) {
            $userId = $this->db->lastInsertRowid();
            try {
                $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
                $siteConnection = new MgSiteConnection();
                $siteConnection->Open($user);
                $users = new MgStringCollection();
                $users->Add($userName);
                if (!$users->GetCount()) {
                    //throw
                    return "<error>User was not deleted from MapGuide Server.</error>";                    
                }
                $siteConnection->GetSite()->DeleteUsers($users);
            } catch (MgException $e) {
                return "<error>User was not deleted from MapGuide Server.</error>";
            }
            return $userId;
        }else {
            //couldn't create the user - not unique
            return FALSE;
        }
    }
    
    function AddPref ($name, $defaultValue) {        
        $this->db->query('INSERT INTO prefs (name, default_value) VALUES ("'.$name.'","'.$defaultValue.'");');
        return $this->db->lastInsertRowid();
    }

    function SetUserPref($userId, $prefId, $value) {
        // use default value from prefs table if value is not supplied.        
        if ($value == '') {
            $result = $this->db->SingleQuery('SELECT default_value FROM prefs WHERE prefid='.$prefId.';');
            if ($result) {
                 $value = $result;
            }
        }
        //determine if the pref already exists for this user
        $test = $this->db->query('SELECT userid FROM user_prefs WHERE userid='.$userId.
                                 ' AND prefid='.$prefId.';');
        if ($test->numRows()) {
            $this->db->queryExec('UPDATE user_prefs SET value="'.$value.'" WHERE userid='.
                                 $userId.' AND prefid='.$prefId.';');
        }else{
            $this->db->queryExec('INSERT INTO user_prefs (userid, prefid, value) VALUES ('.
                                 $userId.', '.$prefId.', "'.$value.'");');
            return $this->db->lastInsertRowid();           
        }
    }

    function AddUserPref ($userId, $prefId, $value) {
        $this->db->queryExec('INSERT INTO user_prefs (userid, prefid, value) VALUES ('.$userId.', '.$prefId.', "'.$value.'");');
        return $this->db->lastInsertRowid();
    }

    function Login($username, $password) {
        $encryptedPassword = crypt($password, SALT);
        $result = $this->db->query('SELECT password, userid, prefs.name FROM users, prefs WHERE username = "'.$username.'";');
        if ($result) {
            $aRow = $result->fetch(SQLITE_ASSOC);
            if ($encryptedPassword == ($aRow['password'])) {
                $userId = $aRow['userid'];
                $result = $this->db->query('SELECT * from user_prefs, prefs WHERE userid = '.$userId.' AND user_prefs.prefid = prefs.prefid;');
                $szOut = '';
                if ($result) {
                    $szOut = '<preferences>';
                    while ($aRow = $result->fetch(SQLITE_ASSOC)) {
                        $szOut .= '<pref>';
                        $szOut .= '<name>';
                        $szOut .= $aRow['prefs.name'];
                        $szOut .= '</name>';
                        $szOut .= '<value>';
                        $szOut .= $aRow['user_prefs.value'];
                        $szOut .= '</value>';
                        $szOut .= '</pref>';
                    }
                    $szOut .= '</preferences>';
                }
                //create a session in mg
                //$user = new MgUserInformation($_REQUEST['username'], $_REQUEST['password']);
                //$user->SetMgSessionId($sessionID);
                
                return $szOut;
            }
        } else {
            return FALSE;
        }
    }
    
    //
    //TODO secure these functions so only admin can get values
    //
    function GetUserPrefs($userId) {
        $result = $this->db->query('SELECT * from user_prefs, prefs WHERE userid = '.$userId.' AND user_prefs.prefid = prefs.prefid;');
        return $result->FetchAll(SQLITE_ASSOC);
    }

    function GetUsers() {
        $result = $this->db->query('SELECT userid, username, firstname, surname FROM users;');
        return $result->FetchAll(SQLITE_ASSOC);
    }
    
    function GetPrefs() {
        $result = $this->db->query('SELECT prefid, name, default_value FROM prefs;');
        return $result->FetchAll(SQLITE_ASSOC);
    }

    function GetUserFolderHeader($user){
        $szContent = sprintf('<?xml version="1.0" encoding="utf-8"?>
        <ResourceFolderHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xsi:noNamespaceSchemaLocation="ResourceFolderHeader-1.0.0.xsd">
          <Security xsi:noNamespaceSchemaLocation="ResourceSecurity-1.0.0.xsd">
            <Inherited>false</Inherited>
            <Users>
              <User>
                <Name>%s</Name>
                <Permissions>r,w</Permissions>
              </User>
            </Users>
          </Security>
        </ResourceFolderHeader>',$user);
        return $szContent;
    }
    
    /* remove all managed users */
    function Clean() {
        $aUsers = $this->GetUsers();
        foreach ($aUsers as $user) {
            $this->DeleteUser($user['userid'], $user['username']); 
        }
    }
    
    /* enumerate groups - this requires admin privileges */
    function GetGroups($username=NULL) {
        $aGroups = array();
        try {
            $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
            $siteConnection = new MgSiteConnection();
            $siteConnection->Open($user);
            $site = $siteConnection->GetSite();
            if ($username) {
                $byteReader = $site->EnumerateGroups($username, '');
            } else {
                $byteReader = $site->EnumerateGroups();
            }
            $xmldoc = DOMDocument::loadXML(ByteReaderToString($byteReader));
            $groupNodeList = $xmldoc->getElementsByTagName('Group');
            for ($i=0; $i<$groupNodeList->length; $i++) {
                $group = $groupNodeList->item($i);
                $nameElt = $group->getElementsByTagName('Name');
                $name = $nameElt->item(0)->nodeValue;
                $descElt = $group->getElementsByTagName('Description');
                $description = $descElt->item(0)->nodeValue;
                array_push($aGroups, array('name'        => $name,
                                           'description' => $description));
            }            
        } catch (MgException $e) {
            echo "ERROR: " . $e->GetMessage() . "\n";
            echo $e->GetDetails() . "\n";
            echo $e->GetStackTrace() . "\n";
        }
        return $aGroups;
    }
    
    function AddGroup($name, $description) {
        try {
            $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
            $siteConnection = new MgSiteConnection();
            $siteConnection->Open($user);
            $site = $siteConnection->GetSite();
            $site->AddGroup($name, $description);
        } catch (MgException $e) {
            return FALSE;
        }
        return TRUE;
    }
        
    function RemoveGroup($group) {
        try {
            $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
            $siteConnection = new MgSiteConnection();
            $siteConnection->Open($user);
            $site = $siteConnection->GetSite();
            $groups = new MgStringCollection();
            $groups->Add( $group ) ;
            $site->DeleteGroups($groups);
        } catch (MgException $e) {
            echo "ERROR: " . $e->GetMessage() . "\n";
            echo $e->GetDetails() . "\n";
            echo $e->GetStackTrace() . "\n";
            return FALSE;
        }
        return TRUE;
        
    }
    
    function AddUserToGroup($group, $username) {
        try {
            $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
            $siteConnection = new MgSiteConnection();
            $siteConnection->Open($user);
            $site = $siteConnection->GetSite();
            $userToGrant = new MgStringCollection();
            $userToGrant->Add( $username ) ;
            $groupToUpdate = new MgStringCollection();
            $groupToUpdate->Add( $group );
            $site->GrantGroupMembershipsToUsers($groupToUpdate, $userToGrant);
        } catch (MgException $e) {
            echo "ERROR: " . $e->GetMessage() . "\n";
            echo $e->GetDetails() . "\n";
            echo $e->GetStackTrace() . "\n";
            return FALSE;
        }
        return TRUE;
    }
    
    function RemoveUserFromGroup($group, $username) {
        try {
            $user = new MgUserInformation(MG_ADMIN_USER, MG_ADMIN_PASSWD);
            $siteConnection = new MgSiteConnection();
            $siteConnection->Open($user);
            $site = $siteConnection->GetSite();
            $userToRemove = new MgStringCollection();
            $userToRemove->Add( $username ) ;
            $groupToUpdate = new MgStringCollection();
            $groupToUpdate->Add( $group );
            $site->RevokeGroupMembershipsFromUsers($groupToUpdate, $userToRemove);
        } catch (MgException $e) {
            return FALSE;
        }
        return TRUE;
    }
    
}
function ByteReaderToString($byteReader)
{
    $buffer = '';
    do
    {
        $data = str_pad("\0", 50000, "\0");
        $len = $byteReader->Read($data, 50000);
        if ($len > 0)
        {
            $buffer = $buffer . substr($data, 0, $len);
        }
    } while ($len > 0);

    return $buffer;
}

function Test() {
    $manager = new MGUserManager(NULL);
    $prefId = $manager->AddPref('map', 'Sheboygan');
    $prefId2 = $manager->AddPref('color', 'Blue');
    $userId = $manager->AddUser('bob', 'foo', 'Bob', 'Loblaws');
    if (!$userId) {
        echo "<error>User could not be created</error>";
        exit;
    }
    $manager->AddUserPref($userId, $prefId, 'MyMap');
    $manager->AddUserPref($userId, $prefId2, 'Red');
    $manager->SetUserPref($userId, $prefId, 'MyMapModified');
    
    echo $manager->Login('bob', 'foo');

    $manager->DeleteUser($userId, 'bob');
    
}
?>