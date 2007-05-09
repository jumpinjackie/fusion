<?php
/*****************************************************************************
 * $Id$
 * Purpose: Utility functions
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
 
/* recursively convert a variable to its json representation */
function var2json($var) {
    $result = "";
    if (is_object($var)) {
        $result .= "{";
        $sep = "";
        foreach($var as $key => $val) {
            $result .= $sep.'"'.$key.'":'.var2json($val);
            $sep = ",";
        }
        $result .= "}";
    } else if (is_array($var)) {
        $result .= "[";
        $sep = "";
        for($i=0; $i<count($var); $i++) {
            $result .= $sep.var2json($var[$i]);
            $sep = ",";
        }
        $result .= "]";
    } else if (is_string($var)) {
        $result = "'".$var."'";
    } else if (is_bool($var)) {
        $result = $var ? 'true' : 'false';
    } else {
        $result = $var;
    }
    return $result;
}

function SaveQuery($oMap, $filename) {
    if($filename == null || $filename == '') {
        return false;
    }

    $stream = @fopen($filename, "wb");
    if($stream === FALSE) {
        return false;
    }

    /* count the number of layers with results */
    for($i=0; $i<$oMap->numlayers; $i++) {
        $oLayer = $oMap->getLayer($i);
        if($oLayer->getNumResults() > 0) {
            $n++;    
        }
    }
    fwrite($stream, $n);

    /* now write the result set for each layer */
    for($i=0; $i<$oMap->numlayers; $i++) {
        $oLayer = $oMap->getLayer($i);
        $nResults = $oLayer->getNumResults();
        if( $nResults > 0) {
            fwrite($stream, $i);
            fwrite($stream, $nResults);
            //write the bounds of the result, there are none in php?
            fwrite($stream, (double)0);
            fwrite($stream, (double)0);
            fwrite($stream, (double)0);
            fwrite($stream, (double)0);
            //write each of the results
            for ($j=0; $j<$nResults; $j++) {
                $result = $oLayer->getResult($j);
                fwrite($stream, (int)$result->shapeindex);
                fwrite($stream, (int)$result->tileindex);
                fwrite($stream, (int)$result->classindex);
            }
        }
    }

    fclose($stream);
    return true; 
}

?>