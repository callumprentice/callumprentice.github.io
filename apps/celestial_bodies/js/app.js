/**
 * Celestial Body Compare
 * @author Callum Prentice (2017) / http://callum.com/
 */
var camera, scene, renderer, controls, raycaster;
var manager = new THREE.LoadingManager();
var loader = new THREE.TextureLoader(manager);
var root = new THREE.Object3D();
var mouse = new THREE.Vector2();
var bodies_list = [];

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

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / (window.innerHeight), 0.01, 1000.0);
    camera.position.z = 28.0;

    scene.add(new THREE.AmbientLight(0x666666));

    var light = new THREE.DirectionalLight(0x999999, 1);
    light.position.set(1, 1, 1);
    scene.add(light);

    raycaster = new THREE.Raycaster();

    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 1.0;
    controls.noZoom = true;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 0;
    controls.maxDistance = 100.0;
    controls.addEventListener('change', render);

    loader.load(
        'images/starfield.png',

        function(texture) {
            scene.add(new THREE.Mesh(
                new THREE.SphereBufferGeometry(90, 64, 64),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                })
            ));
        });

    for (var i = 0; i < body_data.length; ++i) {
        createBody(i);
    }

    scene.add(root);

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('dblclick', onDocumentMouseDoubleClick, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, (window.innerHeight));

    render();
}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
}

function render() {

    renderer.render(scene, camera);
}

function getQueryParameterByName(name) {

    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null) {
        return "";
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
}

function share() {

    if (bodies_list.length === 0) {
        return;
    }

    var url = "?v=2";

    for (var i = 0; i < bodies_list.length; ++i) {
        url += "&" + (i + 1) + "=" + bodies_list[i].name;
    }
    window.open(url);
}

manager.onLoad = function() {

    if (getQueryParameterByName("1") === "") {
        addBody('earth');
    } else {
        for (var i = 0; i < body_data.length; ++i) {
            var str = "" + i;
            var name = getQueryParameterByName(str);
            addBody(name);
        }
    }
};

function createBody(i) {

    loader.load(
        body_data[i].surface_texture,

        function(texture) {
            var material = new THREE.MeshPhongMaterial({
                map: texture,
                specular: new THREE.Color(0x333333)
            });

            var geometry = new THREE.SphereBufferGeometry(body_data[i].scaled_radius, 128, 128);
            var mesh = new THREE.Mesh(geometry, material);

            if (body_data[i].name === 'saturn') {

                loader.load(
                    'surface_textures/saturn/saturn_rings.png',
                    function(texture) {

                        var ring_scale = 3.5;
                        var rings = new THREE.Mesh(
                            new THREE.BoxGeometry(body_data[i].scaled_radius * ring_scale, body_data[i].scaled_radius * ring_scale, 0.001, 1, 1, 1),
                            new THREE.MeshLambertMaterial({
                                map: texture,
                                transparent: true
                            })
                        );

                        rings.rotation.x = Math.PI / 2.0;
                        mesh.add(rings);
                    });
            }

            mesh.rotation.x = Math.PI / 30.0;
            mesh.visible = false;
            mesh.name = body_data[i].name;

            body_data[i].mesh = mesh;

            root.add(mesh);
        });
}

function toTitleCase(str) {

    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function numberWithCommas(x) {

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function build_geometry() {

    var x_offset = 0.0;

    for (var i = 0; i < body_data.length; ++i) {
        body_data[i].mesh.visible = false;
        body_data[i].mesh.position.x = Infinity;
        body_data[i].mesh.position.y = Infinity;
        body_data[i].mesh.position.z = Infinity;
    }

    for (var j = 0; j < bodies_list.length; ++j) {

        bodies_list[j].mesh.visible = true;
        bodies_list[j].mesh.position.x = x_offset + bodies_list[j].scaled_radius;
        bodies_list[j].mesh.position.y = 0.0;
        bodies_list[j].mesh.position.z = 0.0;

        x_offset += bodies_list[j].scaled_radius * 2;
    }

    updateInfoDisplay();

    root.position.set(-x_offset / 2.0, 0.0, 0.0);

    var aspect = window.innerHeight / window.innerWidth;
    var fudge_factor = 1.2;
    var radius = x_offset / 2.0;
    if (aspect > 1) radius = radius * aspect;
    var dist = radius / (Math.sin(camera.fov * (Math.PI / 180.0) / 2));
    dist *= fudge_factor;

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = -dist;
}

function updateInfoDisplay(selected_name) {

    var info_display_str = "";

    if (bodies_list.length > 0) {
        info_display_str = "<strong>Object radius in miles</strong><br>";
    }

    for (var i = 0; i < bodies_list.length; ++i) {

        if (selected_name === bodies_list[i].name) {
            info_display_str += "<div id='hl_on'>";
        } else {
            info_display_str += "<div id='hl_off'>";
        }

        info_display_str += toTitleCase(bodies_list[i].name);
        info_display_str += " : ";
        info_display_str += numberWithCommas(parseInt(bodies_list[i].radius));

        info_display_str += "</div>";
    }

    document.getElementById('info_display').innerHTML = info_display_str;
}

function addBody(name) {

    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === name) {

            if (bodies_list.indexOf(body_data[i]) === -1) {
                bodies_list.push(body_data[i]);
                build_geometry();
                break;
            }
        }
    }
}

function removeBody(name) {

    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === name) {

            var index = bodies_list.indexOf(body_data[i]);
            if (index > -1) {
                bodies_list.splice(index, 1);
                build_geometry();
                break;
            }
        }
    }
}

function toggleBody(name) {
    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === name) {
            if (bodies_list.indexOf(body_data[i]) === -1) {
                addBody(name);
            } else {
                removeBody(name);
            }
            break;
        }
    }
}
function removeAllBodies() {

    bodies_list = [];
    build_geometry();
}

function onDocumentMouseDoubleClick(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(root.children);

    if (intersects.length > 0) {
        removeBody(intersects[0].object.name);
    } else {}
}

function onDocumentMouseMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(root.children);

    if (intersects.length > 0) {
        var highlighted_name = intersects[0].object.name;
        updateInfoDisplay(highlighted_name);
    } else {
        updateInfoDisplay("");
    }
}

function showHelpContents(id) {
    document.getElementById('about_text').className = "hide help_contents mouse_off";
    document.getElementById('controls_text_1').className = "hide help_contents mouse_off";
    document.getElementById('future_text').className = "hide help_contents mouse_off";
    document.getElementById('credits_text').className = "hide help_contents mouse_off";
    document.getElementById('contact_text').className = "hide help_contents mouse_off";

    var element = document.getElementById(id);
    if (element) {
        document.getElementById(id).className = "show help_contents mouse_on";
    }
}

function showAbout(visible) {
    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
        document.getElementById("about_box").className = "show";
        document.getElementById("about_box").style.pointerEvents = "all";
        showHelpContents("about_text");

    } else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
        showHelpContents("none");
    }
}