/*
 * Global Warming WebGL Experiment
 * September 2016
 * Callum Prentice / http://callum.com/
 */
var camera, scene, renderer;
var group;
var radius = 0.5;
var sphere_vert_positions = [];
var plane_vert_positions = [];
var data_mesh_geometry = 0;
var data_mesh_positions = 0;
var data_mesh_colors = 0;
var num_lat = yearly_anomalies_data_params.num_lat;
var num_lng = yearly_anomalies_data_params.num_lng;
var data_mesh_material = 0;
var earth_sphere = 0;
var earth_plane = 0;
var min_anomalies_val = 0;
var max_anomalies_val = 0;
var data_first_year = yearly_anomalies_data_params.start_year;
var data_last_year = yearly_anomalies_data_params.end_year;
var start_year = parseInt(data_first_year + Math.random() * (data_last_year - data_first_year + 1));
var manager = new THREE.LoadingManager();
var loader = new THREE.TextureLoader(manager);
var globe_controls;
var sphere_verts_enabled = false;
var plane_verts_enabled = false;
var anim_globe_enabled = false;
var anim_date_enabled = false;
var anim_globe_timeout = 0;
var anim_globe_angle = 0.0;
var anim_date_timeout = 0;
var anim_date_speed = 0;

function app() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    init();
    animate();
}

function xyzFromLatLng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;

    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

function create_sphere_verts() {

    var mesh_radius = radius * 1.01;
    for (var lng_idx = 0; lng_idx < num_lng; ++lng_idx) {

        for (var lat_idx = 0; lat_idx < num_lat; ++lat_idx) {

            var lat1 = (90.0 - 2.5) - lat_idx * 5;
            var lng1 = lng_idx * 5 - 180.0 + 2.5;

            var degrees_offset = 2.375;
            var pos_tl = xyzFromLatLng(lat1 - degrees_offset, lng1 + degrees_offset, mesh_radius);
            var pos_tr = xyzFromLatLng(lat1 + degrees_offset, lng1 + degrees_offset, mesh_radius);
            var pos_bl = xyzFromLatLng(lat1 - degrees_offset, lng1 - degrees_offset, mesh_radius);
            var pos_br = xyzFromLatLng(lat1 + degrees_offset, lng1 - degrees_offset, mesh_radius);

            sphere_vert_positions.push(pos_tl.x);
            sphere_vert_positions.push(pos_tl.y);
            sphere_vert_positions.push(pos_tl.z);
            sphere_vert_positions.push(pos_tr.x);
            sphere_vert_positions.push(pos_tr.y);
            sphere_vert_positions.push(pos_tr.z);
            sphere_vert_positions.push(pos_br.x);
            sphere_vert_positions.push(pos_br.y);
            sphere_vert_positions.push(pos_br.z);

            sphere_vert_positions.push(pos_tl.x);
            sphere_vert_positions.push(pos_tl.y);
            sphere_vert_positions.push(pos_tl.z);
            sphere_vert_positions.push(pos_br.x);
            sphere_vert_positions.push(pos_br.y);
            sphere_vert_positions.push(pos_br.z);
            sphere_vert_positions.push(pos_bl.x);
            sphere_vert_positions.push(pos_bl.y);
            sphere_vert_positions.push(pos_bl.z);
        }
    }
}

function get_sphere_distance() {

    var dist_radius = radius / 2;
    var aspect = window.innerHeight / window.innerWidth;
    if (aspect > 1) dist_radius = dist_radius * aspect;
    var dist = dist_radius / (Math.sin(camera.fov * (Math.PI / 180.0) / 2));
    var tweaked_dist = dist * 1.1;

    return tweaked_dist;
}

function set_to_sphere_verts() {

    enable_sphere_button(false);
    enable_plane_button(false);

    var dist = get_sphere_distance();

    new TWEEN.Tween({
            index: 0.0,
            group_x: group.position.x,
            group_y: group.position.y,
            group_z: group.position.z
        })
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .to({
            index: 1.0,
            group_x: 0.0,
            group_y: 0.0,
            group_z: -dist
        }, 500)
        .onUpdate(function () {
            if (data_mesh_geometry) {
                for (var i = 0; i < num_lat * num_lng * 18; ++i) {
                    data_mesh_positions[i] = (this.index * sphere_vert_positions[i] + (1 - this.index) * plane_vert_positions[i]) / 2.0;
                }

                group.position.x = this.group_x;
                group.position.y = this.group_y;
                group.position.z = this.group_z;

                globe_controls.reset(0);
            }
        })
        .onStart(function () {
            data_mesh_material.side = THREE.FrontSide;
            data_mesh_material.needsUpdate = true;

            earth_sphere.visible = false;
            earth_plane.visible = false;

        })
        .onComplete(function () {
            globe_controls.reset(0);

            enable_plane_button(true);

            earth_sphere.visible = true;
            earth_plane.visible = false;

        })
        .start();
}

function create_plane_verts() {

    for (var lng_idx = 0; lng_idx < num_lng; ++lng_idx) {

        for (var lat_idx = 0; lat_idx < num_lat; ++lat_idx) {

            var x = (lng_idx - num_lng / 2 + 0.5) / 8.0;
            var y = (num_lat / 2 - lat_idx - 0.5) / 8.0;
            var w = Math.abs(((0 - num_lng / 2 + 0.5) - 1 + num_lng / 2 - 0.5) / 2) / 8 * 0.925;
            var z = 0.0;

            pos_tl = {
                x: x - w,
                y: y - w,
                z: z
            }
            pos_tr = {
                x: x + w,
                y: y - w,
                z: z
            }
            pos_bl = {
                x: x - w,
                y: y + w,
                z: z
            }
            pos_br = {
                x: x + w,
                y: y + w,
                z: z
            }

            plane_vert_positions.push(pos_tl.x);
            plane_vert_positions.push(pos_tl.y);
            plane_vert_positions.push(pos_tl.z);
            plane_vert_positions.push(pos_tr.x);
            plane_vert_positions.push(pos_tr.y);
            plane_vert_positions.push(pos_tr.z);
            plane_vert_positions.push(pos_br.x);
            plane_vert_positions.push(pos_br.y);
            plane_vert_positions.push(pos_br.z);

            plane_vert_positions.push(pos_tl.x);
            plane_vert_positions.push(pos_tl.y);
            plane_vert_positions.push(pos_tl.z);
            plane_vert_positions.push(pos_br.x);
            plane_vert_positions.push(pos_br.y);
            plane_vert_positions.push(pos_br.z);
            plane_vert_positions.push(pos_bl.x);
            plane_vert_positions.push(pos_bl.y);
            plane_vert_positions.push(pos_bl.z);
        }
    }
}

function get_plane_distance() {

    var w = ((num_lng - 1) - num_lng / 2 + 0.5) / 8.0;
    var aspect = window.innerHeight / window.innerWidth;
    w = w * aspect;
    var dist = w / (2 * Math.tan(camera.fov * (Math.PI / 180) / 2));
    var tweaked_dist = dist * 1.05

    return tweaked_dist;
}

function set_to_plane_verts() {

    enable_sphere_button(false);
    enable_plane_button(false);
    anim_globe(false);

    var dist = get_plane_distance();

    new TWEEN.Tween({
            index: 1.0,
            group_x: group.position.x,
            group_y: group.position.y,
            group_z: group.position.z
        })
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .to({
            index: 0.0,
            group_x: 0.0,
            group_y: 0.0,
            group_z: -dist
        }, 500)
        .onUpdate(function () {
            if (data_mesh_geometry) {
                for (var i = 0; i < num_lat * num_lng * 18; ++i) {
                    data_mesh_positions[i] = (this.index * sphere_vert_positions[i] + (1 - this.index) * plane_vert_positions[i]) / 2.0;
                }
                group.position.x = this.group_x;
                group.position.y = this.group_y;
                group.position.z = this.group_z;

                globe_controls.reset(0);
            }
        })
        .onStart(function () {
            data_mesh_material.side = THREE.DoubleSide;
            data_mesh_material.needsUpdate = true;

            earth_sphere.visible = false;
            earth_plane.visible = false;

        })
        .onComplete(function () {
            globe_controls.reset(0);

            earth_sphere.visible = false;
            earth_plane.visible = true;

            enable_sphere_button(true);

        })
        .start();
}

function create_mesh(radius, data_set) {

    data_mesh_geometry = new THREE.BufferGeometry();

    var mesh_radius = radius * 1.001;

    data_mesh_positions = new Float32Array(num_lat * num_lng * 3 * 3 * 2);
    data_mesh_colors = new Float32Array(num_lat * num_lng * 3 * 3 * 2);

    for (var lng_idx = 0; lng_idx < num_lng; ++lng_idx) {

        for (var lat_idx = 0; lat_idx < num_lat; ++lat_idx) {

            for (var i = 0; i < 18; ++i) {
                var index = (lng_idx * num_lat + lat_idx) * 18;

                data_mesh_positions[index + i] = 0;
                data_mesh_colors[index + i] = 0;
            }
        }
    }

    update_data(start_year);

    data_mesh_geometry.addAttribute('position', new THREE.BufferAttribute(data_mesh_positions, 3));
    data_mesh_geometry.addAttribute('color', new THREE.BufferAttribute(data_mesh_colors, 3));

    data_mesh_material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.65,
        side: THREE.FrontSide,
        vertexColors: THREE.VertexColors
    });

    var mesh = new THREE.Mesh(data_mesh_geometry, data_mesh_material);

    group.add(mesh);
}

function update_data(year) {

    var color = new THREE.Color();

    for (var lng_idx = 0; lng_idx < num_lng; ++lng_idx) {

        for (var lat_idx = 0; lat_idx < num_lat; ++lat_idx) {

            var data_color_position = (year - data_first_year) * num_lng * num_lat + lat_idx * num_lng + lng_idx;

            var data_color = yearly_anomalies_data[data_color_position];

            if (data_color > 90.0) {
                color.setRGB(0.8, 0.8, 0.8);
            } else
            if (data_color > 0) {
                var col = data_color / max_anomalies_val;
                color.setHSL(0.0, data_color / max_anomalies_val, 0.5)
            } else
            if (data_color < 0) {
                color.setHSL(240.0 / 360.0, data_color / min_anomalies_val, 0.5)
            } else {
                color.setRGB(1.0, 1.0, 1.0);
            }

            var index = (lng_idx * num_lat + lat_idx) * 18;

            data_mesh_colors[index + 0] = color.r;
            data_mesh_colors[index + 1] = color.g;
            data_mesh_colors[index + 2] = color.b;
            data_mesh_colors[index + 3] = color.r;
            data_mesh_colors[index + 4] = color.g;
            data_mesh_colors[index + 5] = color.b;
            data_mesh_colors[index + 6] = color.r;
            data_mesh_colors[index + 7] = color.g;
            data_mesh_colors[index + 8] = color.b;

            data_mesh_colors[index + 9] = color.r;
            data_mesh_colors[index + 10] = color.g;
            data_mesh_colors[index + 11] = color.b;
            data_mesh_colors[index + 12] = color.r;
            data_mesh_colors[index + 13] = color.g;
            data_mesh_colors[index + 14] = color.b;
            data_mesh_colors[index + 15] = color.r;
            data_mesh_colors[index + 16] = color.g;
            data_mesh_colors[index + 17] = color.b;
        }
    }
}

function calculate_min_max_anomalies() {

    var raw_positive_total = 0;
    var raw_positive_count = 0;
    var raw_negative_total = 0;
    var raw_negative_count = 0;
    var raw_positive_min = Infinity;
    var raw_positive_max = -Infinity;
    var raw_negative_min = Infinity;
    var raw_negative_max = -Infinity;
    var raw_positive_mean = 0;

    for (i = 0; i < yearly_anomalies_data.length; ++i) {

        var anomaly = yearly_anomalies_data[i];

        if (anomaly != 99) {

            if (anomaly > 0) {
                if (anomaly < raw_positive_min) {
                    raw_positive_min = anomaly;
                }

                if (anomaly > raw_positive_max) {
                    raw_positive_max = anomaly;
                }

                raw_positive_count++
                raw_positive_total += anomaly;
            }

            if (anomaly < 0) {
                if (anomaly < raw_negative_min) {
                    raw_negative_min = anomaly;
                }

                if (anomaly > raw_negative_max) {
                    raw_negative_max = anomaly;
                }

                raw_negative_count++
                raw_negative_total += -anomaly;
            }
        }
    }

    raw_positive_mean = raw_positive_total / raw_positive_count;
    raw_negative_mean = raw_negative_total / raw_negative_count;

    var sd_positive_total = 0
    var sd_negative_total = 0
    for (i = 0; i < yearly_anomalies_data.length; ++i) {

        var anomaly = yearly_anomalies_data[i];

        if (anomaly != 99) {
            if (anomaly > 0) {
                sd_positive_total += (anomaly - raw_positive_mean) * (anomaly - raw_positive_mean)
            } else {
                sd_negative_total += (-anomaly - raw_negative_mean) * (-anomaly - raw_negative_mean)
            }
        }
    }

    var sd_positive_mean = sd_positive_total / raw_positive_count;
    var sd_positive = Math.sqrt(sd_positive_mean);
    var sd_negative_mean = sd_negative_total / raw_negative_count;
    var sd_negative = Math.sqrt(sd_negative_mean);

    var sd2_positive_max = -Infinity;
    var sd2_negative_max = -Infinity;

    for (i = 0; i < yearly_anomalies_data.length; ++i) {

        var anomaly = yearly_anomalies_data[i];

        if (anomaly > 0) {
            if (anomaly - 2 * sd_positive < raw_positive_mean) {

                if (anomaly > sd2_positive_max) {
                    sd2_positive_max = anomaly
                }
            }
        } else {
            if (-anomaly - 2 * sd_positive < raw_negative_mean) {

                if (-anomaly > sd2_negative_max) {
                    sd2_negative_max = -anomaly
                }
            }
        }
    }

    min_anomalies_val = -sd2_negative_max;
    max_anomalies_val = sd2_positive_max;
}

function init_date_slider() {

    var slider = document.getElementById('date_slider');

    noUiSlider.create(slider, {
        start: start_year,
        range: {
            'min': data_first_year,
            'max': data_last_year
        },
        step: 1
    });

    slider.noUiSlider.on('update', function (values, handle) {

        var year = parseInt(values[handle]);
        update_data(year)

        document.getElementById('date_slider_label')
            .innerHTML = year
    });
}

function update_globe_spin() {
    group.rotation.y += 0.005;
}

function anim_globe(state) {
    enable_anim_globe_button(!state);
    anim_globe_enabled = state;
    if (state && anim_globe_timeout == 0) {
        anim_globe_timeout = setInterval(update_globe_spin, 20)
    } else {
        clearInterval(anim_globe_timeout);
        anim_globe_timeout = 0;
    }
}

function update_date() {
    var slider = document.getElementById('date_slider');
    var val = slider.noUiSlider.get();
    ++val;
    if (val > data_last_year) {
        val = data_first_year;
    }
    slider.noUiSlider.set(val)
}

function anim_date(cur_speed) {
    var max_cur_speed = 3;

    if (cur_speed) {
        clearInterval(anim_date_timeout);
        anim_date_timeout = setInterval(update_date, 50 + 1500 - cur_speed * 500);
    } else {
        clearInterval(anim_date_timeout);
    }

    if (++cur_speed > max_cur_speed) {
        cur_speed = 0;
    }

    var next_cmd = 'javascript:anim_date(' + cur_speed + ');'
    document.getElementById('anim_date_link')
        .href = next_cmd;

    var img_cur_speed = cur_speed++;
    if (img_cur_speed > max_cur_speed) {
        img_cur_speed = 0;
    }
    var img_name = 'img/anim_date_' + img_cur_speed + '.png';
    document.getElementById('anim_date_img')
        .src = img_name;
}

function enable_sphere_button(state) {
    sphere_verts_enabled = state;

    if (state) {
        document.getElementById('make_sphere_link')
            .href = 'javascript:set_to_sphere_verts();';
        document.getElementById('make_sphere_img')
            .src = 'img/make_sphere.png';
        enable_anim_globe_button(false);
    } else {
        document.getElementById('make_sphere_link')
            .href = "#";
        document.getElementById('make_sphere_img')
            .src = 'img/make_sphere_off.png';
        enable_anim_globe_button(true);
    }
}

function enable_plane_button(state) {
    plane_verts_enabled = state;

    if (state) {
        document.getElementById('make_plane_link')
            .href = 'javascript:set_to_plane_verts();';
        document.getElementById('make_plane_img')
            .src = 'img/make_plane.png';
        enable_anim_globe_button(true);
    } else {
        document.getElementById('make_plane_link')
            .href = "#";
        document.getElementById('make_plane_img')
            .src = 'img/make_plane_off.png';
        enable_anim_globe_button(false);
    }
}

function enable_anim_globe_button(state) {
    if (state) {
        document.getElementById('anim_globe_link')
            .href = 'javascript:anim_globe(true);';
        document.getElementById('anim_globe_img')
            .src = 'img/anim_globe.png';
    } else {
        document.getElementById('anim_globe_link')
            .href = '#;';
        document.getElementById('anim_globe_img')
            .src = 'img/anim_globe_off.png';
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

function showHelpContents(id) {
    document.getElementById('about_text')
        .className = "hide help_contents mouse_off";
    document.getElementById('controls_text')
        .className = "hide help_contents mouse_off";
    document.getElementById('future_text')
        .className = "hide help_contents mouse_off";
    document.getElementById('credits_text')
        .className = "hide help_contents mouse_off";

    var element = document.getElementById(id);
    if (element) {
        document.getElementById(id)
            .className = "show help_contents mouse_on";
    }
}

function show_help(visible) {
    if (visible) {
        document.getElementById("about_box_bkg")
            .className = "show";
        document.getElementById("about_box")
            .className = "show";
        document.getElementById("about_box")
            .style.pointerEvents = "all";
        showHelpContents("about_text")

    } else {
        document.getElementById("about_box_bkg")
            .className = "hide";
        document.getElementById("about_box")
            .className = "hide";
        document.getElementById("about_box")
            .style.pointerEvents = "none";
        showHelpContents("none")
    }
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[")
        .replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "))
            .toLowerCase();
}

function share() {

    var slider = document.getElementById('date_slider');
    var year = parseInt(slider.noUiSlider.get());

    var geom_type = sphere_verts_enabled ? 'p' : 's';

    var url = "?year=" + year + "&type=" + geom_type;
    window.open(url);
}

function init() {

    var geom_type = getQueryParameterByName("type");
    var year = getQueryParameterByName("year");

    if (year >= data_first_year && year <= data_last_year) {
        start_year = year;
    }

    init_date_slider();

    enable_sphere_button(false);
    enable_plane_button(false);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000, 0.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    group = new THREE.Object3D();
    scene.add(group);

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 0.01, 1000.0);
    camera.position.set(0.0, 0.0, 0.0);

    scene.add(new THREE.AmbientLight(0x666666));

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 3, 3);
    scene.add(light);

    loader.load(
        'img/earth_surface.jpg',

        function (texture) {
            earth_sphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius / 2, 64, 64),
                new THREE.MeshPhongMaterial({
                    map: texture
                })
            )
            earth_sphere.visible = false;
            group.add(earth_sphere)

            earth_plane = new THREE.Mesh(
                new THREE.PlaneGeometry((num_lng / 2) / 8, (num_lat / 2) / 8.0),
                new THREE.MeshPhongMaterial({
                    map: texture,
                    side: THREE.DoubleSide
                })
            )

            earth_plane.position.z = -0.01;
            earth_plane.visible = false;
            group.add(earth_plane)
        });

    loader.load(
        'img/starfield.png',

        function (texture) {
            group.add(new THREE.Mesh(
                new THREE.SphereBufferGeometry(90, 64, 64),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                })
            ))
        });

    create_sphere_verts();
    create_plane_verts();

    calculate_min_max_anomalies();

    create_mesh(radius);

    if (geom_type === 'p') {
        set_to_plane_verts();
    } else {
        set_to_sphere_verts();
    }

    window.addEventListener('resize', onWindowResize, false);

    globe_controls = new GLOBE_CONTROLS({
        renderer: renderer
    });

    if (!localStorage.getItem("runOnce")) {
        localStorage.setItem("runOnce", true);
        show_help(true);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (!plane_verts_enabled) {
        var dist = get_plane_distance();
    } else {
        var dist = get_sphere_distance();
    }

    group.position.set(0.0, 0.0, -dist);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (data_mesh_geometry) {
        data_mesh_geometry.attributes.position.needsUpdate = true;
        data_mesh_geometry.attributes.color.needsUpdate = true;
        data_mesh_material.needsUpdate = true;

        if (!anim_globe_enabled) {
            group.rotation.x = globe_controls.update(group.rotation.x);
            group.rotation.y += globe_controls.get_delta(group.rotation.y);
        }
    }

    TWEEN.update();

    renderer.render(scene, camera);
}