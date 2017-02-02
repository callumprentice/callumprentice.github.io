/**
 * Stack Overflowing
 * @author Callum Prentice 2017 / http://callum.com/
 */
var camera, scene, renderer, controls, stats;
var positions, colors, sizes;
var line_positions;
var manager = new THREE.LoadingManager();
var loader = new THREE.TextureLoader(manager);
var radius = 0.5;
var is_loading = false;
var track_point_size = settings.default_track_point_size;
var track_point_opacity = settings.default_track_point_opacity;
var track_line_opacity = settings.default_track_line_opacity;
var track_point_speed_scale = settings.default_track_point_speed_scale;
var track_lines_object;
var track_points_object;
var min_arc_distance_miles = +Infinity;
var max_arc_distance_miles = -Infinity;
var cur_arc_distance_miles = 0;
var changing_arc_distance_miles = 0;
var spline_point_cache = [];
var all_tracks = [];

function start_app() {
    init();
    animate();
}

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

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.x = -0.3;
    camera.position.y = 0.8;
    camera.position.z = 1.4;

    scene.add(new THREE.AmbientLight(0x777777));

    var light1 = new THREE.DirectionalLight(0xffffff, 0.2);
    light1.position.set(5, 3, 5);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0xffffff, 0.2);
    light2.position.set(5, 3, -5);
    scene.add(light2);

    var segments = 64;

    loader.load(
        'images/earth.jpg',
        function(earth_texture) {

            loader.load(
                'images/water.png',
                function(water_texture) {

                    scene.add(new THREE.Mesh(
                        new THREE.SphereGeometry(radius, segments, segments),
                        new THREE.MeshPhongMaterial({
                            map: earth_texture,
                            specularMap: water_texture,
                            specular: new THREE.Color(0x999999)
                        })
                    ));

                    generateControlPoints(radius);

                    track_lines_object = generate_track_lines();
                    scene.add(track_lines_object);

                    track_points_object = generate_track_point_cloud();
                    scene.add(track_points_object);

                    var gui = new dat.GUI();

                    gui.add(this, 'changing_arc_distance_miles', min_arc_distance_miles, max_arc_distance_miles).name("Max Distance Miles").onFinishChange(function(value) {
                        cur_arc_distance_miles = value;
                        update_track_lines();
                    });

                    gui.add(this, 'track_line_opacity', 0, 0.25).name("Line Opacity").onChange(function(value) {
                        track_lines_object.material.opacity = value;
                    });

                    gui.add(this, 'track_point_opacity', 0, 1.0).name("Points Opacity").onChange(function(value) {
                        track_points_object.material.uniforms.opacity.value = value;
                    });

                    gui.add(this, 'track_point_size', 0, 0.1).name("Point Size").onChange(function(value) {
                        var index = 0;
                        for (var i = 0; i < all_tracks.length; ++i) {

                            for (var j = 0; j < all_tracks[i].point_positions.length; ++j) {
                                sizes[index] = value;
                                ++index;
                            }
                        }
                        track_points_object.geometry.attributes.size.needsUpdate = true;
                    });
                    gui.add(this, "handle_about").name("About & Credits");

                    show_loading(false);
                });
        });


    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.4;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 0.75;
    controls.maxDistance = 4.0;

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);
}

function generateControlPoints(radius) {

    for (var f = 0; f < lat_lng_pairs.length; ++f) {

        var start_lat = lat_lng_pairs[f][0];
        var start_lng = lat_lng_pairs[f][1];
        var end_lat = lat_lng_pairs[f][2];
        var end_lng = lat_lng_pairs[f][3];

        if (start_lat === end_lat && start_lng === end_lng) {
            continue;
        }

        var max_height = Math.random() * 0.1 + 0.05;

        var points = [];
        var spline_control_points = 8;
        for (var i = 0; i < spline_control_points + 1; i++) {
            var arc_angle = i * 180.0 / spline_control_points;
            var arc_radius = radius + (Math.sin(arc_angle * Math.PI / 180.0)) * max_height;
            var latlng = lat_lng_inter_point(start_lat, start_lng, end_lat, end_lng, i / spline_control_points);

            var pos = xyz_from_lat_lng(latlng.lat, latlng.lng, arc_radius);

            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }

        var spline = new THREE.CatmullRomCurve3(points);
        var arc_distance = lat_lng_distance(start_lat, start_lng, end_lat, end_lng);

        var point_positions = [];

        for (var t = 0; t < arc_distance; t += settings.track_point_spacing) {

            var offset = t / arc_distance;

            point_positions.push(spline.getPoint(offset));
        }

        var arc_distance_miles = (arc_distance / (2 * Math.PI)) * 24901;

        if (arc_distance_miles < min_arc_distance_miles) {
            min_arc_distance_miles = arc_distance_miles;
        }

        if (arc_distance_miles > max_arc_distance_miles) {
            max_arc_distance_miles = parseInt(Math.ceil(arc_distance_miles / 1000.0) * 1000);
            cur_arc_distance_miles = max_arc_distance_miles;
            changing_arc_distance_miles = max_arc_distance_miles;
        }

        var speed = Math.random() * 600 + 400;

        var track = {
            spline: spline,
            arc_distance: arc_distance,
            arc_distance_miles: arc_distance_miles,
            num_points: parseInt(arc_distance / settings.track_point_spacing) + 1,
            point_positions: point_positions,
            default_speed: speed,
            speed: speed * track_point_speed_scale
        };
        all_tracks.push(track);
    }
}

function xyz_from_lat_lng(lat, lng, radius) {

    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;

    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

function lat_lng_distance(lat1, lng1, lat2, lng2) {

    var a = Math.sin(((lat2 - lat1) * Math.PI / 180) / 2) *
        Math.sin(((lat2 - lat1) * Math.PI / 180) / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(((lng2 - lng1) * Math.PI / 180) / 2) *
        Math.sin(((lng2 - lng1) * Math.PI / 180) / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;
}

function lat_lng_inter_point(lat1, lng1, lat2, lng2, offset) {

    lat1 = lat1 * Math.PI / 180.0;
    lng1 = lng1 * Math.PI / 180.0;
    lat2 = lat2 * Math.PI / 180.0;
    lng2 = lng2 * Math.PI / 180.0;

    var d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
    var A = Math.sin((1 - offset) * d) / Math.sin(d);
    var B = Math.sin(offset * d) / Math.sin(d);
    var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
    var lng = Math.atan2(y, x) * 180 / Math.PI;

    return {
        lat: lat,
        lng: lng
    };
}

function generate_track_point_cloud() {

    var num_points = 0;
    for (var i = 0; i < all_tracks.length; ++i) {
        num_points += all_tracks[i].num_points;
    }

    var track_point_cloud_geom = new THREE.BufferGeometry();

    positions = new Float32Array(num_points * 3);
    colors = new Float32Array(num_points * 3);
    sizes = new Float32Array(num_points);

    var index = 0;

    for (i = 0; i < all_tracks.length; ++i) {

        var color = new THREE.Color(0xffffff).setHSL(i / all_tracks.length, 0.6, 0.6);

        for (var j = 0; j < all_tracks[i].point_positions.length; ++j) {

            positions[3 * index + 0] = 0;
            positions[3 * index + 1] = 0;
            positions[3 * index + 2] = 0;

            colors[3 * index + 0] = color.r;
            colors[3 * index + 1] = color.g;
            colors[3 * index + 2] = color.b;

            sizes[index] = track_point_size;

            ++index;
        }
    }

    track_point_cloud_geom.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    track_point_cloud_geom.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    track_point_cloud_geom.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    track_point_cloud_geom.computeBoundingBox();

    var uniforms = {
        color: {
            type: "c",
            value: new THREE.Color(0xffffff)
        },
        texture: {
            type: "t",
            value: loader.load('images/point.png',
                function(point_texture) {
                    return point_texture;
                })
        },
        opacity: {
            type: "f",
            value: track_point_opacity
        }
    };

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
    });

    return new THREE.Points(track_point_cloud_geom, shaderMaterial);
}

function update_track_point_cloud() {

    var index = 0;

    for (var i = 0; i < all_tracks.length; ++i) {

        var time_scale = (Date.now() % all_tracks[i].speed) / (all_tracks[i].speed * all_tracks[i].num_points);
        var normalized_arc_dist = settings.track_point_spacing / all_tracks[i].arc_distance;

        for (var j = 0; j < all_tracks[i].num_points; j++) {

            if (all_tracks[i].arc_distance_miles <= cur_arc_distance_miles) {
                var offset_time = j * normalized_arc_dist + time_scale;

                var pos = fast_get_spline_point(i, offset_time);

                positions[3 * index + 0] = pos.x;
                positions[3 * index + 1] = pos.y;
                positions[3 * index + 2] = pos.z;

            } else {
                positions[3 * index + 0] = Infinity;
                positions[3 * index + 1] = Infinity;
                positions[3 * index + 2] = Infinity;
            }

            index++;
        }
    }

    track_points_object.geometry.attributes.position.needsUpdate = true;
}

function fast_get_spline_point(index, t) {

    var t_compare = parseInt(t * 1000);

    if (spline_point_cache[index] === undefined) {
        spline_point_cache[index] = [];
    }

    if (spline_point_cache[index][t_compare] !== undefined) {
        return spline_point_cache[index][t_compare];
    }

    var pos = all_tracks[index].spline.getPoint(t);

    spline_point_cache[index][t_compare] = pos;

    return pos;
}

function generate_track_lines() {

    var geometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: track_line_opacity,
        depthTest: true,
        depthWrite: false,
        linewidth: 0.2
    });
    line_positions = new Float32Array(all_tracks.length * 3 * 2 * settings.num_track_line_control_points);
    var colors = new Float32Array(all_tracks.length * 3 * 2 * settings.num_track_line_control_points);

    for (var i = 0; i < all_tracks.length; ++i) {

        var color = new THREE.Color(0xffffff).setHSL(i / all_tracks.length, 0.9, 0.8);

        for (var j = 0; j < settings.num_track_line_control_points - 1; ++j) {

            var start_pos = all_tracks[i].spline.getPoint(j / (settings.num_track_line_control_points - 1));
            var end_pos = all_tracks[i].spline.getPoint((j + 1) / (settings.num_track_line_control_points - 1));

            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 0] = start_pos.x;
            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 1] = start_pos.y;
            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 2] = start_pos.z;
            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 3] = end_pos.x;
            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 4] = end_pos.y;
            line_positions[(i * settings.num_track_line_control_points + j) * 6 + 5] = end_pos.z;

            colors[(i * settings.num_track_line_control_points + j) * 6 + 0] = color.r;
            colors[(i * settings.num_track_line_control_points + j) * 6 + 1] = color.g;
            colors[(i * settings.num_track_line_control_points + j) * 6 + 2] = color.b;
            colors[(i * settings.num_track_line_control_points + j) * 6 + 3] = color.r;
            colors[(i * settings.num_track_line_control_points + j) * 6 + 4] = color.g;
            colors[(i * settings.num_track_line_control_points + j) * 6 + 5] = color.b;
        }
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(line_positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    return new THREE.Line(geometry, material, THREE.LineSegments);
}

function update_track_lines() {

    for (var i = 0; i < all_tracks.length; ++i) {

        for (var j = 0; j < settings.num_track_line_control_points - 1; ++j) {

            if (all_tracks[i].arc_distance_miles <= cur_arc_distance_miles) {

                var start_pos = all_tracks[i].spline.getPoint(j / (settings.num_track_line_control_points - 1));
                var end_pos = all_tracks[i].spline.getPoint((j + 1) / (settings.num_track_line_control_points - 1));

                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 0] = start_pos.x;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 1] = start_pos.y;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 2] = start_pos.z;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 3] = end_pos.x;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 4] = end_pos.y;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 5] = end_pos.z;
            } else {
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 0] = 0.0;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 1] = 0.0;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 2] = 0.0;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 3] = 0.0;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 4] = 0.0;
                line_positions[(i * settings.num_track_line_control_points + j) * 6 + 5] = 0.0;
            }
        }
    }

    track_lines_object.geometry.attributes.position.needsUpdate = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function show_about(visible) {
    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
        document.getElementById("about_box").className = "show";
        document.getElementById("about_box").style.pointerEvents = "all";
    } else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
    }
}

function show_loading(visible) {
    if (visible) {
        is_loading = true;
        document.getElementById("loading_overlay").className = "show";
        document.getElementById("loading_overlay").style.pointerEvents = "all";
    } else {
        is_loading = false;
        document.getElementById("loading_overlay").className = "hide";
        document.getElementById("loading_overlay").style.pointerEvents = "none";
    }
}

function handle_about() {
    show_about(true);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (!is_loading) {
        controls.update();
        update_track_point_cloud();
        stats.update();
    }

    renderer.render(scene, camera);
}