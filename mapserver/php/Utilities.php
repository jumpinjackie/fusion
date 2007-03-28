<?php
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

?>