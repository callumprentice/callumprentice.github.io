/*
 * Buffer Geometry Selective Draw example
 * @author Callum Prentice - http://callum.com/
 * @license: MIT / http://opensource.org/licenses/MIT
 */

var camera, scene, renderer, controls, stats;
var geometry;

function app() {

    init();
    animate();
}

function init() {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10);
    camera.position.z = 2.5;

    scene.add(new THREE.AmbientLight(0x777777));

    window.addEventListener('resize', on_window_resize, false);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.4;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.1;
    controls.minDistance = 0.9;
    controls.maxDistance = 3.0;

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild(stats.domElement);

    scene.add(new THREE.Mesh( new THREE.SphereGeometry( 0.6, 32, 32 ), new THREE.MeshNormalMaterial()))

    add_lines(0.5, 0.75);
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

function add_lines(inner_radius, outer_radius) {

    var num_lat = 100;
    var num_lng = 200;

    geometry = new THREE.BufferGeometry();
    var line_positions = new Float32Array(num_lat * num_lng * 3 * 2);
    var line_colors = new Float32Array(num_lat * num_lng * 3 * 2);
    var visible = new Float32Array(num_lat * num_lng * 2);

    for (var i = 0; i < num_lat; ++i) {

        for (var j = 0; j < num_lng; ++j) {

            var lat = i / num_lat * Math.PI;
            var lng = j / num_lng * 2 * Math.PI;

            var index = i * num_lng + j;

            line_positions[index * 6 + 0] = inner_radius * Math.sin(lat) * Math.cos(lng);
            line_positions[index * 6 + 1] = inner_radius * Math.cos(lat);
            line_positions[index * 6 + 2] = inner_radius * Math.sin(lat) * Math.sin(lng);
            line_positions[index * 6 + 3] = outer_radius * Math.sin(lat) * Math.cos(lng);
            line_positions[index * 6 + 4] = outer_radius * Math.cos(lat);
            line_positions[index * 6 + 5] = outer_radius * Math.sin(lat) * Math.sin(lng);

            var color = new THREE.Color(0xffffff);

            color.setHSL(lat / Math.PI, 0.5, 0.2);
            line_colors[index * 6 + 0] = color.r;
            line_colors[index * 6 + 1] = color.g;
            line_colors[index * 6 + 2] = color.b;

            color.setHSL(lat / Math.PI, 1.0, 0.7);
            line_colors[index * 6 + 3] = color.r;
            line_colors[index * 6 + 4] = color.g;
            line_colors[index * 6 + 5] = color.b;

            visible[index * 2 + 0] = 1.0;
            visible[index * 2 + 1] = 1.0;
        }
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(line_positions, 3));
    geometry.addAttribute('vertColor', new THREE.BufferAttribute(line_colors, 3));
    geometry.addAttribute('visible', new THREE.BufferAttribute(visible, 1));

    geometry.computeBoundingSphere();

    var shader_material = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent
    });

    scene.add(new THREE.LineSegments(geometry, shader_material));
}

function hide_lines() {
    for (var i = 0; i < geometry.attributes.visible.array.length; i += 2) {

        if (Math.random() > 0.5) {
            geometry.attributes.visible.array[i + 0] = 0;
            geometry.attributes.visible.array[i + 1] = 0;
        }
    }

    geometry.attributes.visible.needsUpdate = true;
}

function show_all_lines() {
    for (var i = 0; i < geometry.attributes.visible.array.length; i += 2) {
            geometry.attributes.visible.array[i + 0] = 1;
            geometry.attributes.visible.array[i + 1] = 1;
    }
    geometry.attributes.visible.needsUpdate = true;
}
