/**
 * Created by RoiCohen on 23/04/2017.
 */


//Variables
var g_x;
var g_y;
var g_map;
var g_polyCordinate=[];
var g_choose_file;
var g_choose_xml;
var lable = 'Closest place';
var labelIndex = 0;

var inside=false;

/*Handle with which file do you wanna work with.*/
function onLoad(){
    var badSample='https://raw.githubusercontent.com/RoiZundak/PDAC/master/Bad%20sample.kml';
    var AllowedArea='https://raw.githubusercontent.com/RoiZundak/PDAC/master/AllowedArea.kml';
    var xmlDocAllowedArea = $($.parseXML(getSelectedFileContent('../Files/AllowedArea.kml')));
    var xmlDocBadSample = $($.parseXML(getSelectedFileContent('../Files/Bad sample.kml')));
    g_choose_file = AllowedArea;
    g_choose_xml=xmlDocAllowedArea;
    $('#2').click();
    $('#1,#2').change( function(){
        if ($(this).val()=='bad'){
            g_choose_file=badSample;
            g_choose_xml=xmlDocBadSample;
            $('#x').val("");
            $('#y').val("");
            $('#text').html("Please Insert cordinate: X and Y");
            initMap();
            parseKml();

        }
        else if($(this).val()=='allw'){
            g_choose_file = AllowedArea;
            g_choose_xml=xmlDocAllowedArea;
            $('#x').val("");
            $('#text').html("Please Insert cordinate: X and Y");
            initMap();
            parseKml();
        }

    });
}

/*function to send the new cordinate that the user inserted.
 * checks if coordinates are fine.
 * place the new marker .
 * Parse the kml.
 * find closest way to poly check if inside Or NOT.
 */
function sendCordainate() {

    g_x=parseFloat($('#x').val());
    g_y=parseFloat($('#y').val());
    if((g_x>=0 || g_y>=0) ||((g_x<=0 || g_y<=0) )){
        $('#x').val("");
        $('#y').val("");

        var uluru = {lat: g_x, lng: g_y};
        var marker = new google.maps.Marker({
            position: uluru,
            map: g_map,
        });
        var polyCoordinates = parseKml();
        var closestPoint = getClosestToPolygon(polyCoordinates, {x:g_x,y:g_y});
        var distance=Math.abs(closestPoint.x-g_x);
        //change the HTML
        if(inside==false){

            $('#text').html("New Cordinates: X:"+g_x+" Y: "+g_y +"</br>Distance:"+distance+",Outside Poly");
            var marker2 = new google.maps.Marker({
                position: {lat: closestPoint.y, lng: closestPoint.x},
                map: g_map,
                label: lable
            });
        }
        else
            $('#text').html("New Cordinates: X:"+g_x+" Y: "+g_y +"</br>"+"Inside Poly");
        doesPolyContainsPoint(uluru, polyCoordinates);
    }
    else
        alert("No Input");
}

/*Handle 'GET' request to work on XML file.*/
function getSelectedFileContent(filename) {
    var request = new XMLHttpRequest();
    request.open("GET", filename, false);
    request.send(null);
    return request.responseText;
}
/*Parse the XML into an array.*/
function parseKml(){
    var coordinates;
    var arrCoordinates=[];
    var counter1=0;
    var counter2=0;

    // build an xmlObj for parsing
    var placemarks = g_choose_xml.find("Placemark");
    placemarks.each(function (index) {
        if ($(this).find("Polygon").length > 0) {
            tipoGeom = "Polygon";
            tmpHtml = $(this).find("Polygon").find("outerBoundaryIs").find("coordinates").html();
        }
        var tmpArr = tmpHtml.split(',');
        var strCoordinatesArray = [];

        //remove the leading zeros
        tmpArr.forEach(function(item){
            strCoordinatesArray.push(item.replace(/^0 /, ''));
        });
        for (i = 0; i < strCoordinatesArray.length; i+=2) {
            var co1 = parseFloat(strCoordinatesArray[i]);
            var co2 = parseFloat(strCoordinatesArray[i + 1]);
            var newLatLng = {x: co1, y: co2};
            g_polyCordinate.push("{lat: "+newLatLng.x+", lng: "+newLatLng.y+"}");
            arrCoordinates.push(newLatLng);
        }
    });


    return arrCoordinates;
}

/*Handle if there is no Poly*/
function doesPolyContainsPoint(point, poly_x_y_arr){
    var latLngArr=[];
    for(i=0;i<poly_x_y_arr.length;i++){
        latLngArr[i]=point.x,point.y;
    }
}

/*show the KML file and pin the location from the user(call from body HTML and from sendCordinate() function).*/
function initMap() {
    if (isNaN(g_x) && isNaN(g_y)) {
        var uluru = {lat: 32.085641, lng: 34.775450};
    }
    else
        var uluru = {lat:g_x, lng:g_y};
    g_map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: uluru
    });


    var ctaLayer = new google.maps.KmlLayer({
        url: g_choose_file,
        suppressInfoWindows: true,
        map: g_map
    });

    google.maps.event.addListener(ctaLayer, 'status_changed', function () {
        print('status: ' + ctaLayer.getStatus());
    });
}
/*Get the closest way to polygon use getDistance after taking the best 2 points*/
function getClosestToPolygon(polyCoordinates, point){

    var minDistance = null;
    var closestPoint = null;

    for (var n = 1 ; n < polyCoordinates.length - 1 ; n++) {

        var pointCandidate = getClosestPointOnShape(polyCoordinates[n-1], polyCoordinates[n], point);
        var distance = getDistance(pointCandidate, point);
        if(minDistance == null || distance < minDistance){
            minDistance = distance;
            closestPoint = pointCandidate;
        }
    }
    return closestPoint;
}

/*get the distance using Pythagoras sentence*/
function getDistance(p1, p2) {
    return (Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
}

/*take calls from getClosest in for loop to calculate the new xDelta and yDelta each time update the closest
* point if the u is greater/smaller or zero update also if the inside the poly*/
function getClosestPointOnShape(segmentStartPoint, segmentEndPoint, point) {

    var xDelta = segmentEndPoint.x - segmentStartPoint.x;
    var yDelta = segmentEndPoint.y - segmentStartPoint.y;


    var u = ((point.x - segmentStartPoint.x) * xDelta + (point.y - segmentStartPoint.y) * yDelta) / (xDelta * xDelta + yDelta * yDelta);
    var closestPoint;
    if (u < 0){
        inside=false;
        closestPoint = {x: segmentStartPoint.x, y: segmentStartPoint.y};
    }
    else if (u > 1){
        inside=false;
        closestPoint = {x: segmentEndPoint.x, y: segmentEndPoint.y};
    }

    else{
        inside=true;
        closestPoint = {x: segmentStartPoint.x + u * xDelta, y: segmentStartPoint.y + u * yDelta};
    }
    return closestPoint;
}
function print(str){
    console.log(str);
}