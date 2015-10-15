/*
 * Storm Tracks WebGL Too
 * @author Callum Prentice - http://callum.com/
 * @license: MIT / http://opensource.org/licenses/MIT
 */
var camera, scene, renderer;
var controls, stats;
var storm_data;
var parent_obj = 0;
var earth_mesh = 0;
var line_geometry;
var marker_mesh;
var num_spline_control_points = 40;
var spin_speed = 0.001;
var spin = false;
var name_filter = "";

///////////////////////////////////////////////////////////////////////////////
//
function app() {

    load_storm_data();
}

///////////////////////////////////////////////////////////////////////////////
//
function init() {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    show_loading(true);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 200);
    camera.position.z = 1.5;

    scene.add(new THREE.AmbientLight(0x777777));

    var light1 = new THREE.DirectionalLight(0xffffff, 0.2);
    light1.position.set(5, 3, 5);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0xffffff, 0.2);
    light2.position.set(5, 3, -5);
    scene.add(light2);

    var radius = 0.5;
    var segments = 64;

    var stars_img = THREE.ImageUtils.loadTexture('images/starfield.png', THREE.UVMapping, function () {
        scene.add(new THREE.Mesh(
            new THREE.SphereGeometry(radius * 200, segments, segments),
            new THREE.MeshBasicMaterial({
                map: stars_img,
                side: THREE.BackSide
            })
        ));
    });

    parent_obj = new THREE.Object3D();
    scene.add(parent_obj);

    var earth_img = THREE.ImageUtils.loadTexture('images/earth_surface.jpg', THREE.UVMapping, function () {
        var elevation_img = THREE.ImageUtils.loadTexture('images/earth_elevation.jpg', THREE.UVMapping, function () {
            var water_img = THREE.ImageUtils.loadTexture('images/earth_specular.png', THREE.UVMapping, function () {
                earth_mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(radius, segments, segments),
                    new THREE.MeshPhongMaterial({
                        map: earth_img,
                        bumpMap: elevation_img,
                        bumpScale: 0.0045,
                        specularMap: water_img,
                        specular: new THREE.Color('grey')
                    })
                );
                parent_obj.add(earth_mesh);

                var storm_data_radius = radius * 1.001;
                add_storm_tracks(storm_data_radius);
                add_marker_geometry(storm_data_radius * 1.0001);

                show_loading(false);

                create_ui();
            });
        });
    });

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.4;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.1;
    controls.minDistance = 0.75;
    controls.maxDistance = 3.0;

    // Off for release
    // stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.right = '0px';
    // stats.domElement.style.top = '0px';
    // stats.domElement.style.zIndex = 100;
    // document.body.appendChild(stats.domElement);

    window.addEventListener('resize', on_window_resize, false);
}

///////////////////////////////////////////////////////////////////////////////
//
function on_window_resize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////////////////////////////////////////////////////////////
//
function show_loading(visible) {
    if (visible) {
        document.getElementById("loading_overlay").className = "show";
        document.getElementById("loading_overlay").style.pointerEvents = "all";
    } else {
        document.getElementById("loading_overlay").className = "hide";
        document.getElementById("loading_overlay").style.pointerEvents = "none";
    }
}

///////////////////////////////////////////////////////////////////////////////
//
function animate() {

    requestAnimationFrame(animate);

    controls.update();

    // off for release
    //stats.update();

    if (spin) {
        parent_obj.rotation.y += spin_speed;
    }

    renderer.render(scene, camera);
}

///////////////////////////////////////////////////////////////////////////////
//
function load_storm_data() {

    var filename = "data/storms_2015-10.csv";

    Papa.parse(filename, {
        header: false,
        dynamicTyping: false,
        delimiter: ",",
        //preview: 30,
        skipEmptyLines: true,
        fastMode: true,
        download: true,
        error: function (err, file) {
            console.error("ERROR:", err, file);
        },
        complete: function (results) {
            storm_data = results.data;
            init();
            animate();
        }
    });
}

///////////////////////////////////////////////////////////////////////////////
//
function color_from_wind_speed(wind_kts) {

    var r, g, b;

    if (wind_kts < 34) {
        r = 0x5e / 0xff;
        g = 0xba / 0xff;
        b = 0xff / 0xff;
    } else if (wind_kts > 35 && wind_kts <= 63) {
        r = 0xff / 0xff;
        g = 0xfa / 0xff;
        b = 0xf4 / 0xff;
    } else if (wind_kts > 64 && wind_kts <= 82) {
        r = 0xff / 0xff;
        g = 0xff / 0xff;
        b = 0xcc / 0xff;
    } else if (wind_kts > 83 && wind_kts <= 95) {
        r = 0xff / 0xff;
        g = 0xe7 / 0xff;
        b = 0x75 / 0xff;
    } else if (wind_kts > 96 && wind_kts <= 112) {
        r = 0xff / 0xff;
        g = 0xc1 / 0xff;
        b = 0x40 / 0xff;
    } else if (wind_kts > 113 && wind_kts <= 136) {
        r = 0xff / 0xff;
        g = 0x8f / 0xff;
        b = 0x20 / 0xff;
    } else if (wind_kts > 137) {
        r = 0xff / 0xff;
        g = 0x60 / 0xff;
        b = 0x60 / 0xff;
    } else {
        r = 0x66 / 0xff;
        g = 0x66 / 0xff;
        b = 0x66 / 0xff;
    }

    return new THREE.Vector3(r, g, b);
}

///////////////////////////////////////////////////////////////////////////////
//
function xyz_from_lat_lng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;

    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

///////////////////////////////////////////////////////////////////////////////
//
function add_storm_tracks(storm_geometry_radius) {

    var position_splines = [];
    var color_splines = [];

    for (var s = 0; s < storm_data.length; ++s) {

        if (storm_data[s].length >= (1 + 12)) {
            var points = [];
            var colors = [];

            for (var e = 5; e < storm_data[s].length - 3; e += 4) {

                var pos = xyz_from_lat_lng(storm_data[s][e + 0], storm_data[s][e + 1], storm_geometry_radius);

                points.push(pos);

                var col = color_from_wind_speed(storm_data[s][e + 3]);
                colors.push(col);
            }

            position_splines.push(new THREE.CatmullRomCurve3(points));
            color_splines.push(new THREE.CatmullRomCurve3(colors));
        } else {}
    }

    line_geometry = new THREE.BufferGeometry();
    var data_size = position_splines.length * 3 * 2 * (num_spline_control_points - 1);
    var line_positions = new Float32Array(data_size);
    var line_colors = new Float32Array(data_size);
    var line_visibles = new Float32Array(data_size / 3);

    for (var i = 0; i < position_splines.length; ++i) {

        for (var j = 0; j < num_spline_control_points - 1; ++j) {

            var start_index = j / (num_spline_control_points - 1);
            var start_pos = position_splines[i].getPoint(start_index);
            var end_index = (j + 1) / (num_spline_control_points - 1);
            var end_pos = position_splines[i].getPoint(end_index);

            var start_col = color_splines[i].getPoint(start_index);
            var end_col = color_splines[i].getPoint(end_index);

            var base_index = (i * (num_spline_control_points - 1) + j);

            line_positions[base_index * 6 + 0] = start_pos.x;
            line_positions[base_index * 6 + 1] = start_pos.y;
            line_positions[base_index * 6 + 2] = start_pos.z;
            line_positions[base_index * 6 + 3] = end_pos.x;
            line_positions[base_index * 6 + 4] = end_pos.y;
            line_positions[base_index * 6 + 5] = end_pos.z;

            line_colors[base_index * 6 + 0] = start_col.x;
            line_colors[base_index * 6 + 1] = start_col.y;
            line_colors[base_index * 6 + 2] = start_col.z;
            line_colors[base_index * 6 + 3] = end_col.x;
            line_colors[base_index * 6 + 4] = end_col.y;
            line_colors[base_index * 6 + 5] = end_col.z;

            line_visibles[base_index * 2 + 0] = 1.0;
            line_visibles[base_index * 2 + 1] = 1.0;

            final_pos = base_index * 2 + 1;
        }
    }

    line_geometry.addAttribute('position', new THREE.BufferAttribute(line_positions, 3));
    line_geometry.addAttribute('vertcolor', new THREE.BufferAttribute(line_colors, 3));
    line_geometry.addAttribute('visible', new THREE.BufferAttribute(line_visibles, 1));

    line_geometry.computeBoundingSphere();

    var shader_material = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('track_vertexshader').textContent,
        fragmentShader: document.getElementById('track_fragmentshader').textContent
    });

    parent_obj.add(new THREE.LineSegments(line_geometry, shader_material));
}

///////////////////////////////////////////////////////////////////////////////
//
function add_lat_marker_geometry(radius, lat, size, color) {

    geometry = new THREE.TorusGeometry(radius * Math.cos(lat / 180 * Math.PI), size, 8, 64);
    material = new THREE.MeshBasicMaterial({
        color: color
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2.0;
    mesh.position.y = radius * Math.sin(lat / 180 * Math.PI);
    return mesh;
}

///////////////////////////////////////////////////////////////////////////////
//
function add_lng_marker_geometry(radius, lng, size, color) {

    geometry = new THREE.TorusGeometry(radius, size, 8, 64);
    material = new THREE.MeshBasicMaterial({
        color: color
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = lng * Math.PI / 180.0;
    return mesh;
}

///////////////////////////////////////////////////////////////////////////////
//
function add_marker_geometry(radius) {

    marker_mesh = new THREE.Object3D();
    scene.add(marker_mesh);
    parent_obj.add(marker_mesh);

    // equator
    marker_mesh.add(add_lat_marker_geometry(radius, 0, 0.0008, 0x00ff00));

    // lines of lat
    for (var lat = -90; lat < 90; lat += 10) {
        marker_mesh.add(add_lat_marker_geometry(radius, lat, 0.0004, 0x00ffff00));
    }

    // lines of lng
    for (var lng = 0; lng < 180; lng += 10) {
        marker_mesh.add(add_lng_marker_geometry(radius, lng, 0.0004, 0xffff00));
    }

    // tropics
    marker_mesh.add(add_lat_marker_geometry(radius, 23.5, 0.0004, 0xff0000));
    marker_mesh.add(add_lat_marker_geometry(radius, -23.5, 0.0004, 0xff0000));
}

///////////////////////////////////////////////////////////////////////////////
//
function filter_storms(max_slider_year, max_slider_wind_speed) {

    var max_slider_date = parseInt(max_slider_year, 10) * 10000;
    max_slider_wind_speed = parseInt(max_slider_wind_speed, 10);

    var num_storms = 0;
    var name_filter_match = false;
    var lower_case_name_filter = name_filter.toLowerCase();

    for (var s = 0; s < storm_data.length; ++s) {

        if (name_filter.length === 0) {
            name_filter_match = true;
        } else

        if (storm_data[s][0].toLowerCase().indexOf(lower_case_name_filter) != -1) {
            name_filter_match = true;
        } else {
            name_filter_match = false;
        }

        var storm_date_end = storm_data[s][2];
        var storm_wind_speed_high = storm_data[s][4];

        var start = s * 2 * (num_spline_control_points - 1);

        if (name_filter_match &&
            storm_date_end >= max_slider_date &&
            storm_wind_speed_high >= max_slider_wind_speed) {

            num_storms++;

            for (var i = 0; i < (num_spline_control_points - 1) * 2; ++i) {

                line_geometry.attributes.visible.array[start + i] = 1.0;
            }
            line_geometry.attributes.visible.needsUpdate = true;

        } else {

            for (var i = 0; i < (num_spline_control_points - 1) * 2; ++i) {

                line_geometry.attributes.visible.array[start + i] = 0;
            }
            line_geometry.attributes.visible.needsUpdate = true;
        }
    }

    return num_storms;
}

///////////////////////////////////////////////////////////////////////////////
//
function create_ui() {

    var start_year = new Date().getFullYear() - 100;
    var date_slider = document.getElementById('date_slider');
    noUiSlider.create(date_slider, {
        start: start_year,
        step: 1,
        range: {
            'min': storm_data[0][1] / 10000,
            'max': new Date().getFullYear() - 1
        }
    });

    var start_wind_speed = 10;
    var wind_speed_slider = document.getElementById('wind_speed_slider');
    noUiSlider.create(wind_speed_slider, {
        start: start_wind_speed,
        step: 1,
        range: {
            'min': 0,
            'max': 135
        }
    });

    date_slider.noUiSlider.on('slide', function (value) {
        update_date(value);
    });

    function update_date(value) {
        var num_storms = filter_storms(value[0], wind_speed_slider.noUiSlider.get());
        update_date_label(value, num_storms);
    }


    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function update_date_label(value, num_storms) {
        var label = 'Storms since ' + parseInt(value, 10) + ' to present day  (' + numberWithCommas(num_storms) + ' storms)';
        document.getElementById('date_slider_label').innerHTML = label;
    }

    update_date(start_year);

    wind_speed_slider.noUiSlider.on('slide', function (value) {
        update_wind_speed(value[0]);
    });

    function update_wind_speed(value) {
        var num_storms = filter_storms(date_slider.noUiSlider.get(), value);
        var label = 'Max wind speed above ' + parseInt(value, 10) + '(kts)';
        document.getElementById('wind_speed_slider_label').innerHTML = label;

        update_date_label(date_slider.noUiSlider.get(), num_storms);
    }

    update_wind_speed(start_wind_speed);

    $("#name_filter_input").keyup(function (event) {
        if (event.which !== 13) {
            name_filter = $("#name_filter_input").val();
            var num_storms = filter_storms(date_slider.noUiSlider.get(), wind_speed_slider.noUiSlider.get());
            update_date_label(date_slider.noUiSlider.get(), num_storms);
        }
    });

    $('input[type=search]').on('search', function (event) {
        name_filter = $("#name_filter_input").val();
        var num_storms = filter_storms(date_slider.noUiSlider.get(), wind_speed_slider.noUiSlider.get());
        update_date_label(date_slider.noUiSlider.get(), num_storms);
    });
}

///////////////////////////////////////////////////////////////////////////////
//
function toggle_guides(cb) {
    if (!cb.checked) {
        marker_mesh.scale.set(0.0001, 0.0001, 0.0001);
    } else {
        marker_mesh.scale.set(1, 1, 1);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
function toggle_spin(cb) {
    spin = cb.checked ? true : false;
}

///////////////////////////////////////////////////////////////////////////////
//
function toggle_earth(cb) {
    if (!cb.checked) {
        earth_mesh.scale.set(0.0001, 0.0001, 0.0001);
    } else {
        earth_mesh.scale.set(1, 1, 1);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
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

///////////////////////////////////////////////////////////////////////////////
//
function showHelpContents(id) {
    document.getElementById('about_text').className = "hide help_contents mouse_off";
    document.getElementById('controls_text').className = "hide help_contents mouse_off";
    document.getElementById('future_text').className = "hide help_contents mouse_off";
    document.getElementById('credits_text').className = "hide help_contents mouse_off";
    document.getElementById('contact_text').className = "hide help_contents mouse_off";

    var element = document.getElementById(id);
    if (element) {
        document.getElementById(id).className = "show help_contents mouse_on";
    }
}

///////////////////////////////////////////////////////////////////////////////
//
function show_help(visible) {
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
