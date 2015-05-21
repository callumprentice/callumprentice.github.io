/**
 * THREE.Geometry to THREE.BufferGeometry Example
 * @author Callum Prentice / http://callum.com/
 */
var camera, scene, renderer, controls, stats;
var bufferMesh = 0;
var density = 6;
var randomHeights = true;
var cylinderSides = 16;
var endCaps = true;
var maxHeight = 40;
var topRadius = 0.0;
var bottomRadius = 5.0;

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
    renderer.setClearColor(0x000000, 0.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 100, 1500.0);
    camera.position.z = 480.0;

    scene.add(new THREE.AmbientLight(0x444444));

    var light1 = new THREE.DirectionalLight(0x999999, 0.1);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0x999999, 1.5);
    light2.position.set(0, -1, 0);
    scene.add(light2);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.minDistance =100.0;
    controls.maxDistance = 800.0;
    controls.dynamicDampingFactor = 0.1;

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '24px';
    document.body.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);

    var gui = new dat.GUI({
        autoPlace: false,
        preset: 'Spikes',
        load: {
            "closed": false,
            "remembered": {
                "Spikes": {
                    "0": {
                        "density": 66,
                        "topRadius": 0,
                        "bottomRadius": 6.1,
                        "maxHeight": 65,
                        "cylinderSides": 16,
                        "endCaps": true,
                        "randomHeights": true
                    }
                },
                "Stubby": {
                    "0": {
                        "density": 40,
                        "topRadius": 1.9508890770533447,
                        "bottomRadius": 8.020321761219305,
                        "maxHeight": 14.428619813717187,
                        "cylinderSides": 4,
                        "endCaps": true,
                        "randomHeights": false
                    }
                },
                "Golfball": {
                    "0": {
                        "density": 50,
                        "topRadius": 1.9508890770533447,
                        "bottomRadius": 6.06943268416596,
                        "maxHeight": 1,
                        "cylinderSides": 64,
                        "endCaps": true,
                        "randomHeights": false
                    }
                },
                "Inward": {
                    "0": {
                        "density": 30,
                        "topRadius": 6.719729043183743,
                        "bottomRadius": 0,
                        "maxHeight": 80,
                        "cylinderSides": 16,
                        "endCaps": false,
                        "randomHeights": false
                    }
                },
                "Tribble": {
                    "0": {
                        "density": 84,
                        "topRadius": 0,
                        "bottomRadius": 3.2514817950889077,
                        "maxHeight": 60,
                        "cylinderSides": 16,
                        "endCaps": true,
                        "randomHeights": false
                    }
                },
                "Hexafloramethane": {
                    "0": {
                        "density": 36,
                        "topRadius": 7.370025402201525,
                        "bottomRadius": 7.4,
                        "cylinderSides": 6,
                        "maxHeight": 60,
                        "endCaps": true,
                        "randomHeights": true
                    }
                },
                "Tubular Bells": {
                    "0": {
                        "density": 30,
                        "topRadius": 6.719729043183743,
                        "bottomRadius": 4.55207451312447,
                        "cylinderSides": 64,
                        "maxHeight": 80,
                        "endCaps": false,
                        "randomHeights": true
                    }
                },
            },
            "folders": {}
        }
    });

    gui.remember(this);
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '24px';
    gui.domElement.style.right = '0';
    document.body.appendChild(gui.domElement);
    gui.add(this, 'density', 1, 180).step(2).name("Density").listen().onFinishChange(function (value) {
        addCones();
    });
    gui.add(this, 'topRadius', 0, 20).name("Top radius").listen().onFinishChange(function (value) {
        addCones();
    });
    gui.add(this, 'bottomRadius', 0, 20).name("Bottom radius").listen().onFinishChange(function (value) {
        addCones();
    });
    gui.add(this, 'cylinderSides', 3, 64).step(1).name("Cylinder sides").listen().onFinishChange(function (value) {
        addCones();
    });
    gui.add(this, 'maxHeight', 1, 80).name("Max height").listen().onFinishChange(function (value) {
        addCones();
    });
    gui.add(this, 'endCaps', true).name("End caps").onChange(function (value) {
        addCones();
    });
    gui.add(this, 'randomHeights', true).name("Random heights").onChange(function (value) {
        addCones();
    });

    addCones();
}

function addCones() {

    if (bufferMesh) {
        scene.remove(bufferMesh);
    }

    var buffer_geometry = new THREE.BufferGeometry();
    var radius = 100.0;
    var positions = 0;
    var normals = 0;
    var colors = 0;

    for (var num_lat = 0; num_lat < density / 2; ++num_lat) {

        var lhs = (num_lat + 0) * 180 / (density/2);
        var rhs = (num_lat + 1) * 180 / (density/2);
        var lat = (lhs + rhs) / 2.0;

        for (var num_lng = 0; num_lng < density; ++num_lng) {

            var lhs = (num_lng + 0) * 360 / density;
            var rhs = (num_lng + 1) * 360 / density;
            var lng = (lhs + rhs) / 2.0;

            var height = maxHeight;
            if (randomHeights)
                height = Math.random() * ( maxHeight - 5.0) + 5;

            var phi = lat * Math.PI / 180.0;
            var theta = lng * Math.PI / 180.0;
            var x = radius * Math.sin(phi) * Math.cos(theta);
            var y = radius * Math.cos(phi);
            var z = radius * Math.sin(phi) * Math.sin(theta);

            var geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, cylinderSides, 1, !endCaps);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, height / 2, 0));
            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(90)));
            geometry.applyMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z), new THREE.Vector3(0, 1, 0)));
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(x, y, z));

            var color = new THREE.Color(0xffffff);
            color.setHSL(lat / 180.0, 1.0, 0.7);

            if (positions === 0) {
                var num_stacks = density * density / 2;

                var str = "Geometry to BufferGeometry Example - " + parseInt(num_stacks * geometry.faces.length) + " triangles";
                document.getElementById('title').textContent = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                positions = new Float32Array(num_stacks * geometry.faces.length * 3 * 3);
                normals = new Float32Array(num_stacks * geometry.faces.length * 3 * 3);
                colors = new Float32Array(num_stacks * geometry.faces.length * 3 * 3);
            }

            geometry.faces.forEach(function (face, index) {

                var cur_element = ((num_lng + num_lat * density) * geometry.faces.length + index);

                positions[cur_element * 9 + 0] = geometry.vertices[face.a].x;
                positions[cur_element * 9 + 1] = geometry.vertices[face.a].y;
                positions[cur_element * 9 + 2] = geometry.vertices[face.a].z;
                positions[cur_element * 9 + 3] = geometry.vertices[face.b].x;
                positions[cur_element * 9 + 4] = geometry.vertices[face.b].y;
                positions[cur_element * 9 + 5] = geometry.vertices[face.b].z;
                positions[cur_element * 9 + 6] = geometry.vertices[face.c].x;
                positions[cur_element * 9 + 7] = geometry.vertices[face.c].y;
                positions[cur_element * 9 + 8] = geometry.vertices[face.c].z;

                normals[cur_element * 9 + 0] = face.normal.x;
                normals[cur_element * 9 + 1] = face.normal.y;
                normals[cur_element * 9 + 2] = face.normal.z;
                normals[cur_element * 9 + 3] = face.normal.x;
                normals[cur_element * 9 + 4] = face.normal.y;
                normals[cur_element * 9 + 5] = face.normal.z;
                normals[cur_element * 9 + 6] = face.normal.x;
                normals[cur_element * 9 + 7] = face.normal.y;
                normals[cur_element * 9 + 8] = face.normal.z;

                colors[cur_element * 9 + 0] = color.r;
                colors[cur_element * 9 + 1] = color.g;
                colors[cur_element * 9 + 2] = color.b;
                colors[cur_element * 9 + 3] = color.r;
                colors[cur_element * 9 + 4] = color.g;
                colors[cur_element * 9 + 5] = color.b;
                colors[cur_element * 9 + 6] = color.r;
                colors[cur_element * 9 + 7] = color.g;
                colors[cur_element * 9 + 8] = color.b;
            });
        }
    }

    buffer_geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer_geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    buffer_geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    buffer_geometry.computeBoundingSphere();

    var buffer_material = new THREE.MeshPhongMaterial({
        color: 0x999999,
        specular: 0x333333,
        shininess: 50,
        side: THREE.DoubleSide,
        vertexColors: THREE.VertexColors,
        shading: THREE.SmoothShading
    });

    bufferMesh = new THREE.Mesh(buffer_geometry, buffer_material);
    scene.add(bufferMesh);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}