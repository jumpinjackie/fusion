<?php
function xml2json($domElement) {
    $result = '';
    if ($domElement->nodeType == XML_COMMENT_NODE) {
        return '';
    }
    if ($domElement->nodeType == XML_TEXT_NODE) {
        /* text node, just return content */
        $text = trim($domElement->textContent);
        if ($text != '') {
            $result = '"'.$text.'"';
        } else {
            $text = '""';
        }
    } else {
        /* some other kind of node, needs to be processed */
        
        $aChildren = array();
        $aValues = array();
        
        /* attributes are considered child nodes with a special key name
           starting with @ */
        if ($domElement->hasAttributes()) {
            foreach($domElement->attributes as $key => $attr) {
                $len = array_push($aValues, array('"'.$attr->value.'"'));
                $aChildren['@'.$key] = $len-1;
            }
        }
        
        if ($domElement->hasChildNodes()) {
            //has children
            foreach($domElement->childNodes as $child) {
                if ($child->nodeType == XML_COMMENT_NODE) {
                    continue;
                }
                if ($child->nodeType == XML_TEXT_NODE) {
                    $text = trim($child->textContent);
                    if ($text == '') {
                        continue;
                    }
                    array_push($aValues, array('"'.$text.'"'));
                } else {
                    $childTag = $child->tagName;
                    $json = xml2json($child);
                    if ($json == '') {
                        continue;
                    }
                    if (array_key_exists($childTag, $aChildren)) {
                        array_push($aValues[$aChildren[$childTag]], $json);
                    } else {
                        $len = array_push($aValues, array($json));
                        $aChildren[$childTag] = $len - 1;
                    }
                }
            }
        }
        
        $nChildren = count($aChildren);
        $nValues = count($aValues);
        
        if ($nChildren == 0 && $nValues == 0) {
            return '';
        }
        
        if ($nValues == 1 && $nChildren == 0) {
            $result .= $aValues[0][0];
        } else {
            $bIsObject = true;
            if ($nChildren != $nValues) {
                $bIsObject = false;
            }
            $result .= $bIsObject ? '{' : '[';
        
            $sep = '';
            $aChildren = array_flip($aChildren);
            for ($i=0; $i<$nValues; $i++) {
                $aValue = $aValues[$i];
                $result .= $sep;
            
                if (isset($aChildren[$i])) {
                    if (!$bIsObject) {
                        $result .= '{';
                    }
                    $result .= '"'.$aChildren[$i].'":';
                }
                //if (count($aValue) > 1) {
                    $result .= '[';
                    $result .= implode(',', $aValue);
                    $result .= ']';
                //} else {
                //    $result .= $aValue[0];
                //}
                if (isset($aChildren[$i]) && !$bIsObject) {
                    $result .= '}';
                }
                $sep = ',';
            }
            $result .= $bIsObject ? '}' : ']';
        }
        
    }
    return $result;
}
?>