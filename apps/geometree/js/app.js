/*
 * Christmas Experiment Submission 2015-12
 * @author Callum Prentice / http://callum.com/
 * SnowStorm based on code by Sole
   (http://soledadpenades.com/articles/three-js-tutorials/rendering-snow-with-shaders/11/)
 */
var camera, scene, renderer;
var branches = [];
var clock = new THREE.Clock();
var sceneRoot = 0;
var branchesGeometry = 0
var baubelGeometry = 0;
var needlesGeometry = 0;
var starGeometry = 0;
var groundGeometry = 0;
var titleGeometry = 0;
var snowStormGeometry = 0;
var targetX = 0;
var targetY = 0;
var mouseX = 0;
var mouseY = 0;

var parameters = {
    tree_height: 20.0,
    num_branch_levels: 12,
    num_branches_per_level: 9,
    needle_hue: 0.55,
    needles_per_branch: 4000,
}

function app() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    init();

    animate();
}

function init() {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000033, 1.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 0.1, 150.0);
    camera.position.y = parameters.tree_height / 2.0 - 2.0;
    camera.position.z = 40;
    camera.lookAt(new THREE.Vector3(0.0, parameters.tree_height / 2.5, 0.0));

    var listener = new THREE.AudioListener();
    camera.add(listener);

    scene.add(new THREE.AmbientLight(0x999999));

    var light1 = new THREE.DirectionalLight(0x999999, 3.1);
    light1.position.set(10, 10, 10);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0x999999, 1.5);
    light2.position.set(0, -10, 0);
    scene.add(light2);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    var backing_music = new THREE.Audio(listener);
    backing_music.load('sound/chant.mp3');
    backing_music.setRefDistance(20);
    backing_music.autoplay = true;
    scene.add(backing_music);

    createScene();
}

function createScene() {

    if (sceneRoot) {
        branchesGeometry.material.dispose();
        branchesGeometry.geometry.dispose();
        baubelGeometry.material.dispose();
        baubelGeometry.geometry.dispose();
        needlesGeometry.material.dispose();
        needlesGeometry.geometry.dispose();
        starGeometry.material.dispose();
        starGeometry.geometry.dispose();

        scene.remove(sceneRoot);
    }

    buildBranches();

    sceneRoot = new THREE.Object3D();

    branchesGeometry = addBranches();
    sceneRoot.add(branchesGeometry);

    baubelGeometry = addBaubels();
    sceneRoot.add(baubelGeometry);

    needlesGeometry = addNeedles();
    sceneRoot.add(needlesGeometry);

    starGeometry = addStar();
    sceneRoot.add(starGeometry);

    if (groundGeometry === 0) groundGeometry = addGround();
    sceneRoot.add(groundGeometry);

    if (titleGeometry === 0) titleGeometry = addTitle();
    sceneRoot.add(titleGeometry);

    if (snowStormGeometry === 0) snowStormGeometry = addSnowstorm();
    sceneRoot.add(snowStormGeometry);

    scene.add(sceneRoot);

    var tween = new TWEEN.Tween({
            scale: 0
        })
        .to({
            scale: 1.0
        }, 1000)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onUpdate(function () {
            branchesGeometry.scale.x = this.scale;
            branchesGeometry.scale.y = this.scale;
            branchesGeometry.scale.z = this.scale;

            baubelGeometry.scale.x = this.scale;
            baubelGeometry.scale.y = this.scale;
            baubelGeometry.scale.z = this.scale;

            needlesGeometry.scale.x = this.scale;
            needlesGeometry.scale.y = this.scale;
            needlesGeometry.scale.z = this.scale;

            starGeometry.scale.x = this.scale * 0.06;
            starGeometry.scale.y = this.scale * 0.06;
            starGeometry.scale.z = this.scale * 0.06;

        })
        .start();

    parameters.tree_height = 20.0;
    parameters.num_branch_levels = parseInt(Math.random() * 15 + 4);
    parameters.num_branches_per_level = parseInt(Math.random() * 12 + 4);
    parameters.needle_hue = Math.random();
    parameters.needles_per_branch = parseInt(Math.random() * 3500 + 500);
}

function buildBranches() {

    branches = [];

    var trunk_thickness = 0.2;
    var branch_thickness = 0.1;
    var branch_top_offset = 1.4;
    var branch_bottom_offset = 1.5;

    var branch_radius_top = 1.0;
    var branch_radius_bottom = 10.0;

    branches.push({
        radius: trunk_thickness,
        start: new THREE.Vector3(0.0, 0.0, 0.0),
        end: new THREE.Vector3(0.0, parameters.tree_height, 0.0),
        color: new THREE.Color(0x6b4a2b)
    })

    for (var i = 0; i < parameters.num_branch_levels; ++i) {

        var branch_height = Math.random() + branch_bottom_offset + i * (parameters.tree_height - branch_bottom_offset - branch_top_offset) / parameters.num_branch_levels

        for (var j = 0; j < parameters.num_branches_per_level; ++j) {

            var branch_radius = branch_radius_bottom - i * ((branch_radius_bottom - branch_radius_top) / parameters.num_branch_levels)

            var branch_start_x = 0;
            var branch_start_y = branch_height;
            var branch_start_z = 0;

            var branch_end_x = Math.cos((Math.PI * 2 / parameters.num_branches_per_level) * j + (Math.random() * Math.PI / 6.0) - Math.PI / 3.0) * branch_radius;
            var branch_end_y = branch_height * 1.1 + Math.random() * 1.0;
            var branch_end_z = Math.sin((Math.PI * 2 / parameters.num_branches_per_level) * j + (Math.random() * Math.PI / 6.0) - Math.PI / 3.0) * branch_radius;

            branches.push({
                radius: branch_thickness,
                start: new THREE.Vector3(branch_start_x, branch_start_y, branch_start_z),
                end: new THREE.Vector3(branch_end_x, branch_end_y, branch_end_z),
                color: new THREE.Color(0x6b4a2b)
            })
        }
    }
}

function addBranches() {

    var radius_segments = 32;
    var height_segments = 1;
    var open_ended = false;

    var positions = 0;
    var normals = 0;
    var colors = 0;
    var buffer_geometry = new THREE.BufferGeometry();

    for (b = 0; b < branches.length; ++b) {

        var length = branches[b].end.clone()
            .sub(branches[b].start)
            .length();
        var branch_geometry = new THREE.CylinderGeometry(branches[b].radius,
            branches[b].radius,
            length,
            radius_segments,
            height_segments,
            open_ended);

        branch_geometry.applyMatrix(new THREE.Matrix4()
            .makeTranslation(0, length / 2, 0));
        branch_geometry.applyMatrix(new THREE.Matrix4()
            .makeRotationX(-THREE.Math.degToRad(90)));
        branch_geometry.applyMatrix(new THREE.Matrix4()
            .lookAt(new THREE.Vector3(0, 0, 0), branches[b].end.clone()
                .sub(branches[b].start), new THREE.Vector3(0, 1, 0)));
        branch_geometry.applyMatrix(new THREE.Matrix4()
            .makeTranslation(branches[b].start.x, branches[b].start.y, branches[b].start.z));

        if (positions === 0) {
            positions = new Float32Array(branches.length * branch_geometry.faces.length * 3 * 3);
            normals = new Float32Array(branches.length * branch_geometry.faces.length * 3 * 3);
            colors = new Float32Array(branches.length * branch_geometry.faces.length * 3 * 3);
        }

        branch_geometry.faces.forEach(function (face, index) {

            var cur_element = (b * branch_geometry.faces.length + index);

            positions[cur_element * 9 + 0] = branch_geometry.vertices[face.a].x;
            positions[cur_element * 9 + 1] = branch_geometry.vertices[face.a].y;
            positions[cur_element * 9 + 2] = branch_geometry.vertices[face.a].z;
            positions[cur_element * 9 + 3] = branch_geometry.vertices[face.b].x;
            positions[cur_element * 9 + 4] = branch_geometry.vertices[face.b].y;
            positions[cur_element * 9 + 5] = branch_geometry.vertices[face.b].z;
            positions[cur_element * 9 + 6] = branch_geometry.vertices[face.c].x;
            positions[cur_element * 9 + 7] = branch_geometry.vertices[face.c].y;
            positions[cur_element * 9 + 8] = branch_geometry.vertices[face.c].z;

            normals[cur_element * 9 + 0] = face.normal.x;
            normals[cur_element * 9 + 1] = face.normal.y;
            normals[cur_element * 9 + 2] = face.normal.z;
            normals[cur_element * 9 + 3] = face.normal.x;
            normals[cur_element * 9 + 4] = face.normal.y;
            normals[cur_element * 9 + 5] = face.normal.z;
            normals[cur_element * 9 + 6] = face.normal.x;
            normals[cur_element * 9 + 7] = face.normal.y;
            normals[cur_element * 9 + 8] = face.normal.z;

            colors[cur_element * 9 + 0] = branches[b].color.r;
            colors[cur_element * 9 + 1] = branches[b].color.g;
            colors[cur_element * 9 + 2] = branches[b].color.b;
            colors[cur_element * 9 + 3] = branches[b].color.r;
            colors[cur_element * 9 + 4] = branches[b].color.g;
            colors[cur_element * 9 + 5] = branches[b].color.b;
            colors[cur_element * 9 + 6] = branches[b].color.r;
            colors[cur_element * 9 + 7] = branches[b].color.g;
            colors[cur_element * 9 + 8] = branches[b].color.b;
        });
    }

    buffer_geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer_geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    buffer_geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    buffer_geometry.computeBoundingSphere();

    var buffer_material = new THREE.MeshPhongMaterial({
        specular: 0x333333,
        shininess: 50,
        vertexColors: THREE.VertexColors,
        shading: THREE.SmoothShading
    });

    return new THREE.Mesh(buffer_geometry, buffer_material);
}

function addBaubels() {

    var positions = 0;
    var normals = 0;
    var colors = 0;
    var baubel_radius = 0.25;
    var baubel_segments = 16;
    var buffer_geometry = new THREE.BufferGeometry();

    for (b = 1; b < branches.length; ++b) {

        var baubel_geometry = new THREE.SphereGeometry(baubel_radius, baubel_segments, baubel_segments);

        baubel_geometry.applyMatrix(new THREE.Matrix4()
            .makeTranslation(branches[b].end.x, branches[b].end.y, branches[b].end.z));

        var baubel_color = new THREE.Color(0xffffff);
        baubel_color.setHSL(Math.random(), 0.5, 0.5);

        if (positions === 0) {
            positions = new Float32Array(branches.length * baubel_geometry.faces.length * 3 * 3);
            normals = new Float32Array(branches.length * baubel_geometry.faces.length * 3 * 3);
            colors = new Float32Array(branches.length * baubel_geometry.faces.length * 3 * 3);
        }

        baubel_geometry.faces.forEach(function (face, index) {
            var cur_element = (b * baubel_geometry.faces.length + index);

            positions[cur_element * 9 + 0] = baubel_geometry.vertices[face.a].x;
            positions[cur_element * 9 + 1] = baubel_geometry.vertices[face.a].y;
            positions[cur_element * 9 + 2] = baubel_geometry.vertices[face.a].z;
            positions[cur_element * 9 + 3] = baubel_geometry.vertices[face.b].x;
            positions[cur_element * 9 + 4] = baubel_geometry.vertices[face.b].y;
            positions[cur_element * 9 + 5] = baubel_geometry.vertices[face.b].z;
            positions[cur_element * 9 + 6] = baubel_geometry.vertices[face.c].x;
            positions[cur_element * 9 + 7] = baubel_geometry.vertices[face.c].y;
            positions[cur_element * 9 + 8] = baubel_geometry.vertices[face.c].z;

            normals[cur_element * 9 + 0] = face.normal.x;
            normals[cur_element * 9 + 1] = face.normal.y;
            normals[cur_element * 9 + 2] = face.normal.z;
            normals[cur_element * 9 + 3] = face.normal.x;
            normals[cur_element * 9 + 4] = face.normal.y;
            normals[cur_element * 9 + 5] = face.normal.z;
            normals[cur_element * 9 + 6] = face.normal.x;
            normals[cur_element * 9 + 7] = face.normal.y;
            normals[cur_element * 9 + 8] = face.normal.z;

            colors[cur_element * 9 + 0] = baubel_color.r;
            colors[cur_element * 9 + 1] = baubel_color.g;
            colors[cur_element * 9 + 2] = baubel_color.b;
            colors[cur_element * 9 + 3] = baubel_color.r;
            colors[cur_element * 9 + 4] = baubel_color.g;
            colors[cur_element * 9 + 5] = baubel_color.b;
            colors[cur_element * 9 + 6] = baubel_color.r;
            colors[cur_element * 9 + 7] = baubel_color.g;
            colors[cur_element * 9 + 8] = baubel_color.b;
        });
    }

    buffer_geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer_geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    buffer_geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    buffer_geometry.computeBoundingSphere();
    buffer_geometry.computeVertexNormals();

    var buffer_material = new THREE.MeshPhongMaterial({
        specular: 0x333333,
        shininess: 50,
        vertexColors: THREE.VertexColors,
        shading: THREE.SmoothShading
    });

    return new THREE.Mesh(buffer_geometry, buffer_material);
}

function addNeedles() {

    var needle_geometry = new THREE.BufferGeometry();
    var needle_positions = new Float32Array((branches.length - 1) * parameters.needles_per_branch * 3 * 2);
    var needle_colors = new Float32Array((branches.length - 1) * parameters.needles_per_branch * 3 * 2);
    var index = 0;
    var needle_color = new THREE.Color("hsl(" + parameters.needle_hue * 255 + ", 100%, 50%)");

    for (b = 0; b < branches.length; ++b) {

        var axis = branches[b].end.clone()
            .sub(branches[b].start)
            .normalize();

        for (var k = 0; k < parameters.needles_per_branch; ++k) {

            var branch_offset = Math.random();
            var needle_start = new THREE.Vector3();
            needle_start.lerpVectors(branches[b].start, branches[b].end, branch_offset);

            var radius = (1 - branch_offset) * 1.0 + 0.2 + Math.random() / 10 - 0.05;

            var needle_end = new THREE.Vector3(0.0, 1.0, 0.0);
            needle_end.cross(axis);

            var angle = Math.PI * 2 * Math.random();

            needle_end.applyAxisAngle(axis, angle);
            needle_end.multiplyScalar(radius);
            needle_end.add(needle_start);

            needle_positions[index * 3 * 2 + 0] = needle_start.x;
            needle_positions[index * 3 * 2 + 1] = needle_start.y;
            needle_positions[index * 3 * 2 + 2] = needle_start.z;
            needle_positions[index * 3 * 2 + 3] = needle_end.x;
            needle_positions[index * 3 * 2 + 4] = needle_end.y;
            needle_positions[index * 3 * 2 + 5] = needle_end.z;

            needle_color.setHSL(parameters.needle_hue, 0.8, 0.0);
            needle_colors[index * 3 * 2 + 0] = needle_color.r;
            needle_colors[index * 3 * 2 + 1] = needle_color.g;
            needle_colors[index * 3 * 2 + 2] = needle_color.b;
            needle_color.setHSL(parameters.needle_hue, 0.3, Math.random() / 2 + 0.5);
            needle_colors[index * 3 * 2 + 3] = needle_color.r;
            needle_colors[index * 3 * 2 + 4] = needle_color.g;
            needle_colors[index * 3 * 2 + 5] = needle_color.b;

            ++index;
        }
    }

    needle_geometry.addAttribute('position', new THREE.BufferAttribute(needle_positions, 3));
    needle_geometry.addAttribute('color', new THREE.BufferAttribute(needle_colors, 3));
    needle_geometry.computeBoundingSphere();

    var needle_material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 1
    });

    return needle_mesh = new THREE.LineSegments(needle_geometry, needle_material);
}

function addStar() {

    var star_shape = new THREE.Shape();

    star_shape.moveTo(0, 18);
    star_shape.lineTo(5, 5);
    star_shape.lineTo(18, 5);
    star_shape.lineTo(7, -3);
    star_shape.lineTo(11, -16);
    star_shape.lineTo(0, -8);
    star_shape.lineTo(-(11), -(16));
    star_shape.lineTo(-(7), -3);
    star_shape.lineTo(-18, 5);
    star_shape.lineTo(-5, 5);
    star_shape.lineTo(0, 18);

    var extrudeSettings = {
        amount: 0.7,
        bevelEnabled: false
    };

    var star_geom = new THREE.ExtrudeGeometry(star_shape, extrudeSettings);

    var star_material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0x333333,
        shininess: 20,
        side: THREE.DoubleSide,
        vertexColors: THREE.VertexColors,
        shading: THREE.SmoothShading
    });

    var star_mesh = new THREE.Mesh(star_geom, star_material);
    star_mesh.scale.set(0.09, 0.09, 0.09);
    star_mesh.position.y = parameters.tree_height + 0.55;
    return star_mesh;
}

function addSnowstorm() {

    var texture = THREE.ImageUtils.loadTexture('img/snowflake.png');
    var num_snowflakes = 10000;
    var snowstorm_width = 100;
    var snowstorm_height = 100;
    var snowstorm_depth = 100;

    var snowstorm_geometry = new THREE.Geometry();

    var snowstorm_material = new THREE.ShaderMaterial({
        uniforms: {
            color: {
                type: 'c',
                value: new THREE.Color(0xffffff)
            },
            height: {
                type: 'f',
                value: snowstorm_height
            },
            elapsedTime: {
                type: 'f',
                value: 0
            },
            radiusX: {
                type: 'f',
                value: 2.5
            },
            radiusZ: {
                type: 'f',
                value: 2.5
            },
            size: {
                type: 'f',
                value: 100.0
            },
            scale: {
                type: 'f',
                value: 4.0
            },
            opacity: {
                type: 'f',
                value: 0.4
            },
            texture: {
                type: 't',
                value: texture
            },
            speedH: {
                type: 'f',
                value: 0.07
            },
            speedV: {
                type: 'f',
                value: 0.07
            }
        },
        vertexShader: document.getElementById('snowstorm_vs')
            .textContent,
        fragmentShader: document.getElementById('snowstorm_fs')
            .textContent,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false
    });

    for (var i = 0; i < num_snowflakes; i++) {

        var vertex = new THREE.Vector3(
            snowstorm_width * (Math.random() - 0.5),
            snowstorm_height * (Math.random() - 0.5),
            snowstorm_depth * (Math.random() - 0.5)
        );

        snowstorm_geometry.vertices.push(vertex);
    }

    return new THREE.Points(snowstorm_geometry, snowstorm_material);
}

function addGround() {

    var positions = 0;
    var normals = 0;
    var colors = 0;
    var ground_segments = 32;
    var buffer_geometry = new THREE.BufferGeometry();
    var ground_shapes = [{
        x: 0.0,
        y: -100.0,
        z: 0.0,
        radius: 100.0
    }, {
        x: -20.0,
        y: -102.0,
        z: 0.0,
        radius: 100.0
    }, {
        x: 20.0,
        y: -102.0,
        z: 0.0,
        radius: 100.0
    }];

    for (b = 0; b < ground_shapes.length; ++b) {

        var ground_geometry = new THREE.SphereGeometry(ground_shapes[b].radius, ground_segments, ground_segments);

        ground_geometry.applyMatrix(new THREE.Matrix4()
            .makeTranslation(ground_shapes[b].x, ground_shapes[b].y, ground_shapes[b].z));

        var ground_color = new THREE.Color(0x999999);

        if (positions === 0) {
            positions = new Float32Array(branches.length * ground_geometry.faces.length * 3 * 3);
            normals = new Float32Array(branches.length * ground_geometry.faces.length * 3 * 3);
            colors = new Float32Array(branches.length * ground_geometry.faces.length * 3 * 3);
        }

        ground_geometry.faces.forEach(function (face, index) {
            var cur_element = (b * ground_geometry.faces.length + index);

            positions[cur_element * 9 + 0] = ground_geometry.vertices[face.a].x;
            positions[cur_element * 9 + 1] = ground_geometry.vertices[face.a].y;
            positions[cur_element * 9 + 2] = ground_geometry.vertices[face.a].z;
            positions[cur_element * 9 + 3] = ground_geometry.vertices[face.b].x;
            positions[cur_element * 9 + 4] = ground_geometry.vertices[face.b].y;
            positions[cur_element * 9 + 5] = ground_geometry.vertices[face.b].z;
            positions[cur_element * 9 + 6] = ground_geometry.vertices[face.c].x;
            positions[cur_element * 9 + 7] = ground_geometry.vertices[face.c].y;
            positions[cur_element * 9 + 8] = ground_geometry.vertices[face.c].z;

            normals[cur_element * 9 + 0] = face.normal.x;
            normals[cur_element * 9 + 1] = face.normal.y;
            normals[cur_element * 9 + 2] = face.normal.z;
            normals[cur_element * 9 + 3] = face.normal.x;
            normals[cur_element * 9 + 4] = face.normal.y;
            normals[cur_element * 9 + 5] = face.normal.z;
            normals[cur_element * 9 + 6] = face.normal.x;
            normals[cur_element * 9 + 7] = face.normal.y;
            normals[cur_element * 9 + 8] = face.normal.z;

            colors[cur_element * 9 + 0] = ground_color.r;
            colors[cur_element * 9 + 1] = ground_color.g;
            colors[cur_element * 9 + 2] = ground_color.b;
            colors[cur_element * 9 + 3] = ground_color.r;
            colors[cur_element * 9 + 4] = ground_color.g;
            colors[cur_element * 9 + 5] = ground_color.b;
            colors[cur_element * 9 + 6] = ground_color.r;
            colors[cur_element * 9 + 7] = ground_color.g;
            colors[cur_element * 9 + 8] = ground_color.b;
        });
    }

    buffer_geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer_geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    buffer_geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    buffer_geometry.computeBoundingSphere();
    buffer_geometry.computeVertexNormals();

    var buffer_material = new THREE.MeshPhongMaterial({
        specular: 0x333333,
        shininess: 50,
        vertexColors: THREE.VertexColors,
        shading: THREE.SmoothShading
    });

    return new THREE.Mesh(buffer_geometry, buffer_material);
}

function addTitle() {

    var geometry = new THREE.CylinderGeometry(12, 12, 2, 50, 50, true, -Math.PI / 4, Math.PI / 2.0);
    var material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        map: THREE.ImageUtils.loadTexture('img/title.png'),
        overdraw: false
    })

    geometry.applyMatrix(new THREE.Matrix4()
        .makeTranslation(0, 1.0, 0));

    return new THREE.Mesh(geometry, material);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2.0);
    mouseY = (event.clientY - window.innerHeight / 2.0) * 0.4;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {

    requestAnimationFrame(animate);

    TWEEN.update();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    if (sceneRoot) {
        sceneRoot.rotation.y += 0.02 * (targetX - sceneRoot.rotation.y);
        sceneRoot.rotation.x += 0.01 * (targetY - sceneRoot.rotation.x);
    }

    if (snowStormGeometry) {
        snowStormGeometry.material.uniforms.elapsedTime.value = clock.getElapsedTime() * 10;
    }

    renderer.render(scene, camera);
}
