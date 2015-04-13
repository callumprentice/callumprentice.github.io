/**
 * ISS Photo Explorer 2015 (NASA Space Apps Challenge)
 * @author Callum Prentice / http://callum.com/
 * @license: MIT / http://opensource.org/licenses/MIT
 */

var camera, scene, renderer;
var globeManipulator;
var webGLWindow;
var issLoader;
var radius = 100.0;
var issModel = 0;
var missionGeometry = [];
var missionData = [];
var missionVisible = [];
var missionsLoaded = 0;
var totalPhotos = 0;
var selectedPhotos = 0;
var curMission = 0;
var curPhoto = 0;
var numPhotos = 0;
var issHeightMultiplier = getIssHeightMultiplier();
var isWindowSwapped = false;
var helperClickedPos = 0;
var helperClosestPos = 0;

function app() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    init();
    animate();
}

function init() {
    webGLWindow = document.getElementById("webgl_window");

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 0.0);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(webGLWindow.offsetWidth, webGLWindow.offsetHeight);

    webGLWindow.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45.0, webGLWindow.offsetWidth / webGLWindow.offsetHeight, 0.01, 1000.0);
    camera.position.z = 325.0;

    var segments = 64;

    scene.add(new THREE.AmbientLight(0x888888));
    var light = new THREE.DirectionalLight(0xaaaaaa, 0.7);
    light.position.set(5, 2, 5);
    scene.add(light);

    var globe = createGlobe(radius, segments);
    scene.add(globe);

    var stars = createStarField(radius * 3.0, segments);
    scene.add(stars);

    var helper_geometry = new THREE.SphereGeometry(0.2, 8, 8);
    helperClickedPos = new THREE.Mesh(helper_geometry, new THREE.MeshBasicMaterial({
        color: 0xff0000
    }));
    scene.add(helperClickedPos);

    helperClosestPos = new THREE.Mesh(helper_geometry, new THREE.MeshBasicMaterial({
        color: 0x00ff00
    }));
    scene.add(helperClosestPos);

    issLoader = new ISSLOADER.DataLoader();

    var num_missions = issLoader.getNumMissions();

    issLoader.onMissionLoaded = function (mn) {
        ++missionsLoaded;
        var str = "ISS Photo Explorer - Loading mission " + missionsLoaded.toString() + "/" + num_missions.toString();
        document.getElementById('loading_overlay_text').textContent = str;
    };

    issLoader.load();
    issLoader.onDataLoaded = function (iss_data) {

        missionData = iss_data;

        for (var i = 0; i < iss_data.length; ++i) {

            var hue = (i / iss_data.length);
            missionGeometry[i] = createMissionGeometry(iss_data[i], hue);
            missionVisible[i] = true;
            totalPhotos += iss_data[i].length;
        }

        var overlay_element = document.getElementById('loading_overlay');
        if (overlay_element) {
            overlay_element.parentNode.removeChild(overlay_element);
        }
        setAll(true);
        addISS();
    };

    globeManipulator = new globe_manipulator({
        dom_object: renderer.domElement,
        camera: camera,
        radius: radius,
        auto_rotate: false,
        on_clicked_callback: onClicked,
        right_click_to_select: true,
        start_lat: 37.520925,
        start_lng: -122.309460,
        start_distance: 300,
        min_distance: 120.0,
        max_distance: 450.0,
        mesh: globe
    });

    window.addEventListener('resize', onWindowResize, false);
}

function createGlobe(radius, segments) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('img/surface.jpg'),
        bumpMap: THREE.ImageUtils.loadTexture('img/elevation.jpg'),
        bumpScale: 0.020,
        specularMap: THREE.ImageUtils.loadTexture('img/specular.png'),
        specular: new THREE.Color(0x666666)
    }));
}

function createStarField(radius, segments) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/starfield.png'),
        side: THREE.BackSide
    }));
}

function setHelperPos(type, lat, lng) {
    var helper_radius = radius * issHeightMultiplier;
    var helper_pos = latlngPosFromLatLng(lat, lng, helper_radius);

    if (type === "closest") {
        helperClosestPos.position.x = helper_pos.x;
        helperClosestPos.position.y = helper_pos.y;
        helperClosestPos.position.z = helper_pos.z;
    } else
    if (type === "click") {
        helperClickedPos.position.x = helper_pos.x;
        helperClickedPos.position.y = helper_pos.y;
        helperClickedPos.position.z = helper_pos.z;
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

function createMissionGeometry(mission, mission_hue) {

    var geometry = new THREE.BufferGeometry();

    var length = mission.length;

    var positions = new Float32Array(length * 3);
    var colors = new Float32Array(length * 3);
    var sizes = new Float32Array(length * 1);
    var color = new THREE.Color();

    for (var i = 0; i < length; ++i) {

        var lat = mission[i][0];
        var lng = mission[i][1];
        var phi = (90.0 - lat) * Math.PI / 180.0;
        var theta = (360.0 - lng) * Math.PI / 180.0;

        var pos = latlngPosFromLatLng(lat, lng, radius * issHeightMultiplier);

        positions[i * 3 + 0] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;

        color.setHSL(mission_hue, 0.9, 0.3);
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = 2.4;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.computeBoundingBox();

    var attributes = {
        size: {
            type: 'f',
            value: null
        },
        customColor: {
            type: 'c',
            value: null
        }
    };

    var uniforms = {
        color: {
            type: "c",
            value: new THREE.Color(0xffffff)
        },
        texture: {
            type: "t",
            value: THREE.ImageUtils.loadTexture("img/point.png")
        }
    };

    var shader_material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        attributes: attributes,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true
    });

    return new THREE.PointCloud(geometry, shader_material);
}

function setState(node, state) {
    var mission_number = parseInt(node.id, 10) - 1;
    if (state) {
        node.id = node.id.replace("_off", "_on");
        node.style.opacity = 1.0;
        scene.add(missionGeometry[mission_number]);
    } else {
        node.id = node.id.replace("_on", "_off");
        node.style.opacity = 0.25;
        scene.remove(missionGeometry[mission_number]);
    }
    missionVisible[mission_number] = state;
    selectedPhotos = 0;
    for (var i = 0; i < missionData.length; ++i) {
        if (missionVisible[i]) {
            selectedPhotos += missionData[i].length;
        }
    }

    updatePhotoLabel();
}

function onClickImage(node) {
    if (node.id.indexOf("_off") === -1) {
        setState(node, false);
    } else {
        setState(node, true);
    }
}

function onRightClickImage(node) {
    if (node.id.indexOf("_off") === -1) {
        setAll(false);
    } else {
        setAll(true);
    }
}

function setAll(state) {
    var td_elems = document.getElementById('patch_table').getElementsByTagName('img');
    for (var i = 0; i < td_elems.length; ++i) {
        if (td_elems[i].id.length > 0) {
            setState(td_elems[i], state);
        }
    }
}

function getIssHeightMultiplier() {
    var radius_earth_km = 3959.0;
    var mean_height_iss_km = 354.4;
    return 1 + (mean_height_iss_km / radius_earth_km);
}

function onWindowResize() {

    camera.aspect = webGLWindow.offsetWidth / webGLWindow.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(webGLWindow.offsetWidth, webGLWindow.offsetHeight);
}

function swapWindow() {
    if (isWindowSwapped) {
        document.getElementById('webgl_window').className = 'webgl_window';
        document.getElementById('image_window').className = 'image_window';
    } else {
        document.getElementById('webgl_window').className = 'image_window';
        document.getElementById('image_window').className = 'webgl_window';
    }

    isWindowSwapped = !isWindowSwapped;

    if (isWindowSwapped) {

    }

    gotoPhoto(0);

    onWindowResize();
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

function addISS() {
    var loader = new THREE.ColladaLoader();
    loader.load("models/iss.dae", function (collada) {

        issModel = collada.scene;
        issModel.scale.x = issModel.scale.y = issModel.scale.z = 0.1;
        issModel_material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        });
        issModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material = issModel_material;
            }
        });
        positionISS(true, false);
        scene.add(issModel);
        if (!localStorage.getItem("runOnce")) {
            localStorage.setItem("runOnce", true);
            showAbout(true);
        }
    });
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null) return "";
    else return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function shareURL() {
    var url = "index.html?m=" + (curMission + 1) + "&p=" + (curPhoto + 1);
    window.open(url);
}

function positionISS(rotate_globe, force_to_iss) {

    $.ajax({
        url: "http://api.open-notify.org/iss-now.json",
        dataType: 'jsonp',
        success: function (data, text) {
            var iss_lat = data.iss_position.latitude;
            var iss_lng = data.iss_position.longitude;

            var fudge_factor = 1.01;
            var iss_radius = radius * issHeightMultiplier * fudge_factor;

            var pos = latlngPosFromLatLng(iss_lat, iss_lng, iss_radius);
            issModel.position.x = pos.x;
            issModel.position.y = pos.y;
            issModel.position.z = pos.z;
            if (rotate_globe) {
                if ( force_to_iss) {
                    setClosestPhoto(data.iss_position.latitude, data.iss_position.longitude);
                    globeManipulator.set_lat_lng(data.iss_position.latitude, data.iss_position.longitude);
                } else {
                    var start_mission = -1;
                    var start_mission_str = getQueryParameterByName("m").toLowerCase();
                    if (start_mission_str.length !== 0) start_mission = parseInt(start_mission_str, 10);
                    var start_photo = -1;
                    var start_photo_str = getQueryParameterByName("p").toLowerCase();
                    if (start_photo_str.length !== 0) start_photo = parseInt(start_photo_str, 10);
                    if (start_mission !== -1 && start_photo !== -1) {
                        if (start_mission >= 1 && start_mission <= missionData.length) {
                            if (start_photo >= 1 && start_photo <= missionData[start_mission - 1].length) {
                                curMission = start_mission - 1;
                                curPhoto = start_photo - 1;
                                numPhotos = missionData[curMission].length;
                                setHelperPos("closest", missionData[curMission][curPhoto][0], missionData[curMission][curPhoto][1]);
                                gotoPhoto(0);
                            }
                        }
                    } else {
                        setClosestPhoto(data.iss_position.latitude, data.iss_position.longitude);
                        globeManipulator.set_lat_lng(data.iss_position.latitude, data.iss_position.longitude);
                    }
                }
            }
            setTimeout(function () {
                positionISS(false, false);
            }, 1 * 30 * 1000);
        },
        error: function (request, status, error) {
            console.warn("Unable to get ISS position: ", error);
        }
    });
}

function getDistanceFromLatLonInKmFast(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
}

function setClosestPhoto(lat, lng) {
    var deg2rad_const = (Math.PI / 180);
    var lat1 = lat * deg2rad_const;
    var lng1 = lng * deg2rad_const;
    var min_dist = Infinity;
    var min_i = -1;
    var min_j = -1;
    var lat2 = 0;
    var lng2 = 0;
    for (var i = 0; i < missionData.length; ++i) {
        if (missionVisible[i]) {
            for (var j = 0; j < missionData[i].length; ++j) {
                lat2 = (missionData[i][j][0]) * deg2rad_const;
                lng2 = (missionData[i][j][1]) * deg2rad_const;
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
    setHelperPos("closest", missionData[min_i][min_j][0], missionData[min_i][min_j][1]);
    curMission = min_i;
    curPhoto = min_j;
    numPhotos = missionData[min_i].length;
    gotoPhoto(0);
}

function setPhotoImgSrc(url) {

    var photo_img = document.getElementById('photo_img');
    if (photo_img) {
        photo_img.src = url;
    }
}

function updateURLandTwitter() {
    var url = "?m=" + (curMission+1) + "&p=" + (curPhoto+1);
    window.history.replaceState('', '', url);

    var elem = document.getElementById("twitter");
    elem.innerHTML = '<a href="https://twitter.com/share" class="twitter-share-button" data-via="callumprentice" data-size="large" data-related="callumprentice" data-hashtags="spaceapps" data-url="' + window.location.href + '">Tweet</a>';
    twttr.widgets.load();
}

function gotoPhoto(delta) {
    curPhoto += delta;
    if (curPhoto === numPhotos) curPhoto = 0;
    if (curPhoto < 0) curPhoto = numPhotos - 1;

    var image_size = "small";
    if (isWindowSwapped) {
        image_size = "large";
    }

    var url = buildPhotoURL(image_size, curMission, curPhoto);
    setPhotoImgSrc(url);

    setHelperPos("closest", missionData[curMission][curPhoto][0], missionData[curMission][curPhoto][1]);
    globeManipulator.set_lat_lng(missionData[curMission][curPhoto][0], missionData[curMission][curPhoto][1]);

    updateURLandTwitter();
}

function buildPhotoURL(size, mission_num, mission_photo_num) {
    var photoid = missionData[mission_num][mission_photo_num][2];
    var mission = "ISS" + ("00" + (mission_num + 1)).slice(-3);
    var mrf = mission + "-E-" + photoid;
    var photo_thumb_url = "http://eol.jsc.nasa.gov/DatabaseImages/ESC/" + size + "/" + mission + "/" + mrf + ".jpg";
    return photo_thumb_url;
}

function expandPhoto() {
    var large_photo_url = buildPhotoURL("large", curMission, curPhoto);
    window.open(large_photo_url);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updatePhotoLabel() {
    var str = "&nbsp;Mission ";
    str += (curMission + 1);
    str += ", photo ";
    str += numberWithCommas(curPhoto + 1);
    str += " of " + numberWithCommas(numPhotos);
    str += " (Click to enlarge)";
    str += "<br>&nbsp;";
    str += numberWithCommas(totalPhotos) + " photos total, " + numberWithCommas(selectedPhotos) + " selected";

    var element = document.getElementById("photo_label");
    if (element) {
        element.innerHTML = str;
    }
}

function onPhotoLoaded() {

    var image_window_width = document.getElementById("image_window").offsetWidth;
    var image_window_height = document.getElementById("image_window").offsetHeight;

    var image_width = document.getElementById("photo_img").naturalWidth;
    var image_height = document.getElementById("photo_img").naturalHeight;

    var new_width = image_width;
    var new_height = image_height;

    if (image_height > image_window_height) {
        new_height = image_window_height;
        new_width = image_width * (image_window_height / image_height);
    }

    if (new_width > image_window_width) {
        new_width = image_window_width;
        new_height = image_height * (image_window_width / image_width);
    }

    var img_element = document.getElementById("photo_img");
    if (img_element && img_element.style) {
        img_element.style.width = new_width + "px";
        img_element.style.height = new_height + "px";
    }

    updatePhotoLabel();
}

function onClicked(event) {
    if (event.intersects && event.mouse_event.button == 2) {
        setClosestPhoto(event.lat, event.lng);
    }
}

function showAbout(visible) {
    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
        document.getElementById("about_box").className = "show";
        document.getElementById("about_box").style.pointerEvents = "all";
        showHelpContents("about_text")

    } else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
        showHelpContents("none")
    }
}

function showHelpContents(id) {
    document.getElementById('about_text').className = "hide help_contents mouse_off";
    document.getElementById('controls_text_1').className = "hide help_contents mouse_off";
    document.getElementById('controls_text_2').className = "hide help_contents mouse_off";
    document.getElementById('future_text').className = "hide help_contents mouse_off";
    document.getElementById('credits_text').className = "hide help_contents mouse_off";
    document.getElementById('contact_text').className = "hide help_contents mouse_off";

    var element = document.getElementById(id);
    if (element) {
        document.getElementById(id).className = "show help_contents mouse_on";
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    globeManipulator.update();
    renderer.render(scene, camera);
}
