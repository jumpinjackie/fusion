<?php

/*****************************************************************************
 *
 * $Id$
 *
 * Purpose: config information of a mapguide installation
 *
 * Project: MapGuide Open Source 
 *
 * Author: DM Solutions Group Inc
 *
 *****************************************************************************
 *
 * Copyright (c) 2005, DM Solutions Group Inc.
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


//return XML
header('content-type: text/xml');
echo "<serversetting>";
echo "<webagent_url>http://localhost:8008/mapguide/mapagent/mapagent.fcgi?</webagent_url>";
//echo "<webagent_url>/msapps/gmap-mge/htdocs/mge_toolkit/server/redirect.php?s=/mapguide/mapagent/mapagent.fcgi</webagent_url>";
echo "<base_url>http://localhost:8008/msapps/gmap-mge/htdocs/mge_toolkit/</base_url>";
echo "<script_lang>php</script_lang>";
echo "</serversetting>";
