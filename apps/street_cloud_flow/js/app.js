// see http://callum.com for more stuff.
var camera, scene, renderer;
var controls, gui, stats;
var point_cloud;
var point_cloud_material;
var start_lat = 37.800423;
var start_lng = -122.40143999999998;
var max_sv_distance = 80;
var base_lat = start_lat;
var base_lng = start_lng;
var all_pano_ids = [];
var svs = new google.maps.StreetViewService();
var geo_coder = new google.maps.Geocoder();
var stack = 0;
var map = 0;
var point_size = 0.2;
var show_map = true;
var num_points_str = "Loading...";
var preset_location = "";
var geocode_location = "";
var point_step = 2;

function app() {

    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
        return;
    }

    init();
    animate();
}

function init(data) {

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(-80, -80, 0);
    camera.lookAt(0.0, 0.0, 0.0);
    camera.up.set(0.0, -1.0, 0.0)

    var ambient_light = new THREE.AmbientLight(0xcccccc);
    scene.add(ambient_light);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    point_cloud_material = new THREE.PointCloudMaterial({
        size: point_size,
        vertexColors: THREE.VertexColors
    });

    window.addEventListener('resize', on_window_resize, false);
    document.addEventListener('mousedown', on_document_mouse_down, false);

    gui = new dat.GUI();
    var folder1 = gui.addFolder("Settings");
    folder1.add(this, "num_points_str").name("Points").listen();
    folder1.add(this, "point_size", 0.01, 2.0).name("Point size").onChange(function (value) {
        point_cloud_material.size = point_size;
    });
    folder1.add(this, "show_map", false).name("Show map").onChange(function (value) {
        if (value) {
            document.getElementById("map-canvas").className = "show";
        } else {
            document.getElementById("map-canvas").className = "hide";
        }
    });
    folder1.add(this, "my_location").name("My location");
    folder1.add(this, "view_streetview").name("Open Streetview");
    folder1.add(this, "full_screen").name("Full screen");
    folder1.open();
    var folder2 = gui.addFolder("Create");
    folder2.add(this, "max_sv_distance", 10, 200).name("Max distance").listen().onFinishChange(function (value) {
        regenerate_view();
    });
    folder2.add(this, 'point_step', [ '1', '2', '4', '8', '16' ] ).name('Point step').listen().onChange(function (value) {
        point_step = parseInt(value);
        regenerate_view();
    });
    folder2.add(this, 'preset_location', [ 'San Francisco', 'New York', 'Barcelona', 'Hong Kong', ,'Monaco', 'SF Ferry Building' ] ).name('Preset location').onChange(function (value) {
        if ( value === 'San Francisco') {
            start_lat = 37.800423;
            start_lng = -122.40144;
            regenerate_view();
        } else
        if ( value === 'New York') {
            start_lat = 40.741533;
            start_lng = -73.989600;
            max_sv_distance = 80;
            point_step = 2;
            regenerate_view();
        } else
        if ( value === 'Barcelona') {
            start_lat = 41.3803103
            start_lng =  2.174155199999973
            max_sv_distance = 150;
            point_step = 2;
            regenerate_view();
        } else
        if ( value === 'SF Ferry Building') {
            start_lat = 37.795049;
            start_lng = -122.393675;
            max_sv_distance = 80;
            point_step = 1;
            regenerate_view();
        } else
        if ( value === 'Hong Kong') {
            start_lat = 22.2802075;
            start_lng = 114.1601917;
            max_sv_distance = 150;
            point_step = 4;
            regenerate_view();
        } else
        if ( value === 'Monaco') {
            start_lat = 43.735175;
            start_lng = 7.421230;
            max_sv_distance = 150;
            point_step = 2;
            regenerate_view();
        }
    });
    var gl_event = folder2.add(this, "geocode_location").name("Find location");
    gl_event.onFinishChange(function(value) {

        geo_coder.geocode({
                'address': value
            },
            function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    start_lat = results[0].geometry.location.lat();
                    start_lng = results[0].geometry.location.lng();
                    console.log("New lat/ng is", start_lat, start_lng);

                    regenerate_view();
                } else {
                    console.log("Address not found");
                }
            });
        });

    folder2.add(this, "regenerate_view").name("Regenerate");
    folder2.open();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    document.body.appendChild(stats.domElement);

    regenerate_view();
}

function regenerate_view() {

    $("#loading").attr('class', 'show');
    all_pano_ids = [];
    map = null;
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 16,
        center: new google.maps.LatLng(start_lat, start_lng)
    });

    if (point_cloud) {
        scene.remove(point_cloud);
    }

    get_sv_id_by_location(start_lat, start_lng);
}

function full_screen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}

function view_streetview() {
    var svurl = "http://maps.google.com/maps?q=&layer=c&cbll=" + start_lat + "," + start_lng + "4&cbp=11,0,0,0,0";
    window.open(svurl);
}

function my_location() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                start_lat = position.coords.latitude;
                start_lng = position.coords.longitude;
                regenerate_view();
            },
            function () {
                alert("Unable to find your location")
            });
    } else {
        alert("Geolocation not supported")
    }
}

function on_document_mouse_down(event) {
    var element_mouse_over = document.elementFromPoint(event.clientX, event.clientY);

    if (element_mouse_over.id == "about_box") {
        show_about(false);
        return;
    }
}

function get_sv_id_by_location(lat, lng) {

    var search_radius_meters = 50;
    svs.getPanoramaByLocation(new google.maps.LatLng(lat, lng), search_radius_meters,
        function(data, status) {
            if (status === google.maps.StreetViewStatus.OK) {

                base_lat = data.location.latLng.lat();
                base_lng = data.location.latLng.lng();

                new google.maps.Marker({
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 4,
                        fillcolor: "#0000ff",
                        strokeColor: "#000000"
                    },
                    position: new google.maps.LatLng(base_lat, base_lng)
                });

                console.log("get_street_view_data_by_location - OK: base lat/lng = ", base_lat, base_lng);

                get_sv_id_by_id(data.location.pano);
            } else
            if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
                console.error("Unable to get Street View by location - nothing found");
            } else
            if (status === google.maps.StreetViewStatus.UNKNOWN_ERROR) {
                console.error("Unable to get Street View by location - unknown error");
            } else {
                console.error("Unable to get Street View by location");
            }
        });
}

function get_sv_id_by_id(pano_id) {

    stack++;
    svs.getPanoramaById(pano_id,
        function(data, status) {
            if (status === google.maps.StreetViewStatus.OK) {

                var actual_lat = data.location.latLng.lat();
                var actual_lng = data.location.latLng.lng();

                var d = lat_lng_diff(start_lat, start_lng, actual_lat, actual_lng);

                --stack;
                if (d < max_sv_distance) {

                    all_pano_ids.push(pano_id);

                    new google.maps.Marker({
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 2,
                            strokeColor: "#ff0000"
                        },
                        position: new google.maps.LatLng(actual_lat, actual_lng)
                    });

                    for (var i = 0; i < data.links.length; ++i) {
                        if (all_pano_ids.indexOf(data.links[i].pano) === -1) {
                            get_sv_id_by_id(data.links[i].pano);
                        }
                    }
                }

                if (stack === 0) {
                    $("#loading_text").text("Loading depth/pano data")
                    var points_label = 342332;
                    create_point_cloud();
                }
            } else
            if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
                console.error("Unable to get Street View by ID - nothing found");
            } else
            if (status === google.maps.StreetViewStatus.UNKNOWN_ERROR) {
                console.error("Unable to get Street View by ID - unknown error");
            } else {
                console.error("Unable to get Street View by ID");
            }
        });
}

function create_point_cloud() {
    var num_points = 0;
    var axis = new THREE.Vector3(0, 1, 0);
    var geometry = 0;
    var positions = 0;
    var colors = 0;
    var cur_depth_elem = 0;
    var cur_pano_elem = 0;
    var depthmap_width = 0;
    var depthmap_height = 0;
    var pano_promises = [];
    var depth_promises = [];

    for (var n = 0; n < all_pano_ids.length; ++n) {

        var depth_loader = new GSVPANO.PanoDepthLoader();
        depth_loader.load(all_pano_ids[n]);

        var depth_promise = new Promise(function(resolve, reject) {

            depth_loader.onDepthLoad = function() {

                console.log("Loaded depth data", cur_depth_elem + 1, "of", all_pano_ids.length);

                if (geometry === 0) {

                    depthmap_width = this.depthMap.width;
                    depthmap_height = this.depthMap.height;

                    geometry = new THREE.BufferGeometry();
                    num_points = all_pano_ids.length *
                        depthmap_width *
                        depthmap_height /
                        (point_step * point_step);
                    num_points_str = num_points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    positions = new Float32Array(num_points * 3);
                    colors = new Float32Array(num_points * 3);
                }

                var base_offset = cur_depth_elem * depthmap_width * depthmap_height / (point_step * point_step);

                var rotation = this.data.Projection.pano_yaw_deg;
                var actual_lat = this.data.Location.lat;
                var actual_lng = this.data.Location.lng;

                var lat_diff = lat_lng_diff(base_lat, base_lng, actual_lat, base_lng);
                var lng_diff = lat_lng_diff(base_lat, base_lng, base_lat, actual_lng);
                var lat_sign = (base_lat - actual_lat) < 0.0 ? -1 : +1;
                var lng_sign = (base_lng - actual_lng) < 0.0 ? -1 : +1;
                var offset_x = lat_diff * -lat_sign;
                var offset_y = 0; //elevation;
                var offset_z = lng_diff * lng_sign;
                var rot_y = rotation * Math.PI / 180.0;

                for (var y = 0, num = 0; y < depthmap_height; y += point_step) {

                    var lat = (y / depthmap_height) * 180.0 - 90.0;
                    var r = Math.cos(lat * Math.PI / 180.0);

                    for (var x = 0; x < depthmap_width; x += point_step) {

                        var depth = parseFloat(this.depthMap.depthMap[y * depthmap_width + depthmap_width - x]);

                        var lng = (1 - (x / depthmap_width)) * 360.0 - 180.0;
                        var pos = new THREE.Vector3();
                        pos.x = (r * Math.cos(lng * Math.PI / 180.0));
                        pos.y = (Math.sin(lat * Math.PI / 180.0));
                        pos.z = (r * Math.sin(lng * Math.PI / 180.0));
                        pos.multiplyScalar(depth);

                        var matrix = new THREE.Matrix4().makeRotationAxis(axis, rot_y);
                        pos.applyMatrix4(matrix);

                        pos.x += offset_x;
                        pos.y += offset_y;
                        pos.z += offset_z;

                        positions[base_offset * 3 + num * 3 + 0] = isNaN(pos.x) ? 0 : pos.x;
                        positions[base_offset * 3 + num * 3 + 1] = isNaN(pos.y) ? 0 : pos.y;
                        positions[base_offset * 3 + num * 3 + 2] = isNaN(pos.z) ? 0 : pos.z;

                        ++num;
                    }
                }

                ++cur_depth_elem;

                resolve([actual_lat, actual_lng])
            }
        });
        depth_promises.push(depth_promise);

        var pano_loader = new GSVPANO.PanoLoader({
            zoom: 1
        });
        pano_loader.load(all_pano_ids[n]);

        var pano_promise = new Promise(function(resolve, reject) {

            pano_loader.onPanoramaLoad = function() {

                console.log("Loaded pano data", cur_pano_elem + 1, "of", all_pano_ids.length);

                var pano_image_canvas = this.canvas;
                var pano_image_canvas_context = this.canvas.getContext('2d');

                var color_data = pano_image_canvas_context.
                getImageData(0, 0, pano_image_canvas_context.canvas.width,
                    pano_image_canvas_context.canvas.height).data;

                var base_offset = cur_pano_elem * depthmap_width * depthmap_height / (point_step * point_step);

                for (var y = 0, num = 0; y < depthmap_height; y += point_step) {

                    var normalized_y = y / depthmap_height;

                    for (var x = 0; x < depthmap_width; x += point_step) {

                        var normalized_x = (1 - x / depthmap_width);
                        var color_canvas_x = parseInt(normalized_x * pano_image_canvas_context.canvas.width);
                        var color_canvas_y = parseInt(normalized_y * pano_image_canvas_context.canvas.height);
                        var color_index = color_canvas_y * pano_image_canvas_context.canvas.width * 4 + color_canvas_x * 4;
                        colors[base_offset * 3 + num * 3 + 0] = (color_data[color_index + 0]) / 255.0;
                        colors[base_offset * 3 + num * 3 + 1] = (color_data[color_index + 1]) / 255.0;
                        colors[base_offset * 3 + num * 3 + 2] = (color_data[color_index + 2]) / 255.0;

                        ++num;
                    }
                }
                ++cur_pano_elem;

                resolve();
            }
        });

        pano_promises.push(pano_promise);
    }

    Promise.all(depth_promises).then(
        function(data) {
            console.log("Finished depth:");

            Promise.all(pano_promises).then(
                function(data) {
                    console.log("Finished pano:");

                    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                    geometry.computeBoundingBox();
                    point_cloud = new THREE.PointCloud(geometry, point_cloud_material);
                    scene.add(point_cloud);
                    $("#loading").attr('class', 'hide');
                }
            );

        }
    );
}

// from: http://www.movable-type.co.uk/scripts/latlong.html
function lat_lng_diff(lat1, lng1, lat2, lng2) {
    var radius = 6378.137;
    var lat_diff = (lat2 - lat1) * Math.PI / 180;
    var lng_diff = (lng2 - lng1) * Math.PI / 180;
    var arc = Math.sin(lat_diff / 2) * Math.sin(lat_diff / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(lng_diff / 2) * Math.sin(lng_diff / 2);
    var c = 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
    var d = radius * c;
    return d * 1000;
}

function show_about(visible) {
    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
        document.getElementById("about_box").className = "show";
        document.getElementById("about_box").style.pointerEvents = "all";
    }
    else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
    }
}

function on_window_resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}