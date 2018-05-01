/**
 * Application Name
 * @author Callum Prentice 2018 / http://callum.com/
 */
var camera, scene, renderer, controls;

function app() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    init();
    animate();
}

function latLngToXYZ(lat, lng, radius) {
    var phi = (90.0 - lat) * Math.PI / 180.0;
    var theta = (360.0 - lng) * Math.PI / 180.0;

    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
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

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 0.01, 1000.0);
    camera.position.z = 1.5;

    scene.add(new THREE.AmbientLight(0x333333));

    var light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(-3, -3, -3);
    scene.add(light2);

    var params = {
        opacity: 0.8
    };
    var globeMaterial = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('img/earth_surface.jpg'),
        opacity: params.opacity,
        transparent: true
    });

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 0.75;
    controls.maxDistance = 10.0;

    var radius = 0.5;

    scene.add(
        new THREE.Mesh(
            new THREE.SphereGeometry(radius, 64, 64),
            globeMaterial
        )
    );

    var cube_radius = radius * 1.01;
    var geometry = new THREE.BoxGeometry(cube_radius, cube_radius, cube_radius, 1, 1, 1);

    var p0 = latLngToXYZ(12.16666667, -83.06666667, cube_radius);
    var p1 = latLngToXYZ(42.93333333, -8.55000000, cube_radius);
    var p2 = latLngToXYZ(-55.000000, -69.00000, cube_radius);
    var p3 = latLngToXYZ(-21.16666667, 22.95000000, cube_radius);
    var p4 = latLngToXYZ(55.00000, 111.00000, cube_radius);
    var p5 = latLngToXYZ(21.16666667, -157.06666667, cube_radius);
    var p6 = latLngToXYZ(-12.16666667, 96.83333333, cube_radius);
    var p7 = latLngToXYZ(-42.93333333, 171.450000, cube_radius);

    var m0 = createMarker();
    m0.position.x = p0.x;
    m0.position.y = p0.y;
    m0.position.z = p0.z;
    scene.add(m0);
    geometry.vertices[0].x = p0.x;
    geometry.vertices[0].y = p0.y;
    geometry.vertices[0].z = p0.z;

    var m1 = createMarker();
    m1.position.x = p1.x;
    m1.position.y = p1.y;
    m1.position.z = p1.z;
    scene.add(m1);
    geometry.vertices[1].x = p1.x;
    geometry.vertices[1].y = p1.y;
    geometry.vertices[1].z = p1.z;

    var m2 = createMarker();
    m2.position.x = p2.x;
    m2.position.y = p2.y;
    m2.position.z = p2.z;
    scene.add(m2);
    geometry.vertices[2].x = p2.x;
    geometry.vertices[2].y = p2.y;
    geometry.vertices[2].z = p2.z;

    var m3 = createMarker();
    m3.position.x = p3.x;
    m3.position.y = p3.y;
    m3.position.z = p3.z;
    scene.add(m3);
    geometry.vertices[3].x = p3.x;
    geometry.vertices[3].y = p3.y;
    geometry.vertices[3].z = p3.z;

    var m4 = createMarker();
    m4.position.x = p4.x;
    m4.position.y = p4.y;
    m4.position.z = p4.z;
    scene.add(m4);
    geometry.vertices[4].x = p4.x;
    geometry.vertices[4].y = p4.y;
    geometry.vertices[4].z = p4.z;

    var m5 = createMarker();
    m5.position.x = p5.x;
    m5.position.y = p5.y;
    m5.position.z = p5.z;
    scene.add(m5);
    geometry.vertices[5].x = p5.x;
    geometry.vertices[5].y = p5.y;
    geometry.vertices[5].z = p5.z;

    var m6 = createMarker();
    m6.position.x = p6.x;
    m6.position.y = p6.y;
    m6.position.z = p6.z;
    scene.add(m6);
    geometry.vertices[6].x = p6.x;
    geometry.vertices[6].y = p6.y;
    geometry.vertices[6].z = p6.z;

    var m7 = createMarker();
    m7.position.x = p7.x;
    m7.position.y = p7.y;
    m7.position.z = p7.z;
    scene.add(m7);
    geometry.vertices[7].x = p7.x;
    geometry.vertices[7].y = p7.y;
    geometry.vertices[7].z = p7.z;

    var material = new THREE.MeshNormalMaterial({});
    var cube = new THREE.Mesh(geometry, material);

    var edge_geometry = new THREE.EdgesGeometry(cube.geometry); // or WireframeGeometry
    var edge_material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 1
    });
    var edges = new THREE.LineSegments(edge_geometry, edge_material);
    cube.add(edges);

    scene.add(cube);

    window.addEventListener('resize', onWindowResize, false);

    var gui = new dat.GUI();
    gui.add(params, 'opacity', 0, 1).onChange(function() {

        globeMaterial.opacity = params.opacity;
    });
    gui.open();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function createMarker() {
    return new THREE.Mesh(
        new THREE.SphereGeometry(0.003, 16, 16),
        new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xff0000),
            specular: new THREE.Color(0x222222)
        })
    );
}
