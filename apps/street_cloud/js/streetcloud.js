var camera, scene, renderer;
var projector, raycaster, vector = new THREE.Vector3();
var root_object = 0, root_helper_object = 0;
var tracker_map;
var tracker_marker_div;
var svs = new google.maps.StreetViewService();
var geo_coder = new google.maps.Geocoder();
var point_size = 0.2;
var point_cloud_material;
var show_map = true;
var show_pano = false;
var show_depth = false;
var default_lat = 37.800218;
var default_lng = -122.401403;
var cur_lat = default_lat;
var cur_lng = default_lng;

function init() {
    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
    }

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, -30, 0);
    camera.lookAt(0.0, 0.0, 0.0);
    camera.up.set(0.0, -1.0, 0.0)
    var ambient_light = new THREE.AmbientLight(0xcccccc);
    scene.add(ambient_light);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();
    raycaster.params.PointCloud.threshold = 0.5;
    var gui = new dat.GUI();
    gui.add(this, "my_location").name("My location");
    gui.add(this, "view_streetview").name("View Streetview");
    gui.add(this, "full_screen").name("Full screen");
    gui.add(this, "point_size", 0.1, 2.0).name("Point size").onChange(function (value) {
        point_cloud_material.size = point_size;
    });
    gui.add(this, "show_map", false).name("Show map").onChange(function (value) {
        if (value) {
            document.getElementById("tracker_map").className = "show";
            document.getElementById("tracker_marker").className = "show";
        } else {
            document.getElementById("tracker_map").className = "hide";
            document.getElementById("tracker_marker").className = "hide";
        }
    });
    gui.add(this, "show_pano", false).name("Show pano image").onChange(function (value) {
        if (value)
            document.getElementById("pano_container").className = "show";
        else
            document.getElementById("pano_container").className = "hide";
    });
    gui.add(this, "show_depth", false).name("Show depth map").onChange(function (value) {
        if (value)
            document.getElementById("depth_container").className = "show";
        else
            document.getElementById("depth_container").className = "hide";
    });
    var tracker_map_options = {
        disableDoubleClickZoom: true,
        draggable: false,
        scrollwheel: false,
        panControl: false,
        disableDefaultUI: true,
        zoom: 17
    };
    tracker_map = new google.maps.Map(document.getElementById('tracker_map'), tracker_map_options);
    tracker_marker_div = document.getElementById('tracker_marker');
    point_cloud_material = new THREE.PointCloudMaterial({
        size: point_size,
        vertexColors: true,
        sizeAttenuation: true,
        fog: true
    });
    window.addEventListener('resize', on_window_resize, false);
    document.addEventListener('mousedown', on_document_mouse_down, false);
}

function on_window_resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function my_location() {
    clear_input();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                render_street_view_by_location(position.coords.latitude, position.coords.longitude);
                cur_lat = position.coords.latitude;
                cur_lng = position.coords.longitude;
            },
            function () {
                render_street_view_by_location(default_lat, default_lng);
            });
    } else {
        render_street_view_by_location(default_lat, default_lng);
    }
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
    var svurl = "http://maps.google.com/maps?q=&layer=c&cbll=" + cur_lat + "," + cur_lng + "4&cbp=11,0,0,0,0";
    window.open(svurl);
}

function hide_input_feedback() {
    document.getElementById('input_feedback').className = 'hide';
}

function clear_input() {
    var element = document.getElementById('input_ctrl');
    element.value = "";
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    var tracker_rot_deg = 360 - (90 + (180 / Math.PI) * camera.rotation.z);
    tracker_marker_div.style.webkitTransform = "rotate(" + tracker_rot_deg + "deg)"
    render();
}

function render_street_view_by_location(lat, lng) {
    svs.getPanoramaByLocation(new google.maps.LatLng(lat, lng), 50,
        function (data, status) {
            if (status === google.maps.StreetViewStatus.OK) {
                render_street_view_by_id(data.location.pano);
            } else {
                console.error("Unable to get location");
            }
        });
}

function render_street_view_by_id(pano_id) {
    var img_canvas_context = 0;
    var main_rotation = 0;
    var pano_loader = new GSVPANO.PanoLoader({
        zoom: 1
    });
    var depth_loader = new GSVPANO.PanoDepthLoader();

    var old_root_object = root_object;
    var old_root_helper_object = root_helper_object;

    root_object = new THREE.Object3D();
    scene.add(root_object);
    root_helper_object = new THREE.Object3D();
    scene.add(root_helper_object);
    svs.getPanoramaById(pano_id,
        function (data, status) {
            if (status === google.maps.StreetViewStatus.OK) {
                pano_loader.load(new google.maps.LatLng(data.location.latLng.k, data.location.latLng.B));
            } else {
                console.error("Unable to get starting pano ID ");
            }
        });
    pano_loader.onPanoramaLoad = function () {
        var pano_container = document.getElementById('pano_container');
        while (pano_container.firstChild) {
            pano_container.removeChild(pano_container.firstChild);
        }
        pano_container.appendChild(this.canvas);
        img_canvas_context = this.canvas.getContext('2d');
        tracker_map.setCenter({
            lat: this.data.location.latLng.k,
            lng: this.data.location.latLng.B
        });
        main_rotation = this.data.tiles.centerHeading;
        cur_lat = this.data.location.latLng.k;
        cur_lng = this.data.location.latLng.B;
        if (this.data.links.length > 0) {
            for (var i = 0; i < this.data.links.length; ++i) {
                var helper_geometry_base = new THREE.Object3D();
                var helper_shape = new THREE.Shape();
                helper_shape.moveTo(0, 0);
                helper_shape.lineTo(-2, 5);
                helper_shape.lineTo(2, 5);
                helper_shape.lineTo(0, 0);
                var extrudeSettings = {
                    amount: 0.25
                };
                extrudeSettings.bevelEnabled = false;
                var helper_geometry = new THREE.ExtrudeGeometry(helper_shape, extrudeSettings);
                var helper_mesh = new THREE.Mesh(helper_geometry, new THREE.MeshNormalMaterial())
                helper_mesh.rotation.x = Math.PI / 2.0;
                helper_mesh.rotation.z = Math.PI / 2.0;
                helper_mesh.position.x = 16;
                helper_mesh.userData = this.data.links[i].pano;
                helper_geometry_base.rotation.y = this.data.links[i].heading * Math.PI / 180.0;
                helper_geometry_base.add(helper_mesh);
                root_helper_object.add(helper_geometry_base);
                if (old_root_helper_object) {
                    scene.remove(old_root_helper_object);
                }
            }
        }
        depth_loader.load(this.panoId);
    };
    depth_loader.onDepthLoad = function () {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        canvas.setAttribute('width', this.depthMap.width);
        canvas.setAttribute('height', this.depthMap.height);
        var image = context.getImageData(0, 0, this.depthMap.width, this.depthMap.height);
        for (var y = 0; y < this.depthMap.height; ++y) {
            for (var x = 0; x < this.depthMap.width; ++x) {
                var col = this.depthMap.depthMap[y * this.depthMap.width + x] / 50 * 255;
                image.data[4 * (y * this.depthMap.width + x) + 0] = col;
                image.data[4 * (y * this.depthMap.width + x) + 1] = col;
                image.data[4 * (y * this.depthMap.width + x) + 2] = 0.0;
                image.data[4 * (y * this.depthMap.width + x) + 3] = 255;
            }
        }
        context.putImageData(image, 0, 0);
        var depth_container = document.getElementById('depth_container');
        while (depth_container.firstChild) {
            depth_container.removeChild(depth_container.firstChild);
        }
        depth_container.appendChild(canvas);
        var geometry = new THREE.BufferGeometry();
        var num_points = this.depthMap.width * this.depthMap.height;
        var positions = new Float32Array(num_points * 3);
        var colors = new Float32Array(num_points * 3);
        var color_data = img_canvas_context.getImageData(0, 0, img_canvas_context.canvas.width, img_canvas_context.canvas.height).data;
        var n = 0;
        for (var y = 0; y < this.depthMap.height; ++y) {
            var lat = (y / this.depthMap.height) * 180.0 - 90.0;
            var r = Math.cos(lat * Math.PI / 180.0);
            for (var x = 0; x < this.depthMap.width; ++x) {
                var depth = parseFloat(this.depthMap.depthMap[y * this.depthMap.width + (this.depthMap.width - x)]);
                var lng = (1-(x / this.depthMap.width)) * 360.0 - 180.0;
                var pos = new THREE.Vector3();
                pos.x = (r * Math.cos(lng * Math.PI / 180.0));
                pos.y = (Math.sin(lat * Math.PI / 180.0));
                pos.z = (r * Math.sin(lng * Math.PI / 180.0));
                pos.multiplyScalar(depth);
                pos.multiplyScalar(2.0);
                positions[3 * n + 0] = isNaN(pos.x) ? 0 : pos.x;
                positions[3 * n + 1] = isNaN(pos.y) ? 0 : pos.y;
                positions[3 * n + 2] = isNaN(pos.z) ? 0 : pos.z;
                var normalized_x = (1-x / this.depthMap.width);
                var normalized_y = y / this.depthMap.height;
                var color_canvas_x = parseInt(normalized_x * img_canvas_context.canvas.width);
                var color_canvas_y = parseInt(normalized_y * img_canvas_context.canvas.height);
                var color_index = color_canvas_y * img_canvas_context.canvas.width * 4 + color_canvas_x * 4;
                colors[3 * n + 0] = (color_data[color_index + 0]) / 255.0;
                colors[3 * n + 1] = (color_data[color_index + 1]) / 255.0;
                colors[3 * n + 2] = (color_data[color_index + 2]) / 255.0;
                n++;
            }
        }
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingBox();
        var pointcloud = new THREE.PointCloud(geometry, point_cloud_material);
        pointcloud.rotation.y = main_rotation * Math.PI / 180.0;
        root_object.add(pointcloud);
        if (old_root_object) {
            scene.remove(old_root_object);
        }
        clear_input();
    }
}

function geocode_address() {
    var elem = document.getElementById("input_ctrl");
    var address = elem.value;
    geo_coder.geocode({
            'address': address
        },
        function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                render_street_view_by_location(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                cur_lat = results[0].geometry.location.lat();
                cur_lng = results[0].geometry.location.lng();
                document.getElementById("input_feedback").className = "hide";
            } else {
                document.getElementById("input_feedback").className = "show";
            }
        });
}

function on_document_mouse_down(event) {
    var element_mouse_over = document.elementFromPoint(event.clientX, event.clientY);
    if (element_mouse_over.id == "input_ctrl") {
        return;
    }
    if (element_mouse_over.id == "about_box") {
        show_about(false);
        return;
    }
    event.preventDefault();
    var mouse_x = (event.clientX / window.innerWidth) * 2 - 1;
    var mouse_y = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouse_x, mouse_y, -1.0);
    vector.set(mouse_x, mouse_y, 0.1);
    projector.unprojectVector(vector, camera);
    raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(root_helper_object, true);
    if (intersects.length > 0 && intersects[0].object.userData.length > 0) {
        render_street_view_by_id(intersects[0].object.userData);
    }
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

function app() {
    init();
    animate();
    render_street_view_by_location(default_lat, default_lng);
}