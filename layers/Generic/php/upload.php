<?php
/**
 * Upload
 *
 * $Id: upload.php 1421 2008-06-25 10:59:01Z aboudreault $
 *
 * Copyright (c) 2007, DM Solutions Group Inc.
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
 */

/*****************************************************************************
 * Purpose: Allow a user to upload a file on the server.
            The max file size should be setted in the php5.ini.
 *****************************************************************************/

// the page that this php script should redirect after the upload
$page = $_POST['page'];

if (!isset($page)) {
    die('page not set');
}

$target_path = "/home/aboudreault/opt/fgs/www/htdocs/uploads/";

$target_path = $target_path . basename( $_FILES['uploadedfile']['name']);

if(!move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
    echo "There was an error uploading the file.";
    exit;
}

header( "Location: $page" ) ;

?>