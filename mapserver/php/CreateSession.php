<?php
/*****************************************************************************
 * $Id$
 * Purpose: Create a session
 * Project: Fusion
 * Author:  DM Solutions Group Inc
 * Copyright (c) 2007 DM Solutions Group Inc.
 *****************************************************************************
 * This code shall not be copied or used without the expressed written consent
 * of DM Solutions Group Inc.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 *****************************************************************************/
 
 /* initialize a session and return the session id to the caller */
include(dirname(__FILE__).'/Common.php');

initializeSession( "sid", "", "" );
$sessionId = session_id();

header('content-type: text/xml');
echo "<!--".getSessionSavePath()."-->";
echo "<mapserveresession>";
echo "<sessionid>$sessionId</sessionid>";
echo "</mapserveresession>";
?>
