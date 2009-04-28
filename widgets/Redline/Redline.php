<?php
/**
 * Measure
 *
 * $Id: Measure.php 1665 2008-11-12 21:46:54Z madair $
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
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
          "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
      <title>RedlineTaskPane</title>
    <style type="text/css" media="screen">
        @import url(Redline.css);
    </style>
    </head>
    <body id="RedlineWidget" onload="panelLoaded()">
      <script type="text/javascript">
        function panelLoaded() {
            div = document.createElement("div");
            div.innerHTML = "<div id=\"panelIsLoaded\"/>";
            document.body.appendChild(div);
        }
      </script>

      <h1>Digitizing Options</h1>
      <table id="RedlineWidgetOptions" borders="1">
      
      <tr>
      <th>Select Layer: </th>
      <td>
      <select id="RedlineWidgetLayerList"></select>
      </td>
      </tr>
      <tr>
      <td><!-- dummy col --></td>
      <td>
        <button id="RedlineWidgetNewLayerButton">New</button>
        <button id="RedlineWidgetRenameLayerButton">Rename</button>
        <button id="RedlineWidgetRemoveLayerButton">Remove</button>
      </td>
      </tr>
      <tr>
        <th>Draw:</th>
        <td>
          <input id="RedlineWidgetPointRadio" type="radio" name="RedlineWidgetDrawRadio"/>
          <label for="RedlineWidgetPointeRadio">Point</label>
          <input id="RedlineWidgetLineRadio" type="radio" name="RedlineWidgetDrawRadio"/>
          <label for="RedlineWidgetLineRadio">Line</label>
          <input id="RedlineWidgetRectangleRadio" type="radio" name="RedlineWidgetDrawRadio"/>
          <label for="RedlineWidgetRectangleRadio">Rectangle</label>
          <input id="RedlineWidgetPolygonRadio" type="radio" name="RedlineWidgetDrawRadio"/>
          <label for="RedlineWidgetPolygonRadio">Polygon</label>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <hr/>
          <button id="RedlineWidgetSaveButton">Save</button>
        </td>
      </tr>
      <tr>
        <td id="RedlineWidgetUploadTd" colspan="2"/>
      </tr>
      <tr><td><!-- dummy col --></td></tr>
      <tr>
        <th colspan="2">
          Features
          <hr/>
        </th>
      </tr>
      <tr>
        <td colspan="2">
          <select id="RedlineWidgetFeatureList" size="10">
          </select>
        </td>
      </tr>
      <tr>
        <td>
          <button id="RedlineWidgetRenameFeatureButton">Rename</button>
        </td>
        <td>
          <button id="RedlineWidgetRemoveFeatureButton">Remove</button>
        </td>
      </tr>
      </table>
     
    </body>
  </html>
