<?php
/**
 * CreateSession
 *
 * $Id$
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
 * Purpose: Create a session
 *****************************************************************************/
 
 /* initialize a session and return the session id to the caller */
include(dirname(__FILE__).'/Common.php');
include('../../../common/php/Utilities.php');

$cookie = isset($_COOKIE['session'])?$_COOKIE['session']:"";

initializeSession( "session", "", $cookie);

$sessionId = session_id();
loadFusionConfig();

header('Content-type: application/json');
header('X-JSON: true');
$result = null;
$result->sessionId = $sessionId;
$result->userName = '';
$result->acceptLanguage = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
echo var2json($result);
?>
