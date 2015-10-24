/**
 * Celestial Body Compare
 * @author Callum Prentice (2015) / http://callum.com/
 */
var camera, scene, renderer, controls;
var firstBody = '';
var secondBody = '';
var firstBodyRadius = 0;
var secondBodyRadius = 0;
var firstIndex = -1;
var secondIndex = -1;
var manager = new THREE.LoadingManager();
var loader = new THREE.TextureLoader(manager);

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

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.noZoom = true;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 0;
    controls.maxDistance = 100.0;

    createStars(90, 64);

    for (var i = 0; i < body_data.length; ++i) {
        createBody(i, body_data[i].surface_texture, body_data[i].radius);
    }

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('dblclick', onDocumentMouseDoubleClick, false);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, (window.innerHeight));
}

function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function scaleRadius(radius) {
    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === 'earth') {
            return 0.5 * radius / body_data[i].radius;
        }
    };
    return 1.0;
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function share() {
    if (firstBody.length !== 0 && secondBody.length !== 0) {

        var url = "?1=" + firstBody + "&2=" + secondBody;
        window.open(url);
    }
}

manager.onProgress = function (item, loaded, total) {

};

manager.onLoad = function () {

    var first = getQueryParameterByName("1");
    var second = getQueryParameterByName("2");
    var first_found = false;
    var second_found = false;

    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === first) {
            first_found = true;
        }
        if (body_data[i].name === second) {
            second_found = true;
        }
    };

    if (first != second && first_found && second_found) {
        select(first);
        select(second);
    } else {
        select('earth');
    }
};

function createBody(i, surface_texture_filename, radius) {
    loader.load(
        surface_texture_filename,

        function (texture) {
            var material = new THREE.MeshPhongMaterial({
                map: texture,
                specular: new THREE.Color(0x333333)
            });

            var geometry = new THREE.SphereBufferGeometry(scaleRadius(radius), 128, 128);
            var mesh = new THREE.Mesh(geometry, material);

            if (surface_texture_filename === 'surface_textures/saturn/saturn.jpg') {
                createSaturnRings(mesh, radius);
            }

            mesh.rotation.x = Math.PI / 30.0;
            mesh.visible = false;

            body_data[i].mesh = mesh;

            scene.add(mesh);
        });
}

function createSaturnRings(mesh, radius) {

    loader.load(
        'surface_textures/saturn/saturn_rings.png',
        function (texture) {

            var ring_scale = 3.5;
            var rings = new THREE.Mesh(
                new THREE.BoxGeometry(scaleRadius(radius) * ring_scale, scaleRadius(radius) * ring_scale, 0.001, 1, 1, 1),
                new THREE.MeshLambertMaterial({
                    map: texture,
                    transparent: true
                })
            );

            rings.rotation.x = Math.PI / 2.0;
            mesh.add(rings);
        });
}

function createStars(radius, segments) {
    loader.load(
        'images/starfield.png',

        function (texture) {

            scene.add(new THREE.Mesh(
                new THREE.SphereBufferGeometry(radius, segments, segments),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide
                })
            ))
        });
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function radiusFromName(name) {
    for (var i = 0; i < body_data.length; ++i) {
        if (body_data[i].name === name) {
            return numberWithCommas(parseInt(body_data[i].radius));
        }
    };
    return 0;
}

function buildDualOutput(name1, name2) {

    return "Comparing&nbsp;&nbsp;<i>" +
                    toTitleCase(name1) +
                    " (<b>radius " + radiusFromName(name1) + " miles</b>) " +
                    "</i>&nbsp;with&nbsp;<i>" +
                    toTitleCase(name2) +
                    " (<b>radius " + radiusFromName(name2) + " miles</b>) " +
                    "</i><br>Double click on&nbsp;&nbsp;<i>" +
                    toTitleCase(name1) +
                    "</i>&nbsp;to position&nbsp;<i>" +
                    toTitleCase(name2) +
                    "</i>&nbsp;&nbsp;on its surface";
}

function select(name) {

    if (firstBody === name && secondBody.length === 0) {
        return;
    }

    if (firstBody.length === 0 && secondBody.length === 0) {
        firstBody = name;
        firstBodyRadius = radiusFromName(name);
        document.getElementById('share_icon').className = "hide";
    } else
    if (firstBody.length !== 0 && secondBody.length === 0) {
        secondBody = name;
        secondBodyRadius = radiusFromName(name);
        document.getElementById('share_icon').className = "show";
    } else
    if (firstBody.length !== 0 && secondBody.length !== 0) {
        firstBody = name;
        firstBodyRadius = radiusFromName(name);
        secondBody = "";
        secondBodyRadius = 0;
        document.getElementById('share_icon').className = "hide";
    }

    var output = "";
    if (firstBody.length > 0 && secondBody.length > 0) {
        var swapped = setVisible(firstBody, secondBody);
        if (!swapped) {
            output = buildDualOutput(firstBody, secondBody);
        } else {
            output = buildDualOutput(secondBody, firstBody);
        }
    } else
    if (firstBody.length > 0 && secondBody.length === 0) {
        output = "<i>" + toTitleCase(firstBody) + "</i>&nbsp; selected - choose something to compare it to";
        setVisible(firstBody, secondBody);
    } else
    if (firstBody.length === 0 && secondBody.length === 0) {
        output = "Select something";
    }

    document.getElementById("body_selector_description").innerHTML = output;
}

function setVisible(first, second) {
    firstIndex = -1;
    secondIndex = -1;
    var swapped = false;

    for (var i = 0; i < body_data.length; ++i) {

        if (first === body_data[i].name) {
            firstIndex = i;
        }
        if (second === body_data[i].name) {
            secondIndex = i;
        }

        body_data[i].mesh.visible = false;
        body_data[i].mesh.position.x = 0.0;
        body_data[i].mesh.position.y = 0.0;
        body_data[i].mesh.position.z = 0.0;
    }

    if (second.length && body_data[secondIndex].radius > body_data[firstIndex].radius) {
        var tmp = firstIndex;
        firstIndex = secondIndex;
        secondIndex = tmp;
        swapped = true;
    }

    var new_dist = scaleRadius(body_data[firstIndex].radius) * 3 / 2 / Math.tan(Math.PI * camera.fov / 360);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = new_dist;

    body_data[firstIndex].mesh.visible = true;

    if (second.length) {

        body_data[secondIndex].mesh.position.x = scaleRadius(body_data[firstIndex].radius) + scaleRadius(body_data[secondIndex].radius);

        var bbmin = -scaleRadius(body_data[firstIndex].radius);
        var bbmax = scaleRadius(body_data[firstIndex].radius) + scaleRadius(body_data[secondIndex].radius) * 2;

        body_data[firstIndex].mesh.position.x = -(bbmax + bbmin) / 2;
        body_data[secondIndex].mesh.position.x = body_data[firstIndex].mesh.position.x + scaleRadius(body_data[firstIndex].radius) + scaleRadius(body_data[secondIndex].radius);

        body_data[secondIndex].mesh.visible = true;

        var new_dist = (scaleRadius(body_data[firstIndex].radius) + scaleRadius(body_data[secondIndex].radius) ) * 1.1 / Math.tan(Math.PI * camera.fov / 360);
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = new_dist;
    }

    return swapped;
}

function onDocumentMouseDoubleClick(event) {
    event.preventDefault();
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / (window.innerHeight)) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, -1);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(body_data[firstIndex].mesh, true);
    if (intersects.length > 0 && secondIndex != -1) {
        if (intersects[0].point !== null) {
            body_data[firstIndex].mesh.position.set(0.0, 0.0, 0.0);
            body_data[secondIndex].mesh.position.copy(intersects[0].point);
        } else {}
    } else {}
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
