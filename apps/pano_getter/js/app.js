/**
 * Pano Getter
 * @author Callum Prentice (2016) / http://callum.com/
 * (Leaning heavily on the work of others - see credits)
 */

var map;
var marker;
var geocoder;
var message_elem;
var pano_loader;

function app() {
    message_elem = document.getElementById("status-container");

    var pos = {
        lat: 37.78360443615261,
        lng: -122.40597724914551
    };
    var lat_lng = new google.maps.LatLng(pos.lat, pos.lng);

    var map_options = {
        zoom: 14,
        center: lat_lng,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: true
    };

    pano_loader = new GSVPANO.PanoLoader({
        zoom: 1
    });

    depth_loader = new GSVPANO.PanoDepthLoader();

    map = new google.maps.Map(document.getElementById("map-container"), map_options);
    set_location(lat_lng);

    google.maps.event.addListener(map, 'click', function(event) {
        set_location(event.latLng);
    });

    geocoder = new google.maps.Geocoder();

    var el = document.getElementById('searchButton');
    el.addEventListener('click', function(event) {
        event.preventDefault();
        find_address(document.getElementById('address').value);
    }, false);

    show_warning('System ready.<br>Click on the map or search for any location to find image and depth panos. Then, click on an image to download it');
}

function set_location(location) {
    if (marker) {
        marker.setMap(null);
    }

    marker = new google.maps.Marker({
        position: location,
        map: map
    });
    marker.setMap(map);

    var msg = "Location set to " + location.lat() + ", " + location.lng();
    show_info(msg);

    load_panos(location);
}

function load_panos(location) {

    pano_loader.load(new google.maps.LatLng(location.lat(), location.lng()));

    pano_loader.onPanoramaLoad = function() {
        var pano_container = document.getElementById('image-pano');
        while (pano_container.firstChild) {
            pano_container.removeChild(pano_container.firstChild);
        }
        pano_container.appendChild(this.canvas);

        var image_filename = "image-pano_" + this.panoId + ".png";
        document.getElementById('download-image').addEventListener('click', function() {
            download_canvas(this, 'image-canvas', image_filename);
        }, false);

        show_info('Street view data ' + this.copyright + '.');

        depth_loader.load(this.panoId);
    };

    pano_loader.onNoPanoramaData = function(msg) {
        show_error("Unable to retrieve panorama for this location because: " + msg);
    };

    depth_loader.onDepthLoad = function() {
        var canvas = document.createElement("canvas");
        canvas.id = 'depth-canvas';
        var context = canvas.getContext('2d');
        canvas.setAttribute('width', this.depthMap.width);
        canvas.setAttribute('height', this.depthMap.height);
        var image = context.getImageData(0, 0, this.depthMap.width, this.depthMap.height);
        for (var y = 0; y < this.depthMap.height; ++y) {
            for (var x = 0; x < this.depthMap.width; ++x) {
                var col = this.depthMap.depthMap[y * this.depthMap.width + x] / 50 * 255;
                image.data[4 * (y * this.depthMap.width + x) + 0] = col;
                image.data[4 * (y * this.depthMap.width + x) + 1] = col;
                image.data[4 * (y * this.depthMap.width + x) + 2] = col;
                image.data[4 * (y * this.depthMap.width + x) + 3] = 255;
            }
        }
        context.putImageData(image, 0, 0);

        var depth_container = document.getElementById('depth-pano');
        while (depth_container.firstChild) {
            depth_container.removeChild(depth_container.firstChild);
        }
        depth_container.appendChild(canvas);

        var image_filename = "depth-pano_" + this.panoId + ".png";
        document.getElementById('download-depth').addEventListener('click', function() {
            download_canvas(this, 'depth-canvas', image_filename);
        }, false);
    };
}

function download_canvas(link, canvas_id, filename) {
    link.href = document.getElementById(canvas_id).toDataURL();
    link.download = filename;
}

function find_address(address) {
    show_info('Retrieving location using Google Geocoder');
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            show_info('Location found');
            set_location(results[0].geometry.location);
        } else {
            show_error("Google was unable to find location because: " + status);
        }
    });
}

function show_info(message) {
    show_message(message, "#aaa");
}

function show_warning(message) {
    show_message(message, "#aa3");
}

function show_error(message) {
    show_message(message, "#f00");
}

function show_message(message, color) {
    message_elem.innerHTML += '<font color="' + color + '">' + message + '</font><br>';
    message_elem.scrollTop = message_elem.scrollHeight;
}
