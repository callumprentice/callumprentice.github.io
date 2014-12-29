// ISS PHoto Viewer - main file (http://callum.com) 2014

var camera, scene, renderer;
var controls;
var spin_speed = 1.0;
var radius = 0.5;
var segments = 64;
var iss_height_multiplier = 1.05957980558;
var ui_closed = true;
var ui_open_scale = 0;
var ui_height = 400;
var webgl_canvas_height = window.innerHeight;
var globe_manipulator;
var iss_loader;
var mission_geom = [];
var mission_data = [];
var mission_visible = [];
var helper_click;
var helper_closest;
var missions_loaded = 0;
var curMission = 0;
var curPhoto = 0;
var numPhotos = 0;
var photoTimeout = 0;
var totalPhotos = 0;
var selectedPhotos = 0;
var ISS = {
    lat: 0.0,
    lng: 0.0
}

function start_app() {
    init();
    animate();
}

function init() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, webgl_canvas_height);
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.z = 1.5;
    scene.add(new THREE.AmbientLight(0x888888));
    var light = new THREE.DirectionalLight(0xcccccc, 0.4);
    light.position.set(5, 2, 5);
    scene.add(light);
    var sphere = create_globe(radius, segments);
    scene.add(sphere)
    var stars = create_starfield(90, segments);
    scene.add(stars);
    globe_manipulator = new globe_manipulator({
        dom_object: renderer.domElement,
        camera: camera,
        radius: radius,
        auto_rotate: false,
        on_clicked_callback: onClicked,
        right_click_to_select: true,
        start_lat: 0.0,
        start_lng: 0.0,
        start_distance: 1.5,
        min_distance: 0.7,
        max_distance: 3.0,
        mesh: sphere
    });
    var helper_geometry = new THREE.SphereGeometry(0.001, 16, 16);
    helper_click = new THREE.Mesh(helper_geometry, new THREE.MeshBasicMaterial({
        color: 0xff0000
    }));
    scene.add(helper_click)
    var helper_geometry2 = new THREE.SphereGeometry(0.001, 16, 16);
    helper_closest = new THREE.Mesh(helper_geometry2, new THREE.MeshBasicMaterial({
        color: 0x00ff00
    }));
    scene.add(helper_closest)
    iss_loader = new ISSLOADER.DataLoader();
    var num_missions = iss_loader.getNumMissions();
    iss_loader.onMissionLoaded = function(mn) {
        missions_loaded++;
        var str = "Loading mission " + missions_loaded.toString() + "/" + num_missions.toString();
        $("#loading_overlay_text").text(str);
    }
    iss_loader.load()
    iss_loader.onDataLoaded = function(iss_data) {
        mission_data = iss_data
        for (var i = 0; i < iss_data.length; ++i) {
            var hue = (i / iss_data.length) * 0.8
            mission_geom[i] = create_mission_geom(iss_data[i], hue);
            mission_visible[i] = true;
            totalPhotos += iss_data[i].length;
        }
        $("#loading_overlay").remove();
        set_all(true);
        add_iss();
    }
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    webgl_canvas_height = window.innerHeight - ui_height * ui_open_scale;
    camera.aspect = window.innerWidth / webgl_canvas_height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, webgl_canvas_height);
    document.getElementById("settings_container").style.height = (window.innerHeight - webgl_canvas_height) + "px";
    document.getElementById("photo_container").style.height = (window.innerHeight - webgl_canvas_height) + "px";
}

function create_globe(radius, segments) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('img/surface.jpg'),
        bumpMap: THREE.ImageUtils.loadTexture('img/elevation.jpg'),
        bumpScale: 0.020,
        specularMap: THREE.ImageUtils.loadTexture('img/specular.png'),
        specular: new THREE.Color(0x666666)
    }));
}

function create_starfield(radius, segments) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/starfield.png'),
        side: THREE.BackSide
    }));
}

function toggle_ui() {
    var start_scale = 0.0;
    var end_scale = 0.0;
    if (ui_closed) {
        start_scale = 0.0;
        end_scale = 1.0;
        ui_closed = false;
    }
    else {
        start_scale = 1.0;
        end_scale = 0.0;
        ui_closed = true;
    }
    new TWEEN.Tween({
        scale: start_scale
    }).to({
        scale: end_scale
    }, 500).easing(TWEEN.Easing.Quartic.InOut).onComplete(function() {}).onUpdate(function() {
        ui_open_scale = this.scale;
        onWindowResize();
    }).start()
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    globe_manipulator.update();
    renderer.render(scene, camera);
}

function create_mission_geom(mission, mission_hue) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(mission.length * 3);
    var colors = new Float32Array(mission.length * 3);
    var color = new THREE.Color();
    var pos = 0;
    for (var i = 0; i < mission.length; ++i) {
        var lat = mission[i][0];
        var lng = mission[i][1];
        var phi = (90.0 - lat) * Math.PI / 180.0;
        var theta = (360.0 - lng) * Math.PI / 180.0;
        positions[pos + 0] = radius * iss_height_multiplier * Math.sin(phi) * Math.cos(theta);;
        positions[pos + 1] = radius * iss_height_multiplier * Math.cos(phi);
        positions[pos + 2] = radius * iss_height_multiplier * Math.sin(phi) * Math.sin(theta);
        color.setHSL(mission_hue, 0.9, 0.5);
        colors[pos + 0] = color.r;
        colors[pos + 1] = color.g;
        colors[pos + 2] = color.b;
        pos += 3;
    }
    var point_cloud_material = new THREE.PointCloudMaterial({
        size: 0.001,
        vertexColors: THREE.VertexColors
    });
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingBox();
    var point_cloud = new THREE.PointCloud(geometry, point_cloud_material);
    return point_cloud;
}

function getDistanceFromLatLonInKmFast(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
}

function set_closest_photo(lat, lng) {
    var deg2rad_const = (Math.PI / 180);
    var lat1 = lat * deg2rad_const;
    var lng1 = lng * deg2rad_const;
    var min_dist = Infinity;
    var min_i = -1;
    var min_j = -1;
    var lat2 = 0;
    var lng2 = 0;
    for (var i = 0; i < mission_data.length; ++i) {
        if (mission_visible[i]) {
            for (var j = 0; j < mission_data[i].length; ++j) {
                lat2 = (mission_data[i][j][0]) * deg2rad_const;
                lng2 = (mission_data[i][j][1]) * deg2rad_const;
                var dist = getDistanceFromLatLonInKmFast(lat1, lng1, lat2, lng2);
                if (dist < min_dist) {
                    min_i = i;
                    min_j = j;
                    min_dist = dist;
                }
            }
        }
    }
    setHelperPos("click", lat, lng);
    if (min_i === -1 || min_j === -1) {
        return;
    }
    setHelperPos("closest", mission_data[min_i][min_j][0], mission_data[min_i][min_j][1]);
    curMission = min_i;
    curPhoto = min_j;
    numPhotos = mission_data[min_i].length;
    gotoPhoto(0);
}

function onClicked(event) {
    if (event.intersects && event.mouse_event.button == 2) {
        set_closest_photo(event.lat, event.lng);
    }
}

function setHelperPos(type, lat, lng) {
    var helper_radius = radius * 1.001;
    var helper_pos = latlngPosFromLatLng(lat, lng, helper_radius);
    if (type === "closest") {
        helper_closest.position.x = helper_pos.x;
        helper_closest.position.y = helper_pos.y;
        helper_closest.position.z = helper_pos.z;
    }
    else
    if (type === "click") {
        helper_click.position.x = helper_pos.x;
        helper_click.position.y = helper_pos.y;
        helper_click.position.z = helper_pos.z;
    }
}

function latlngPosFromLatLng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;
    var x = radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.sin(theta);
    return {
        phi: phi,
        theta: theta,
        x: x,
        y: y,
        z: z
    };
}

function buildPhotoURL(size, mission_num, mission_photo_num) {
    var photoid = mission_data[mission_num][mission_photo_num][2];
    var mission = "ISS" + ("00" + (mission_num + 1)).slice(-3);
    var mrf = mission + "-E-" + photoid;
    var photo_thumb_url = "http://eol.jsc.nasa.gov/DatabaseImages/ESC/" + size + "/" + mission + "/" + mrf + ".jpg";
    return photo_thumb_url;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function update_photo_label() {
    var str = "&nbsp;Mission " + (curMission + 1) + ", photo " + numberWithCommas(curPhoto + 1) + " (Click to enlarge)";
    str += "<br>&nbsp;";
    str += numberWithCommas(totalPhotos) + " photos total, " + numberWithCommas(selectedPhotos) + " selected";
    $("#photo_label").html(str);
}

function photo_loaded() {
    var div_width = $("#photo_container").width();
    var div_height = $("#photo_container").height();
    var img_width = $("#photo_img").width();
    var img_height = $("#photo_img").height();
    update_photo_label();
}

function gotoPhoto(delta) {
    curPhoto += delta;
    if (curPhoto === numPhotos) curPhoto = 0;
    if (curPhoto < 0) curNumPhotos - 1;
    var photo_img = document.getElementById('photo_img');
    photo_img.src = buildPhotoURL("small", curMission, curPhoto);
    setHelperPos("closest", mission_data[curMission][curPhoto][0], mission_data[curMission][curPhoto][1]);
    globe_manipulator.set_lat_lng(mission_data[curMission][curPhoto][0], mission_data[curMission][curPhoto][1]);
}

function expandPhoto() {
    var large_photo_url = buildPhotoURL("large", curMission, curPhoto);
    window.open(large_photo_url);
}

function add_iss() {
    var loader = new THREE.ColladaLoader();
    loader.load("models/iss.dae", function(collada) {
        dae = collada.scene;
        dae.scale.x = dae.scale.y = dae.scale.z = 0.0005;
        dae_material = new THREE.MeshNormalMaterial();
        dae.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                child.material = dae_material;
            }
        });
        position_iss(true);
        scene.add(dae);
        if( ! localStorage.getItem( "runOnce" ) ) {
            localStorage.setItem( "runOnce", true );
            show_about(true);
        }
    });
}

function position_iss(rotate_globe) {
    $.ajax({
        url: "http://api.open-notify.org/iss-now.json",
        dataType: 'jsonp',
        success: function(data, text) {
            var iss_lat = data.iss_position.latitude;
            var iss_lng = data.iss_position.longitude;
            var iss_radius = radius * iss_height_multiplier;
            var pos = latlngPosFromLatLng(iss_lat, iss_lng, iss_radius)
            dae.position.x = pos.x
            dae.position.y = pos.y;
            dae.position.z = pos.z;
            if (rotate_globe) {
                var start_mission = -1;
                var start_mission_str = getQueryParameterByName("m").toLowerCase();
                if (start_mission_str.length !== 0) start_mission = parseInt(start_mission_str);
                var start_photo = -1;
                var start_photo_str = getQueryParameterByName("p").toLowerCase();
                if (start_photo_str.length !== 0) start_photo = parseInt(start_photo_str);
                if (start_mission !== -1 && start_photo !== -1) {
                    if (start_mission >= 1 && start_mission <= mission_data.length) {
                        if (start_photo >= 1 && start_photo <= mission_data[start_mission - 1].length) {
                            curMission = start_mission - 1;
                            curPhoto = start_photo - 1;
                            numPhotos = mission_data[curMission].length;
                            setHelperPos("closest", mission_data[curMission][curPhoto][0], mission_data[curMission][curPhoto][1]);
                            gotoPhoto(0);
                            toggle_ui();
                        }
                    }
                }
                else {
                    set_closest_photo(data.iss_position.latitude, data.iss_position.longitude);
                    globe_manipulator.set_lat_lng(data.iss_position.latitude, data.iss_position.longitude);
                    toggle_ui();
                }
            }
            setTimeout(function() {
                position_iss(false)
            }, 1 * 60 * 1000);
        },
        error: function(request, status, error) {
            console.warn("Unable to get ISS position: ", error);
        }
    });
}

function set_state(node, state) {
    var mission_number = parseInt(node.id) - 1;
    if (state) {
        node.id = node.id.replace("_off", "_on");
        node.style.opacity = 1.0;
        scene.add(mission_geom[mission_number]);
    }
    else {
        node.id = node.id.replace("_on", "_off");
        node.style.opacity = 0.25;
        scene.remove(mission_geom[mission_number]);
    }
    mission_visible[mission_number] = state;
    selectedPhotos = 0;
    for (var i = 0; i < mission_data.length; ++i) {
        if (mission_visible[i]) {
            selectedPhotos += mission_data[i].length;
        }
    }
    update_photo_label();
}

function onClickImage(node) {
    if (node.id.indexOf("_off") === -1) {
        set_state(node, false);
    }
    else {
        set_state(node, true);
    }
}

function set_all(state) {
    var td_elems = document.getElementById('patch_table').getElementsByTagName('img');
    for (var i = 0; i < td_elems.length; ++i) {
        if (td_elems[i].id.length > 0) {
            set_state(td_elems[i], state);
        }
    }
}

function full_screen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
    else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    }
    else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    }
    else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null) return "";
    else return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function save_url() {
    var url = "index.html?m=" + (curMission + 1) + "&p=" + (curPhoto + 1);
    window.open(url);
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
