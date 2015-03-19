/**
 * Country Selector
 * @author Callum Prentice / http://callum.com/
 */
var camera, scene, renderer, controls, stats;
var radius = 0.995;
var base_globe = 0;
var projector;
var intersected_object = 0;
var overlay_element = 0;
var hover_scale = 1.01;

function start_app() {
    init();
    animate();
}

function init() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 0.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4500);
    camera.position.z = 100;

    scene.add(new THREE.AmbientLight(0x555555));

    var directionalLight1 = new THREE.DirectionalLight(0xaaaaaa, 0.5);
    directionalLight1.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(0xaaaaaa, 0.5);
    directionalLight2.position.set(-1, 1, -1).normalize();
    scene.add(directionalLight2);

    var directionalLight3 = new THREE.DirectionalLight(0xaaaaaa, 0.5);
    directionalLight3.position.set(1, 1, -1).normalize();
    scene.add(directionalLight3);

    var directionalLight4 = new THREE.DirectionalLight(0xaaaaaa, 0.5);
    directionalLight4.position.set(1, 1, 1).normalize();
    scene.add(directionalLight4);

    var segments = 64;

    base_globe = new THREE.Object3D();
    base_globe.scale.set(20, 20, 20);
    scene.add(base_globe);

    sea_texture = THREE.ImageUtils.loadTexture('textures/sea.jpg', THREE.UVMapping, function () {
        sea_texture.wrapS = THREE.RepeatWrapping;
        sea_texture.wrapT = THREE.RepeatWrapping;
        sea_texture.repeat.set(16, 8);
        base_globe.add(new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments),
        new THREE.MeshLambertMaterial({
            transparent: true,
            depthTest: true,
            depthWrite: false,
            opacity: 0.95,
            map: sea_texture,
            color: 0x6699ff
        })));

        for (var name in country_data) {
            geometry = new Tessalator3D(country_data[name], 0);

            var continents = ["EU", "AN", "AS", "OC", "SA", "AF", "NA"];
            var color = new THREE.Color(0xff0000);
            color.setHSL(continents.indexOf(country_data[name].data.cont) * (1 / 7), Math.random() * 0.25 + 0.65, Math.random() / 2 + 0.25);
            var mesh = country_data[name].mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                color: color
            }));
            mesh.name = "land";
            mesh.userData.country = name;
            base_globe.add(mesh);
        }
    });

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 1.0;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 23.0;
    controls.maxDistance = 70.0;
    controls.dynamicDampingFactor = 0.1;

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    projector = new THREE.Projector();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    if (intersected_object !== 0) {
        intersected_object.scale.set(1.0, 1.0, 1.0);
    }

    event.preventDefault();
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, -1);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(base_globe, true);
    if (intersects.length > 0) {
        if (intersects[0].point !== null) {
            if (intersects[0].object.name === "land") {
                console.log(intersects[0].object.userData.country);

                if (overlay_element === 0) {
                    overlay_element = document.getElementById("overlay");
                }
                overlay_element.innerHTML = intersects[0].object.userData.country;

                intersects[0].object.scale.set(hover_scale, hover_scale, hover_scale);
                intersected_object = intersects[0].object;
            } else {
                overlay_element.innerHTML = "";
            }
        } else {
            overlay_element.innerHTML = "";
        }
    } else {
            overlay_element.innerHTML = "";
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}