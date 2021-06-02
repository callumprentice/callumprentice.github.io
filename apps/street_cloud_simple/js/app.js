//
//    Street Cloud Simple
//    Callum Prentice - callum@gmail.com
//
//    Pulls in code fragments from these great people:
//        https://github.com/spite/GSVPano.js/
//        https://github.com/proog128/GSVPanoDepth.js/tree/master
//
//    Base app autogenerated from templates
//      ./template.threejs/
//      ./template.generic/
//
var camera = 0;
var scene = 0;
var renderer = 0;
var controls = 0;
var geometry = 0;
var canvas_color_map = 0;
var points_material = 0;
var positions = [];
var c_target = 0;
var svs = 0;
var raycaster = 0;
var mouse = 0;
var scene_root = 0;
var helper_geometry_origin;
var worldsize_max_width = 16384;
var base_color_img_width = 1024;

function app() {
    show_loading(true);

    svs = new google.maps.StreetViewService();

    var div_size = get_div_size('webgl');

    camera = new THREE.PerspectiveCamera(60, div_size.width / div_size.height, 0.01, 100);
    camera.position.set(0.0, 0.0, 0.00001);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(div_size.width, div_size.height);

    points_material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
    });

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(1, 1);

    document.getElementById('webgl').appendChild(renderer.domElement);
    window.addEventListener('resize', on_window_resize, false);
    document.addEventListener('click', on_click, false);

    new ResizeObserver(on_window_resize).observe(document.getElementById('webgl'));

    var latlng = lat_lng_from_url();
    if (latlng.found) {
        load_pano_by_location(latlng.lat, latlng.lng);
    } else {

        load_pano_by_location(37.800286, -122.4014286);
    }

    // close settings by default cs=1
    var params = new URL(document.location).searchParams;
    if (parseInt(params.get('cs')) != 1) {
        toggle_settings();
    }

    show_loading(false);

    animate();
}

function on_window_resize() {
    var div_size = get_div_size('webgl');

    camera.aspect = div_size.width / div_size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(div_size.width, div_size.height);

    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);

    if (controls) {
        controls.update();
    }

    renderer.render(scene, camera);
}

function get_div_size(div_name) {
    return {
        width: document.getElementById(div_name).clientWidth,
        height: document.getElementById(div_name).clientHeight,
    };
}

function toggle_settings() {
    if (typeof toggle_settings.status == 'undefined') {
        toggle_settings.status = true;
    }

    document.getElementById('webgl').classList.toggle('expanded');
    document.getElementById('settings').classList.toggle('expanded');

    toggle_settings.status = !toggle_settings.status;
}

function allow_drop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData('text', ev);
}

function enter(ev) {
    ev.srcElement.classList.add('drag_drop_highlight');
}

function leave(ev) {
    ev.srcElement.classList.remove('drag_drop_highlight');
}

function drop(ev) {
    ev.srcElement.classList.remove('drag_drop_highlight');
    ev.preventDefault();

    var data = ev.dataTransfer.getData('text');
    var latlng = extract_lat_lng(data);
    if (latlng.valid) {
        load_pano_by_location(latlng.lat, latlng.lng);
    }
}

function show_loading(visible) {
    if (visible) {
        document.getElementById('loading_overlay').className = 'show';
        document.getElementById('loading_overlay').style.pointerEvents = 'all';
    } else {
        document.getElementById('loading_overlay').className = 'hide';
        document.getElementById('loading_overlay').style.pointerEvents = 'none';
    }
}

function extract_lat_lng(content) {
    var rx = /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d?)/g;
    var arr = rx.exec(content);

    if (arr != null) {
        return {
            valid: true,
            lat: arr[1],
            lng: arr[2],
        };
    } else {
        return {
            valid: false,
            lat: 0.0,
            lng: 0.0,
        };
    }
}
function random_pano() {
    var locs = [
        [48.856766, 2.3070897],
        [51.5109728, -0.08611],
        [41.3808654, 2.1732035],
        [37.7756381, -122.4328958],
        [37.7956997, -122.4033625],
        [40.7415546, -73.9896172],
        [22.2846689, 114.1559119],
        [1.3024972, 103.8587758],
        [35.6900087, 139.7667509],
        [35.6995884, 139.7714779],
        [41.9104183, 12.4656397],
        [38.7094055, -9.1435451],
        [22.2781015, 114.1826566],
    ];

    var latlng = locs[parseInt(Math.random() * locs.length)];
    load_pano_by_location(latlng[0], latlng[1]);
}

function load_pano_by_location(lat, lng) {
    var radius = 50.0;
    svs.getPanoramaByLocation(new google.maps.LatLng(lat, lng), radius, function (result, status) {
        if (status === google.maps.StreetViewStatus.OK) {
            load_pano_by_id(result.location.pano);
        } else {
            console.error('Unable to get location');
        }
    });
}

function load_pano_by_id(pano_id) {
    positions = [];

    var zoom = 1;
    var map_tile_size = base_color_img_width / 2;
    svs.getPanoramaById(pano_id, function (result, status) {
        if (status === google.maps.StreetViewStatus.OK) {
            update_url(result.location.latLng.lat(), result.location.latLng.lng());

            add_attribution_text(result.location.description, result.copyright, result.imageDate);
            var pitch = 0.0;
            var yaw = 0.0;
            var s_target = new THREE.Spherical(1, Math.PI / 2 - pitch, yaw);
            c_target = new THREE.Vector3().setFromSpherical(s_target);

            if (!controls) {
                controls = new THREE.OrbitControls(camera, renderer.domElement);
            }
            controls.target = c_target;
            controls.saveState();

            var num_tiles_loaded = 0;
            canvas_color_map = document.createElement('canvas');
            var ctx = canvas_color_map.getContext('2d');

            var num_x = Math.pow(2, zoom);
            var num_y = Math.pow(2, zoom - 1);
            canvas_color_map.width = num_x * map_tile_size;
            canvas_color_map.height = num_y * map_tile_size;
            canvas_color_map.id = 'ssv-color-canvas';
            ctx.translate(canvas_color_map.width, 0);
            ctx.scale(-1, 1);

            for (var y = 0; y < num_y; ++y) {
                for (var x = 0; x < num_x; ++x) {
                    var url = 'https://geo3.ggpht.com/cbk?cb_client=apiv3&output=tile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&nbt=1&fover=2&panoid=' + pano_id;
   

                    (function (x, y) {
                        var img = new Image();
                        img.addEventListener('load', function () {
                            ctx.drawImage(this, x * map_tile_size, y * map_tile_size);

                            if (++num_tiles_loaded == num_x * num_y) {
                                var world_width = result.tiles.worldSize.width;
                                var world_height = result.tiles.worldSize.height;
                                var img_width = base_color_img_width * (world_width / worldsize_max_width);
                                var img_height =
                                    (base_color_img_width / 2) * (world_height / (worldsize_max_width / 2));

                                var cropped_canvas = document.createElement('canvas');
                                cropped_canvas.width = img_width;
                                cropped_canvas.height = img_height;
                                cropped_canvas
                                    .getContext('2d')
                                    .drawImage(
                                        canvas_color_map,
                                        0,
                                        0,
                                        img_width,
                                        img_height,
                                        0,
                                        0,
                                        img_width,
                                        img_height
                                    );
                                canvas_color_map = cropped_canvas;

                                load_depth(result);
                            }
                        });
                        img.crossOrigin = '';
                        img.src = url;
                    })(x, y);
                }
            }
        } else {
            console.error('Unable to get StreetView for location', location.lat(), location.lng());
        }
    });
}

function load_depth(result) {
    positions = [];

    var url = "https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=uk&pb=!1m4!1smaps_sv.tactile!11m2!2m1!1b1!2m2!1sen!2suk!3m3!1m2!1e2!2s" +
        result.location.pano +
        "!4m57!1e1!1e2!1e3!1e4!1e5!1e6!1e8!1e12!2m1!1e1!4m1!1i48!5m1!1e1!5m1!1e2!6m1!1e1!6m1!1e2!9m36!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e3!2b1!3e2!1m3!1e3!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e1!2b0!3e3!1m3!1e4!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e3";

    let request = (obj) => {
        console.log(obj.url);
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(obj.method || 'GET', obj.url);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(xhr.statusText);
                }
            };
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send(obj.body);
        });
    };

    request({
        url: url,
    })
        .then((jsonp_data) => {
            var raw_depth_map = JSON.parse(jsonp_data.substr(4))[1][0][5][0][5][1][2];
            while (raw_depth_map.length % 4 != 0) {
                raw_depth_map += '=';
            }

            raw_depth_map = raw_depth_map.replace(/-/g, '+');
            raw_depth_map = raw_depth_map.replace(/_/g, '/');

            var enc_data = atob(raw_depth_map)
                .split('')
                .map(function (x) {
                    return x.charCodeAt(0);
                });
                
            var data = new Uint8Array(enc_data);
            var depth_map_data = new DataView(data.buffer);
            var number_of_planes = depth_map_data.getUint16(1, true);
            var width = depth_map_data.getUint16(3, true);

            var height = depth_map_data.getUint16(5, true);
            var offset = depth_map_data.getUint16(7, true);
            var planes = [];
            var indices = [];

            for (var i = 0; i < width * height; ++i) {
                indices.push(depth_map_data.getUint8(offset + i));
            }

            for (var j = 0; j < number_of_planes; ++j) {
                var byteOffset = offset + width * height + j * 4 * 4;
                var n = [
                    depth_map_data.getFloat32(byteOffset + 0, true),
                    depth_map_data.getFloat32(byteOffset + 4, true),
                    depth_map_data.getFloat32(byteOffset + 8, true),
                ];
                var d = depth_map_data.getFloat32(byteOffset + 12, true);
                planes.push({
                    n: n.slice(0),
                    d: d,
                });
            }

            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var plane_idx = indices[y * width + x];

                    var phi = ((width - x - 1) / (width - 1)) * 2 * Math.PI + Math.PI / 2;
                    var theta = ((height - y - 1) / (height - 1)) * Math.PI;

                    var v = [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];

                    var depth_distance = Infinity;
                    if (plane_idx > 0) {
                        var plane = planes[plane_idx];

                        var t = plane.d / (v[0] * plane.n[0] + v[1] * plane.n[1] + v[2] * plane.n[2]);
                        v[0] *= t;
                        v[1] *= t;
                        v[2] *= t;

                        depth_distance = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
                    }

                    var b = -0.5 * Math.PI + (1 * y * Math.PI) / (height - 1);
                    var a = (2 * x * Math.PI) / (width - 1);
                    var xp = depth_distance * Math.cos(a) * Math.cos(b);
                    var yp = depth_distance * Math.sin(a) * Math.cos(b);
                    var zp = depth_distance * Math.sin(b);

                    xp = isNaN(xp) ? 10.0 : xp == Infinity || xp == -Infinity ? 10.0 : xp;
                    yp = isNaN(yp) ? 10.0 : yp == Infinity || yp == -Infinity ? 10.0 : yp;
                    zp = isNaN(zp) ? 10.0 : zp == Infinity || zp == -Infinity ? 10.0 : zp;

                    xp += c_target.x;
                    yp += c_target.y;
                    zp += c_target.z;

                    positions.push(xp, -zp, yp);
                }
            }
            
            add_geometry(width, height, result);
        });
        .catch((error) => {
            console.error(error);
        });
}

function add_geometry(depth_width, depth_height, result) {
    if (scene_root != 0) {
        scene.remove(scene_root);
    }

    scene_root = new THREE.Object3D();
    scene.add(scene_root);

    geometry = new THREE.BufferGeometry();
    var colors = [];

    var color_context = canvas_color_map.getContext('2d');
    var color_data = color_context.getImageData(0, 0, color_context.canvas.width, color_context.canvas.height).data;

    for (var y = 0; y < depth_height; ++y) {
        var color_v = parseInt((y * (color_context.canvas.height - 1)) / (depth_height - 1));

        for (var x = 0; x < depth_width; ++x) {
            var color_u =
                color_context.canvas.width -
                1 -
                parseInt((x * (color_context.canvas.width - 1)) / (depth_width - 1)) -
                1;
            colors.push(
                color_data[color_v * color_context.canvas.width * 4 + color_u * 4 + 0] / 0xff,
                color_data[color_v * color_context.canvas.width * 4 + color_u * 4 + 1] / 0xff,
                color_data[color_v * color_context.canvas.width * 4 + color_u * 4 + 2] / 0xff
            );
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    var points = new THREE.Points(geometry, points_material);

    var points_rotation = ((180 + result.tiles.centerHeading) * Math.PI) / 180.0;
    points.rotation.y = points_rotation;

    scene_root.add(points);

    add_links(result);
}

function add_links(result) {
    var helper_shape = new THREE.Shape();
    helper_shape.moveTo(0, 0);
    helper_shape.lineTo(-0.2, 0.5);
    helper_shape.lineTo(0.2, 0.5);
    helper_shape.lineTo(0, 0);
    var extrudeSettings = {
        depth: 0.125,
    };
    extrudeSettings.bevelEnabled = false;
    var helper_geometry = new THREE.ExtrudeGeometry(helper_shape, extrudeSettings);

    helper_geometry_origin = new THREE.Object3D();

    for (var i = 0; i < result.links.length; ++i) {
        var helper_geometry_base = new THREE.Object3D();
        var helper_mesh = new THREE.Mesh(helper_geometry, new THREE.MeshNormalMaterial());
        helper_mesh.position.y = -2.0;
        helper_mesh.rotation.x = Math.PI / 2.0;
        helper_mesh.rotation.z = Math.PI / 2.0;
        helper_mesh.position.x = 5.0 + c_target.x;
        helper_mesh.userData = result.links[i].pano;
        var heading = mutate_heading(result.tiles.worldSize.width, result.links[i].heading);
        helper_geometry_base.rotation.y = (heading * Math.PI) / 180.0;
        helper_geometry_base.add(helper_mesh);
        helper_geometry_origin.add(helper_geometry_base);
    }
    scene_root.add(helper_geometry_origin);
}

function on_click(event) {
    var div_size = get_div_size('webgl');

    mouse.x = (event.clientX / div_size.width) * 2 - 1;
    mouse.y = -(event.clientY / div_size.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersection = raycaster.intersectObject(helper_geometry_origin, true);
    if (intersection.length > 0) {
        var new_pano_id = intersection[0].object.userData;
        load_pano_by_id(new_pano_id);
    }
}

function mutate_heading(world_width, orig_heading) {
    var new_heading = orig_heading;

    if (world_width < worldsize_max_width) {
        new_heading = orig_heading + 90.0;
    }

    return new_heading;
}

function lat_lng_from_url() {
    var params = new URL(document.location).searchParams;
    var lat = parseFloat(params.get('lat'));
    var lng = parseFloat(params.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
        return {
            found: true,
            lat: lat,
            lng: lng,
        };
    }

    return {
        found: false,
        lat: Infinity,
        lng: Infinity,
    };
}

function add_attribution_text(location, copyright, date) {
    var attribution = location;
    attribution += '&nbsp;&nbsp;&bull;&nbsp;&nbsp;';
    attribution += copyright;
    attribution += '&nbsp;&nbsp;&bull;&nbsp;&nbsp;';
    attribution += 'Image date: ';
    attribution += date;

    document.getElementById('text_overlay_text').innerHTML = attribution;
}

function build_url(lat, lng) {
    var url = 'index.html?';

    var p1 = 'lat';
    var v1 = lat;
    url += '&' + p1 + '=' + v1;
    var p2 = 'lng';
    var v2 = lng;
    url += '&' + p2 + '=' + v2;

    return url;
}

function update_url(lat, lng) {
    var url = build_url(lat, lng);
    window.history.pushState({}, '', url);
}

function load_pano_my_location() {
    show_loading(true);
    navigator.geolocation.getCurrentPosition(
        function success(pos) {
            load_pano_by_location(pos.coords.latitude, pos.coords.longitude);
            show_loading(false);
        },
        function error(err) {
            show_loading(false);
            console.warn(err.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

function view_streetview() {
    var latlng = lat_lng_from_url();
    if (latlng.found) {
        console.log("viewing");
        var svurl =
            'https://maps.google.com/maps?q=&layer=c&cbll=' + latlng.lat + ',' + latlng.lng + '&cbp=11,0,0,0,0';
        window.open(svurl);
    }
}
