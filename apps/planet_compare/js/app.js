/**
 * Planet / Moon Compare
 * @author Callum Prentice / http://callum.com/
 */
var camera, scene, renderer, controls, stats;
var clock = new THREE.Clock();
var clickNum = 0;
var firstPlanet = '';
var secondPlanet = '';
var first_index = -1;
var second_index = -1;
var uiHeight = 192;

var radius_earth = 3963.1676;  // TODO - find this from data

var planet_data = [
    {
        name: 'MERCURY',
        radius: 1515.9593,
        surface_texture: 'img/mercury_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 58.25,
        rotation: 0
    },
    {
        name: 'VENUS',
        radius: 3760.41418,
        surface_texture: 'img/venus_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 116.6,
        rotation: 0
    },
    {
        name: 'EARTH',
        radius: 3963.1676,
        surface_texture: 'img/earth_surface.jpg',
        elevation_texture: 'img/earth_elevation.jpg',
        specular_texture: 'img/earth_specular.png',
        mesh: 0,
        length_of_day: 1,
        rotation: 0
    },
    {
        name: 'MARS',
        radius: 2110.79794,
        surface_texture: 'img/mars_surface.jpg',
        elevation_texture: 'img/mars_elevation.jpg',
        specular_texture: '',
        mesh: 0,
        length_of_day: 1.05,
        rotation: 0
    },
    {
        name: 'JUPITER',
        radius: 43440.7,
        surface_texture: 'img/jupiter_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 0.417,
        rotation: 0
    },
    {
        name: 'SATURN',
        radius: 37448.799 ,
        surface_texture: 'img/saturn_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 0.444,
        rotation: 0
    },
    {
        name: 'URANUS',
        radius: 15881.6263,
        surface_texture: 'img/uranus_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 0.719,
        rotation: 0
    },
    {
        name: 'NEPTUNE',
        radius: 15387.6362,
        surface_texture: 'img/neptune_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 0.666,
        rotation: 0
    },
    {
        name: 'PLUTO',
        radius: 733.218007,
        surface_texture: 'img/pluto_surface.jpg',
        elevation_texture: '',
        specular_texture: '',
        mesh: 0,
        length_of_day: 6.39,
        rotation: 0
    }
];

function app() {
    if(!Detector.webgl) {
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
    renderer.setSize(window.innerWidth, window.innerHeight - uiHeight);

    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / (window.innerHeight - uiHeight), 0.01, 1000.0);
    camera.position.z = 28.0;

    scene.add(new THREE.AmbientLight(0x666666));

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.noZoom = true;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 0;
    controls.maxDistance = 100.0;

    var stars = createStars(90, 64);
    scene.add(stars);

    var total_size = 0;
    for(var i = 0; i < planet_data.length; ++i) {
        total_size += scaleRadius(planet_data[i].radius) * 2;
    }
    var cur_x = -total_size/2;

    for(var i = 0; i < planet_data.length; ++i) {

        planet_data[i].mesh = createPlanet( {
            radius: (0.5) * (planet_data[i].radius/radius_earth),
            segments: 64,
            surface_texture: planet_data[i].surface_texture,
            elevation_texture: planet_data[i].elevation_texture,
            specular_texture: planet_data[i].specular_texture,
            name: planet_data[i].name
        });

        planet_data[i].mesh.visible = false;

        scene.add(planet_data[i].mesh);
    }

    // stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // document.body.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('dblclick', onDocumentMouseDoubleClick, false);

    select('EARTH', '');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / (window.innerHeight - uiHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, (window.innerHeight - uiHeight));
}

function animate(time) {
    requestAnimationFrame(animate);

    // for(var i = 0; i < planet_data.length; ++i) {
    //     var scale_factor = 0.1;
    //     var rotation = clock.getElapsedTime() * scale_factor / planet_data[i].length_of_day;
    //     planet_data[i].mesh.rotation.y = rotation;
    // }

    controls.update();
    //stats.update();
    renderer.render(scene, camera);
}

function scaleRadius(radius) {
    return 0.5 * radius/radius_earth;
}

function xyzFromLatLng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;

    var x = radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

function createPlanet(details) {
    var mesh = new THREE.Mesh(
        new THREE.SphereBufferGeometry(details.radius, details.segments, details.segments),
        new THREE.MeshPhongMaterial({
            map: THREE.ImageUtils.loadTexture(details.surface_texture),
            bumpMap: THREE.ImageUtils.loadTexture(details.elevation_texture),
            bumpScale: 0.0015,
            specularMap: THREE.ImageUtils.loadTexture(details.specular_texture),
            specular: new THREE.Color(0x222222)
        })
    );

    mesh.rotation.x = Math.PI / 30.0;

    if ( details.name === 'SATURN') {
        var ring_scale = 3.5;
        var rings = new THREE.Mesh(
            new THREE.BoxGeometry(details.radius * ring_scale, details.radius * ring_scale, 0.001, 1, 1, 1),
            new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture("img/saturn_rings.png"),
                transparent: true,
                specular: new THREE.Color(0x222222)
            })
        );

        rings.rotation.x = Math.PI / 2.0;
        mesh.add(rings);
    }

    return mesh;
}

function createStars(radius, segments) {
    return new THREE.Mesh(
        new THREE.SphereBufferGeometry(radius, segments, segments),
        new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('img/starfield.png'),
            side: THREE.BackSide
        })
    );
}

function select(name) {
    if (clickNum === 0) {
        clickNum = 1;
        firstPlanet = name;
    } else
    if (clickNum === 1 && name !== firstPlanet) {
        clickNum = 2;
        secondPlanet = name;
    } else
    if (clickNum === 2) {
        clickNum = 1;
        firstPlanet = name;
        secondPlanet = '';
    }

    var output = "";
    if ( firstPlanet.length > 0 && secondPlanet.length > 0) {
        var swapped = setVisible(firstPlanet, secondPlanet);
        if ( ! swapped ) {
            output = "COMPARING &nbsp;<i>" + firstPlanet + "</i> &nbsp;WITH &nbsp;<i>" + secondPlanet + "</i><br>DOUBLE CLICK ON &nbsp;<i>" + firstPlanet + "</i>&nbsp; TO POSITION <i>" + secondPlanet + "</i> ON ITS' SURFACE";
        } else {
            output = "COMPARING &nbsp;<i>" + secondPlanet + "</i> &nbsp;WITH &nbsp;<i>" + firstPlanet + "</i><br>DOUBLE CLICK ON &nbsp;<i>" + secondPlanet + "</i>&nbsp; TO POSITION <i>" + firstPlanet + "</i> ON ITS' SURFACE";
        }
    } else
    if ( firstPlanet.length > 0 && secondPlanet.length === 0) {
        output = "<i>" + firstPlanet + "</i>&nbsp; SELECTED - CHOOSE A PLANET TO COMPARE IT TO";
        setVisible(firstPlanet, secondPlanet);
    } else
    if ( firstPlanet.length === 0 && secondPlanet.length === 0) {
        output = "SELECT A PLANET";
    }

    document.getElementById("planet_selector_description").innerHTML = output;
}

function setVisible(first, second) {
    first_index = -1;
    second_index = -1;
    var swapped = false;

    for(var i = 0; i < planet_data.length; ++i) {

        if (first ===  planet_data[i].name) {
            first_index = i;
        }
        if (second ===  planet_data[i].name) {
            second_index = i;
        }

        planet_data[i].mesh.visible = false;
        planet_data[i].mesh.position.x = 0.0;
        planet_data[i].mesh.position.y = 0.0;
        planet_data[i].mesh.position.z = 0.0;
    }

    if ( second.length && planet_data[second_index].radius > planet_data[first_index].radius ) {
        var tmp = first_index;
        first_index = second_index;
        second_index = tmp;
        swapped = true;
    }

    var new_dist = scaleRadius(planet_data[first_index].radius) * 3 / 2 / Math.tan(Math.PI * camera.fov / 360);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = new_dist;

    planet_data[first_index].mesh.visible = true;

    if ( second.length) {

        planet_data[second_index].mesh.position.x = scaleRadius(planet_data[first_index].radius) + scaleRadius(planet_data[second_index].radius);

        var bbmin = -scaleRadius(planet_data[first_index].radius);
        var bbmax = scaleRadius(planet_data[first_index].radius) + scaleRadius(planet_data[second_index].radius) * 2;

        planet_data[first_index].mesh.position.x = -(bbmax + bbmin)/2;
        planet_data[second_index].mesh.position.x = planet_data[first_index].mesh.position.x + scaleRadius(planet_data[first_index].radius) + scaleRadius(planet_data[second_index].radius);

        planet_data[second_index].mesh.visible = true;
    }

    return swapped;
}

function onDocumentMouseDoubleClick(event) {
    event.preventDefault();
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / (window.innerHeight - uiHeight)) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, -1);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(planet_data[first_index].mesh, true);
    if (intersects.length > 0 && second_index != -1) {
        if (intersects[0].point !== null) {
            planet_data[first_index].mesh.position.set(0.0, 0.0, 0.0);
            planet_data[second_index].mesh.position.copy(intersects[0].point);
        } else {
        }
    } else {
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
        showHelpContents("about_text")

    } else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
        showHelpContents("none")
    }
}
