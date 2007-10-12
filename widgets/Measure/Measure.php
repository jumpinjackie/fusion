<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
    "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <title>Measure</title>
    <style type="text/css" media="screen">
        @import url(Measure.css);
    </style>
    <script type="text/javascript" charset="utf-8">
        var Fusion;
        var measureWidget;
        var totalDistance = 0;
        window.onload = function() {
            Fusion = window.top.Fusion;
            var measureWidgets = Fusion.getWidgetsByType('Measure');
            measureWidget = measureWidgets[0];
            measureWidget.registerForEvent(Fusion.Event.MEASURE_NEW_SEGMENT, measureNewSegment);
            measureWidget.registerForEvent(Fusion.Event.MEASURE_SEGMENT_UPDATE, measureSegmentUpdate);
            measureWidget.registerForEvent(Fusion.Event.MEASURE_SEGMENT_COMPLETE, measureSegmentComplete);
            measureWidget.registerForEvent(Fusion.Event.MEASURE_CLEAR, measureClear);  
        };
        
        function measureNewSegment(eventId, widget, segment) {
            var tbody = document.getElementById('segmentTBody');
            var segmentId = tbody.childNodes.length + 1;
            var tr = document.createElement('tr');
            tr.segment = segment;
            var td = document.createElement('td');
            td.innerHTML = 'Segment '+segmentId;
            tr.appendChild(td);
            var td = document.createElement('td');
            td.innerHTML = '...';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        
        function measureSegmentUpdate(eventId, widget, segment, distance) {
            var distanceText = 'calculating ...';
            var distanceValue = 0;
            if (distance) {
                distanceText = distance;
                distanceValue = parseFloat(distance);
            } else {
                
            }
            var tbody = document.getElementById('segmentTBody');
            for (var i=0; i<tbody.childNodes.length; i++) {
                if (tbody.childNodes[i].segment == segment) {
                    tbody.childNodes[i].childNodes[1].innerHTML = distanceText;
                }
            }
            var tDist = document.getElementById('totalDistance');
            tDist.innerHTML = totalDistance + distanceValue;
        }
        
        function measureSegmentComplete(eventId, widget, segment, distance) {
            measureSegmentUpdate(eventId, widget, segment, distance);
            totalDistance += distance;
        }
        
        function measureClear() {
            var tbody = document.getElementById('segmentTBody');
            while(tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }
            totalDistance = 0;
            var tDist = document.getElementById('totalDistance');
            tDist.innerHTML = totalDistance;
        }
    </script>
</head>
<body id="MeasurementWidgetResults">
    <h1>Measurement Results</h1>
    <table id="MeasurementWidgetResultsTable" border="0" cellspacing="5" cellpadding="5">
        <thead>
            <tr>
                <th>Segment</th>
                <th>Length</th>
            </tr>
        </thead>
        <tbody id="segmentTBody"></tbody>
        <tfoot>
            <tr>
                <th>Total</th>
                <td id="totalDistance"></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>