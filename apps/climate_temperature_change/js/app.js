// Climate Temperature Change Vizualization
// Callum Prentice <callum@gmail.com>
// Created 2018-09-16
// license: MIT / http://opensource.org/licenses/MIT

var camera, scene, renderer, stats, controls;
var container3d;
var processedData = [];
var uiClosed = true;
var uiOpenScale = 0;
var uiHeight = 220;
var legendMesh = 0;
var firstYear = 1850;
var lastYear = 2017;
var params = {
    alt_palette: false,
    auto_rotate: true,
    desired_height: 50.0,
    enable_stats: false,
    fit_to_screen: true,
    legend_slider_start: firstYear,
    line_thickness: 3.0,
    line_thickness_scale: 750.0,
    num_smooth_points: 120,
    open_help: false,
    enable_legend: true,
    viz_type: 'Rings',
    xz_base_scale: 5.0,
    xz_scale: 1.0,
    y_scale: 1.0
};

function init() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    for (var property in params) {
        if (params.hasOwnProperty(property)) {
            if (getQueryParameterByName(property) !== '') {
                var value = getQueryParameterByName(property);
                if (value == 'true') value = true;
                if (value == 'false') value = false;
                params[property] = value;
            }
        }
    }

    showHelp(params.open_help);

    container3d = document.getElementById('container3d');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container3d.offsetWidth, container3d.offsetHeight);
    container3d.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, container3d.offsetWidth / container3d.offsetHeight, 1, 1000);
    camera.position.z = -100;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 0.0;
    controls.maxDistance = 1000.0;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.2;
    controls.autoRotate = params.auto_rotate;
    controls.autoRotateSpeed = 0.2;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);

    const num_lights = 4;
    const distance = 200.0;
    for (var l = 0; l < num_lights; ++l) {
        var angle = (l / num_lights) * Math.PI * 2.0;
        var x = distance * Math.cos(angle);
        var y = 10.0;
        var z = distance * Math.sin(angle);

        var lights = new THREE.PointLight(0xaaaaaa, 0.4, 0);
        lights.position.set(x, y, z);
        scene.add(lights);
    }
    var light = new THREE.PointLight(0xaaaaaa, 0.9, 0);
    light.position.set(0.0, 0.0, 0.0);
    scene.add(light);

    light = new THREE.PointLight(0xaaaaaa, 0.9, 0);
    light.position.set(0.0, params.desired_height, 0.0);
    scene.add(light);

    light = new THREE.PointLight(0xaaaaaa, 0.9, 0);
    light.position.set(0.0, -params.desired_height, 0.0);
    scene.add(light);

    createSettingsUI();

    container3d.addEventListener('click', onMouseClick, false);
    container3d.addEventListener('touchstart', onMouseClick, false);
    container3d.addEventListener('mousedown', onMouseClick, false);

    window.addEventListener('resize', onWindowResize, false);

    if (params.enable_stats) {
        stats = new Stats();
        container3d.appendChild(stats.domElement);
    }

    selectVisualization(params, true);
}

function onWindowResize() {
    var new_width = container3d.offsetWidth;
    var new_height = container3d.offsetHeight - uiHeight * uiOpenScale;

    camera.aspect = new_width / new_height;
    camera.updateProjectionMatrix();
    renderer.setSize(new_width, new_height);

    document.getElementById('ui_div').style.height = window.innerHeight - new_height + 'px';
}

function onMouseClick(event) {
    controls.autoRotate = false;
    params.auto_rotate = false;

    document.getElementById('auto_rotate_slider').noUiSlider.set(0.0);
    document.getElementById('auto_rotate_slider').classList.remove('on');
    document.getElementById('auto_rotate_slider').classList.add('off');
    document.getElementById('auto_rotate_slider_label').innerHTML = 'Auto rotate <strong>OFF</strong>';

    updateURL();
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    TWEEN.update();

    if (params.enable_stats) stats.begin();
    renderer.render(scene, camera);
    if (params.enable_stats) stats.end();
}

function app() {
    init();
    animate();
}

function updateAfterUIChange(update_camera) {
    document.getElementById('num_points_slider_label').innerHTML =
        'Smoothed points: <strong>' + parseInt(params.num_smooth_points);
    document.getElementById('line_thickness_slider_label').innerHTML =
        'Line thickness: <strong>' + parseFloat(params.line_thickness).toFixed(1);

    if (params.fit_to_screen) {
        fit_to_screen_slider.classList.remove('off');
        fit_to_screen_slider.classList.add('on');
        document.getElementById('fit_to_screen_slider_label').innerHTML = 'Fit camera <strong>ON</strong>';
    } else {
        fit_to_screen_slider.classList.remove('on');
        fit_to_screen_slider.classList.add('off');
        document.getElementById('fit_to_screen_slider_label').innerHTML = 'Fit camera <strong>OFF</strong>';
    }

    if (params.alt_palette) {
        alt_colors_slider.classList.remove('off');
        alt_colors_slider.classList.add('on');
        document.getElementById('alt_colors_slider_label').innerHTML = 'Colors <strong>Alternate</strong>';
    } else {
        alt_colors_slider.classList.remove('on');
        alt_colors_slider.classList.add('off');
        document.getElementById('alt_colors_slider_label').innerHTML = 'Colors <strong>Temperature</strong>';
    }

    if (params.auto_rotate) {
        auto_rotate_slider.classList.remove('off');
        auto_rotate_slider.classList.add('on');
        document.getElementById('auto_rotate_slider_label').innerHTML = 'Auto rotate <strong>ON</strong>';
    } else {
        auto_rotate_slider.classList.remove('on');
        auto_rotate_slider.classList.add('off');
        document.getElementById('auto_rotate_slider_label').innerHTML = 'Auto rotate <strong>OFF</strong>';
    }

    if (params.enable_legend) {
        enable_legend_slider.classList.remove('off');
        enable_legend_slider.classList.add('on');
        document.getElementById('enable_legend_slider_label').innerHTML = 'Enable legend <strong>ON</strong>';
    } else {
        enable_legend_slider.classList.remove('on');
        enable_legend_slider.classList.add('off');
        document.getElementById('enable_legend_slider_label').innerHTML = 'Enable legend <strong>OFF</strong>';
    }

    selectVisualization(params, update_camera);
}

function createSettingsUI() {
    noUiSlider
        .create(document.getElementById('num_points_slider'), {
            start: params.num_smooth_points,
            connect: [true, false],
            step: 5,
            range: {
                min: 12,
                max: 200
            }
        })
        .on('set', function(values, handle) {
            params.num_smooth_points = values[0];
            const update_camera = false;
            updateAfterUIChange(update_camera);
        });

    noUiSlider
        .create(document.getElementById('line_thickness_slider'), {
            start: params.line_thickness,
            connect: [true, false],
            step: 0.1,
            range: {
                min: 0.2,
                max: 6.0
            }
        })
        .on('set', function(values, handle) {
            params.line_thickness = values[0];
            const update_camera = false;
            updateAfterUIChange(update_camera);
        });

    noUiSlider
        .create(document.getElementById('fit_to_screen_slider'), {
            start: params.fit_to_screen ? 1.0 : 0.0,
            connect: [true, false],
            range: {
                min: [0, 1],
                max: 1
            }
        })
        .on('update', function(values, handle) {
            params.fit_to_screen = values[0] > 0 ? true : false;
            const update_camera = true;
            updateAfterUIChange(update_camera);
        });

    noUiSlider
        .create(document.getElementById('alt_colors_slider'), {
            start: params.alt_palette ? 1.0 : 0.0,
            connect: [true, false],
            range: {
                min: [0, 1],
                max: 1
            }
        })
        .on('set', function(values, handle) {
            params.alt_palette = values[0] > 0 ? true : false;
            const update_camera = false;
            updateAfterUIChange(update_camera);
        });

    noUiSlider
        .create(document.getElementById('auto_rotate_slider'), {
            start: params.alt_palette ? 1.0 : 0.0,
            connect: [true, false],
            range: {
                min: [0, 1],
                max: 1
            }
        })
        .on('set', function(values, handle) {
            params.auto_rotate = values[0] > 0 ? true : false;
            const update_camera = false;
            updateAfterUIChange(update_camera);
            controls.autoRotate = params.auto_rotate;
        });

    noUiSlider
        .create(document.getElementById('enable_legend_slider'), {
            start: params.enable_legend ? 1.0 : 0.0,
            connect: [true, false],
            range: {
                min: [0, 1],
                max: 1
            }
        })
        .on('set', function(values, handle) {
            params.enable_legend = values[0] > 0 ? true : false;
            const update_camera = false;
            document.getElementById('legend_year_slider').style.display = params.enable_legend ? 'block' : 'none';
            updateAfterUIChange(update_camera);
        });

    var elem = document.getElementById('legend_year_slider');
    noUiSlider.create(elem, {
        start: params.legend_slider_start,
        orientation: 'vertical',
        direction: 'rtl',
        padding: 4,
        step: 1,
        range: {
            min: firstYear - 4,
            max: lastYear + 4
        }
    });

    elem.noUiSlider.on('update', function(values, handle) {
        legendMesh.position.y = legendSliderValToPos(values[0]);
        params.legend_slider_start = values[0];
        updateTitle();
    });

    elem.noUiSlider.on('set', function(values, handle) {
        updateURL();
    });
}

function legendSliderValToPos(val) {
    var num_slices = processedData.length;
    if (num_slices == 1) {
        num_slices = processedData[0].points.length / params.num_smooth_points;
    }

    const slice_height = (params.desired_height / num_slices) * params.y_scale;
    return (val - firstYear) * slice_height - slice_height / 2;
}

function generateSmoothedData(num_data_per_division, num_points_per_division, closed) {
    processedData = [];

    var minimum_radius = 1.15;
    var min_magnitude = Infinity;
    var max_magnitude = -Infinity;

    var color_palette = [
        '#053061',
        '#2166ac',
        '#4393c3',
        '#92c5de',
        '#d1e5f0',
        '#f7f7f7',
        '#fddbc7',
        '#f4a582',
        '#d6604d',
        '#b2182b',
        '#67001f'
    ];
    var color_functor = chroma.scale(color_palette);

    for (var year = 0; year < climateData.length; year += num_data_per_division) {
        var raw_points = [];

        for (var month = 0; month < num_data_per_division; ++month) {
            var angle = ((month % 12) / 12) * Math.PI * 2.0;

            var point_radius = minimum_radius + climateData[year + month];

            var x = point_radius * Math.sin(angle);
            var y = 0;
            var z = point_radius * Math.cos(angle);

            raw_points.push(new THREE.Vector3(x, y, z));
        }

        var curve = new THREE.CatmullRomCurve3(raw_points, closed);

        var smoothed_points = curve.getPoints(num_points_per_division - 1);

        var magnitudes = [];
        var colors = [];
        var alt_colors = [];

        for (var i = 0; i < smoothed_points.length; ++i) {
            var magnitude = Math.sqrt(
                smoothed_points[i].x * smoothed_points[i].x + smoothed_points[i].z * smoothed_points[i].z
            );

            magnitudes.push(magnitude);

            if (magnitude < min_magnitude) min_magnitude = magnitude;
            if (magnitude > max_magnitude) max_magnitude = magnitude;
        }

        processedData.push({
            points: smoothed_points,
            magnitudes: magnitudes,
            colors: colors,
            alt_colors: alt_colors
        });
    }

    for (var data1 = 0; data1 < processedData.length; ++data1) {
        for (var data2 = 0; data2 < processedData[data1].points.length; ++data2) {
            var normalized_magnitude =
                (processedData[data1].magnitudes[data2] - min_magnitude) / (max_magnitude - min_magnitude);

            var color = new THREE.Color(0.0, 0.0, 0.0);
            color.set(color_functor(normalized_magnitude).hex());
            processedData[data1].colors.push(color);

            var hue = data1 / processedData.length;
            if (processedData.length == 1) {
                hue = data2 / processedData[data1].points.length;
            }
            var alt_color = new THREE.Color(0.0, 0.0, 0.0);
            alt_color.setHSL(hue, 1.0, normalized_magnitude);
            processedData[data1].alt_colors.push(alt_color);
        }
    }
}

function clearScene() {
    var for_removal = [];
    scene.traverse(function(child) {
        if (child instanceof THREE.Line2 || child instanceof THREE.Mesh) {
            for_removal.push(child);
        }
    });

    for (let c of for_removal) {
        scene.remove(c);
    }
}

function toggleUI() {
    var start_scale = 0.0;
    var end_scale = 0.0;

    if (uiClosed) {
        start_scale = 0.0;
        end_scale = 1.0;
        uiClosed = false;
    } else {
        start_scale = 1.0;
        end_scale = 0.0;
        uiClosed = true;
    }

    new TWEEN.Tween({
        scale: start_scale
    })
        .to(
            {
                scale: end_scale
            },
            500
        )
        .easing(TWEEN.Easing.Quartic.InOut)
        .onStart(function() {
            if (uiClosed) {
                document.getElementById('settings_button').src = 'img/settings_closed.png';
            } else {
                document.getElementById('settings_button').src = 'img/settings_open.png';
            }
        })
        .onUpdate(function() {
            uiOpenScale = this.scale;
            onWindowResize();
        })
        .start();
}

function fitCameraToScene(name) {
    var bbox = new THREE.Box3();

    var local_scale = new THREE.Vector3(1.0, 1.0, 1.0);

    scene.traverse(function(child) {
        if (child.name == name) {
            local_scale = child.scale;
            bbox.min.x = Math.min(bbox.min.x, child.geometry.boundingBox.min.x);
            bbox.min.y = Math.min(bbox.min.y, child.geometry.boundingBox.min.y);
            bbox.min.z = Math.min(bbox.min.z, child.geometry.boundingBox.min.z);
            bbox.max.x = Math.max(bbox.max.x, child.geometry.boundingBox.max.x);
            bbox.max.y = Math.max(bbox.max.y, child.geometry.boundingBox.max.y);
            bbox.max.z = Math.max(bbox.max.z, child.geometry.boundingBox.max.z);
        }
    });

    bbox.min.x *= local_scale.x;
    bbox.min.y *= local_scale.y;
    bbox.min.z *= local_scale.z;
    bbox.max.x *= local_scale.x;
    bbox.max.y *= local_scale.y;
    bbox.max.z *= local_scale.z;

    const center = new THREE.Sphere();
    center.center.x = (bbox.max.x - bbox.min.x) / 2;
    center.center.y = (bbox.max.y - bbox.min.y) / 2;
    center.center.z = (bbox.max.y - bbox.min.y) / 2;

    var bounding_sphere_radius = bbox.getBoundingSphere(center).radius;

    var dist = bounding_sphere_radius / Math.sin((camera.fov * (Math.PI / 180.0)) / 2);

    var fudge_factor = 1.1;
    dist *= fudge_factor;
    camera.position.set(-dist, 0, 0);
}

function updateTitle() {
    var title = params.viz_type;

    if (params.legend_slider_start >= firstYear && params.legend_slider_start <= lastYear) {
        title = title + ' (' + parseInt(params.legend_slider_start) + ')';
    }
    document.getElementById('title').innerHTML = title;
}

function selectVisualization(params, update_camera) {
    clearScene();

    if (params.viz_type == 'Rings') {
        document.getElementById('spiral_button').src = 'img/spiral.png';
        document.getElementById('blob_button').src = 'img/blob.png';
        document.getElementById('slices_button').src = 'img/slices.png';
        document.getElementById('rings_button').src = 'img/rings_selected.png';
        updateTitle();

        const num_divs = 12;
        const pts_per_div = params.num_smooth_points;
        const closed_loop = true;
        generateSmoothedData(num_divs, pts_per_div, closed_loop);

        createRings(params);

        line_thickness_slider.removeAttribute('disabled');
    } else if (params.viz_type == 'Spiral') {
        document.getElementById('rings_button').src = 'img/rings.png';
        document.getElementById('blob_button').src = 'img/blob.png';
        document.getElementById('slices_button').src = 'img/slices.png';
        document.getElementById('spiral_button').src = 'img/spiral_selected.png';
        updateTitle();

        const num_divs = climateData.length;
        const pts_per_div = (climateData.length / 12) * params.num_smooth_points;
        const closed_loop = false;
        generateSmoothedData(num_divs, pts_per_div, closed_loop);

        createSpiral(params);

        line_thickness_slider.removeAttribute('disabled');
    } else if (params.viz_type == 'Blob') {
        document.getElementById('rings_button').src = 'img/rings.png';
        document.getElementById('spiral_button').src = 'img/spiral.png';
        document.getElementById('slices_button').src = 'img/slices.png';
        document.getElementById('blob_button').src = 'img/blob_selected.png';
        updateTitle();

        const num_divs = 12;
        const pts_per_div = params.num_smooth_points;
        const closed_loop = true;
        generateSmoothedData(num_divs, pts_per_div, closed_loop);

        createBlob(params);

        line_thickness_slider.setAttribute('disabled', true);
    } else if (params.viz_type == 'Slices') {
        document.getElementById('rings_button').src = 'img/rings.png';
        document.getElementById('spiral_button').src = 'img/spiral.png';
        document.getElementById('blob_button').src = 'img/blob.png';
        document.getElementById('slices_button').src = 'img/slices_selected.png';
        updateTitle();

        const num_divs = 12;
        const pts_per_div = params.num_smooth_points;
        const closed_loop = true;
        generateSmoothedData(num_divs, pts_per_div, closed_loop);

        createSlices(params);

        line_thickness_slider.setAttribute('disabled', true);
    }

    if (params.enable_legend) {
        var map = new THREE.TextureLoader().load('img/legend.jpg');
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        var legend_material = new THREE.MeshPhongMaterial({
            map: map,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });

        const legend_radius = 20.0;
        const legend_segments = 128;
        var legend_geometry = new THREE.CircleBufferGeometry(legend_radius, legend_segments);
        legend_geometry.rotateX(-Math.PI / 2.0);
        legend_geometry.rotateY(-Math.PI);
        legend_geometry.translate(0, -params.desired_height / 2.0, 0.0);

        legendMesh = new THREE.Mesh(legend_geometry, legend_material);
        legendMesh.name = 'legend';
        legendMesh.scale.set(params.xz_scale, 1.0, params.xz_scale);
        legendMesh.position.y = legendSliderValToPos(params.legend_slider_start);

        scene.add(legendMesh);
    }

    if (params.fit_to_screen && update_camera) {
        fitCameraToScene(params.viz_type);
    }

    updateURL();
}

function createRings(params) {
    for (var i = 0; i < processedData.length; ++i) {
        var smoothed_points = processedData[i].points;
        var smoothed_colors = processedData[i].colors;
        var smoothed_alt_colors = processedData[i].alt_colors;

        var positions = [];
        var colors = [];

        for (var j = 0; j < smoothed_points.length; ++j) {
            var index = parseInt((j / smoothed_points.length) * smoothed_points.length);

            var point = smoothed_points[index];

            var x = point.x;
            var y = -params.desired_height / 2 + (i / processedData.length) * params.desired_height;
            var z = point.z;
            positions.push(x, y, z);

            if (params.alt_palette) {
                colors.push(smoothed_alt_colors[index].r, smoothed_alt_colors[index].g, smoothed_alt_colors[index].b);
            } else {
                colors.push(smoothed_colors[index].r, smoothed_colors[index].g, smoothed_colors[index].b);
            }
        }

        var geometry = new THREE.LineGeometry();
        geometry.setPositions(positions);
        geometry.setColors(colors);

        var mat_line = new THREE.LineMaterial({
            color: 0xffffff,
            linewidth: params.line_thickness / params.line_thickness_scale,
            vertexColors: THREE.VertexColors,
            dashed: false
        });
        var line = new THREE.Line2(geometry, mat_line);
        line.computeLineDistances();
        line.scale.set(params.xz_scale * params.xz_base_scale, params.y_scale, params.xz_scale * params.xz_base_scale);
        line.name = 'Rings';

        scene.add(line);
    }
}

function createSpiral(params) {
    var smoothed_points = processedData[0].points;
    var smoothed_colors = processedData[0].colors;
    var smoothed_alt_colors = processedData[0].alt_colors;

    var positions = [];
    var colors = [];

    for (var j = 0; j < smoothed_points.length; ++j) {
        var point = smoothed_points[j];

        var x = point.x;
        var y = -params.desired_height / 2 + (j / smoothed_points.length) * params.desired_height;
        var z = point.z;
        positions.push(x, y, z);

        if (params.alt_palette) {
            colors.push(smoothed_alt_colors[j].r, smoothed_alt_colors[j].g, smoothed_alt_colors[j].b);
        } else {
            colors.push(smoothed_colors[j].r, smoothed_colors[j].g, smoothed_colors[j].b);
        }
    }

    var geometry = new THREE.LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    var mat_line = new THREE.LineMaterial({
        color: 0xffffff,
        linewidth: params.line_thickness / params.line_thickness_scale,
        vertexColors: THREE.VertexColors,
        dashed: false
    });
    var line = new THREE.Line2(geometry, mat_line);
    line.computeLineDistances();
    line.scale.set(params.xz_scale * params.xz_base_scale, params.y_scale, params.xz_scale * params.xz_base_scale);
    line.name = 'Spiral';

    scene.add(line);
}

function createBlob(params) {
    var num_radial_segs = processedData[0].points.length;
    var num_height_segs = processedData.length;

    var initial_radius = 4.0;
    var open_ended = true;
    var geometry = new THREE.CylinderBufferGeometry(
        initial_radius,
        initial_radius,
        params.desired_height,
        num_radial_segs,
        num_height_segs,
        open_ended
    );

    var num_verts = 3 * (num_radial_segs + 1) * (num_height_segs + 1);
    var colors = new Uint8Array(num_verts);

    for (var y = 0; y < num_height_segs + 1; ++y) {
        var index = (processedData.length - y) % num_height_segs;
        for (var x = 0; x < (num_radial_segs + 1) * 3; x += 3) {
            var colx = parseInt((x / ((num_radial_segs + 1) * 3)) * processedData[0].points.length);
            var coly = parseInt(((num_height_segs - y) / (num_height_segs + 1)) * processedData.length);

            if (params.alt_palette) {
                colors[y * (num_radial_segs + 1) * 3 + x + 0] = processedData[coly].alt_colors[colx].r * 0xff;
                colors[y * (num_radial_segs + 1) * 3 + x + 1] = processedData[coly].alt_colors[colx].g * 0xff;
                colors[y * (num_radial_segs + 1) * 3 + x + 2] = processedData[coly].alt_colors[colx].b * 0xff;
            } else {
                colors[y * (num_radial_segs + 1) * 3 + x + 0] = processedData[coly].colors[colx].r * 0xff;
                colors[y * (num_radial_segs + 1) * 3 + x + 1] = processedData[coly].colors[colx].g * 0xff;
                colors[y * (num_radial_segs + 1) * 3 + x + 2] = processedData[coly].colors[colx].b * 0xff;
            }
        }
    }
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));

    var vec = new THREE.Vector3();

    for (var s = 0; s < num_height_segs + 1; ++s) {
        var index = (num_height_segs + 1 - s) % processedData.length;

        for (var i = 0; i < num_radial_segs + 1; ++i) {
            var position_index = s * (num_radial_segs + 1) + i;

            vec.fromBufferAttribute(geometry.attributes.position, position_index);

            geometry.attributes.position.setXYZ(
                position_index,
                processedData[index].points[i % num_radial_segs].x,
                vec.y,
                processedData[index].points[i % num_radial_segs].z
            );
        }
    }
    geometry.computeBoundingBox();

    var blob_material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        metalness: 0.2,
        roughness: 0.5
    });

    var blob_mesh = new THREE.Mesh(geometry, blob_material);

    blob_mesh.scale.set(params.xz_scale * params.xz_base_scale, params.y_scale, params.xz_scale * params.xz_base_scale);
    blob_mesh.name = 'Blob';
    scene.add(blob_mesh);
}

function createSlices(params) {
    const slice_height = params.desired_height / processedData.length;

    var geoms_to_merge = [];

    for (var slice_num = 0; slice_num < processedData.length; ++slice_num) {
        var pts = [];
        for (var p = 0; p < processedData[slice_num].points.length; ++p) {
            pts.push(new THREE.Vector2(processedData[slice_num].points[p].x, processedData[slice_num].points[p].z));
        }

        var shape = new THREE.Shape(pts);

        var extrudeSettings = {
            depth: slice_height,
            bevelEnabled: false
        };
        var geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
        geometry.computeBoundingBox();

        const positions = geometry.attributes.position;
        const colors = [];

        for (var i = 0; i < positions.count; ++i) {
            var col_array = (col_array = processedData[slice_num].colors);
            if (params.alt_palette) {
                col_array = processedData[slice_num].alt_colors;
            }
            var col_index = parseInt((i / positions.count) * col_array.length);
            colors.push(col_array[col_index].r, col_array[col_index].g, col_array[col_index].b);
        }
        geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.rotateX(Math.PI / 2.0);
        geometry.translate(0.0, -(params.desired_height / 2) + slice_num * slice_height, 0.0);
        geoms_to_merge.push(geometry);
    }

    var merged_geom = THREE.BufferGeometryUtils.mergeBufferGeometries(geoms_to_merge);
    merged_geom.computeBoundingBox();
    var slice_mesh = new THREE.Mesh(
        merged_geom,
        new THREE.MeshPhongMaterial({
            flatShading: false,
            vertexColors: THREE.VertexColors,
            side: THREE.DoubleSide
        })
    );
    slice_mesh.scale.set(
        params.xz_scale * params.xz_base_scale,
        params.y_scale,
        params.xz_scale * params.xz_base_scale
    );
    slice_mesh.name = 'Slices';
    scene.add(slice_mesh);
}

function showHelp(visible) {
    document.getElementById('help_box_bkg').onmouseup = function() {
        showHelp(false);
        return true;
    };

    if (visible) {
        document.getElementById('help_box_bkg').className = 'show';
        document.getElementById('help_box').className = 'show';
        document.getElementById('help_box_bkg').style.pointerEvents = 'all';
        document.getElementById('help_box').style.pointerEvents = 'all';
        document.getElementById('viz_selector').style.pointerEvents = 'none';
        document.getElementById('settings_div').style.pointerEvents = 'none';
        params.open_help = true;
    } else {
        document.getElementById('help_box_bkg').className = 'hide';
        document.getElementById('help_box').className = 'hide';
        document.getElementById('help_box_bkg').style.pointerEvents = 'none';
        document.getElementById('help_box').style.pointerEvents = 'none';
        document.getElementById('viz_selector').style.pointerEvents = 'all';
        document.getElementById('settings_div').style.pointerEvents = 'all';
        params.open_help = false;
    }

    updateURL();
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null) {
        return '';
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}

function buildURL() {
    var url = 'index.html?params';

    for (var property in params) {
        if (params.hasOwnProperty(property)) {
            url += '&' + property + '=' + params[property];
        }
    }

    return url;
}

function updateURL() {
    window.history.pushState({}, '', buildURL());
}

function shareURL() {
    window.open(buildURL());
}
