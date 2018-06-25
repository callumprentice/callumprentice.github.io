/**
 * Voronoi Airport WebGL
 * @author Callum Prentice / http://callum.com/
 */
var camera, scene, renderer, controls, stats;
var diagram;
var radius = 0.5;
var cell_lines = [];
var show_cells = true;
var cells_mesh = 0;
var earth_material;
var earth_opacity = 0.6;
var cell_material;
var cell_opacity = 1.0;
var airport_material;
var airport_point_size = 0.00025;

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

    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 0.01, 1000.0);
    camera.position.z = 1.5;

    scene.add(new THREE.AmbientLight(0x333333));

    var light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(-3, -3, -3);
    scene.add(light2);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controls.rotateSpeed = 0.025;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 0.55;
    controls.maxDistance = 10.0;
    controls.enableDamping = true;
    controls.dampingFactor = 0.025;

    add_airport_locations();
    add_lines();

    var loader = new THREE.TextureLoader();
    var texture = loader.load('img/earth_surface.jpg');

    var geometry = new THREE.SphereBufferGeometry(radius, 32, 32);
    earth_material = new THREE.MeshPhongMaterial({ transparent: true, opacity: earth_opacity, map: texture });
    var sphere = new THREE.Mesh(geometry, earth_material);
    scene.add(sphere);

    var gui = new dat.GUI({ autoPlace: false });
    gui.add(this, 'show_cells', false)
        .name('Show Cells')
        .onChange(function(value) {
            if (value) {
                scene.add(cells_mesh);
            } else {
                scene.remove(cells_mesh);
            }
        });

    gui.add(this, 'earth_opacity', 0.0, 1.0)
        .name('Earth Opacity')
        .onChange(function(value) {
            earth_material.opacity = value;
        });

    gui.add(this, 'cell_opacity', 0.0, 1.0)
        .name('Cell Opacity')
        .onChange(function(value) {
            cell_material.opacity = value;
        });

    gui.add(this, 'airport_point_size', 0.00005, 0.005)
        .name('Airport Size')
        .onChange(function(value) {
            airport_material.size = value;
        });

    document.getElementById('gui').appendChild(gui.domElement);

    // stats = new Stats();
    // stats.domElement.style.position = "absolute";
    // stats.domElement.style.top = "0px";
    // document.body.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    //stats.update();
    renderer.render(scene, camera);
}

function lat_lng_to_x_y_z(lat, lng, radius) {
    var phi = ((90.0 - lat) * Math.PI) / 180.0;
    var theta = ((360.0 - lng) * Math.PI) / 180.0;

    x = radius * Math.sin(phi) * Math.cos(theta);
    y = radius * Math.cos(phi);
    z = radius * Math.sin(phi) * Math.sin(theta);

    return {
        x: x,
        y: y,
        z: z
    };
}

function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
    lat1 = (lat1 * Math.PI) / 180.0;
    lng1 = (lng1 * Math.PI) / 180.0;
    lat2 = (lat2 * Math.PI) / 180.0;
    lng2 = (lng2 * Math.PI) / 180.0;

    d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
    A = Math.sin((1 - offset) * d) / Math.sin(d);
    B = Math.sin(offset * d) / Math.sin(d);
    x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    z = A * Math.sin(lat1) + B * Math.sin(lat2);
    lat = (Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180) / Math.PI;
    lng = (Math.atan2(y, x) * 180) / Math.PI;

    return {
        lat: lat,
        lng: lng
    };
}

function add_airport_locations() {
    airport_material = new THREE.PointsMaterial({
        size: 0.00025,
        vertexColors: true,
        sizeAttenuation: true,
    });

    var num_points = airport_locations.length;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(num_points * 3);
    var colors = new Float32Array(num_points * 3);

    var color = new THREE.Color(0xffffff);
    for (var p = 0; p < num_points; ++p) {
        var lat = airport_locations[p][0];
        var lng = airport_locations[p][1];

        var pos = lat_lng_to_x_y_z(lat, lng, radius);

        positions[3 * p + 0] = pos.x;
        positions[3 * p + 1] = pos.y;
        positions[3 * p + 2] = pos.z;

        color.setHSL((lat + 90) / 180, 0.9, 0.6);
        colors[3 * p + 0] = color.r;
        colors[3 * p + 1] = color.g;
        colors[3 * p + 2] = color.b;
    }
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingBox();

    scene.add(new THREE.Points(geometry, airport_material));
}

function add_lines() {
    var voronoi = new Voronoi();
    var bbox = { xl: 0, xr: 360, yt: 0, yb: 180 };
    var sites = [];

    for (var p = 0; p < airport_locations.length; ++p) {
        var lat = airport_locations[p][0] + 90.0;
        var lng = airport_locations[p][1] + 180;

        sites.push({ x: lng, y: lat });
    }

    diagram = voronoi.compute(sites, bbox);

    for (var c = 0; c < diagram.cells.length; ++c) {
        var cell = diagram.cells[c];

        var end;
        for (var ce = 0; ce < cell.halfedges.length; ce++) {
            var start = cell.halfedges[ce].getStartpoint();
            end = cell.halfedges[ce].getEndpoint();

            var lat1 = start.y - 90.0;
            var lng1 = start.x - 180.0;
            var lat2 = end.y - 90.0;
            var lng2 = end.x - 180.0;

            var length = Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
            if (length > 5) {
                var spline_control_points = 12;

                var latlng1 = latlngInterPoint(lat1, lng1, lat2, lng2, 0);

                for (var i = 0; i < spline_control_points + 1; i++) {
                    var latlng2 = latlngInterPoint(lat1, lng1, lat2, lng2, i / spline_control_points);
                    cell_lines.push({ lat1: latlng1.lat, lng1: latlng1.lng, lat2: latlng2.lat, lng2: latlng2.lng });
                    latlng1 = latlng2;
                }

                cell_lines.push({ lat1: latlng1.lat, lng1: latlng1.lng, lat2: lat2, lng2: lng2 });
            } else {
                cell_lines.push({ lat1: lat1, lng1: lng1, lat2: lat2, lng2: lng2 });
            }
        }
    }

    var num_lines = cell_lines.length;

    geometry = new THREE.BufferGeometry();
    var line_positions = new Float32Array(num_lines * 3 * 2);
    var line_colors = new Float32Array(num_lines * 3 * 2);

    for (var i = 0; i < num_lines; ++i) {
        var lat1 = cell_lines[i].lat1;
        var lng1 = cell_lines[i].lng1;
        var pos1 = lat_lng_to_x_y_z(lat1, lng1, radius);

        var lat2 = cell_lines[i].lat2;
        var lng2 = cell_lines[i].lng2;
        var pos2 = lat_lng_to_x_y_z(lat2, lng2, radius);

        var index = i;

        line_positions[index * 6 + 0] = pos1.x;
        line_positions[index * 6 + 1] = pos1.y;
        line_positions[index * 6 + 2] = pos1.z;

        line_positions[index * 6 + 3] = pos2.x;
        line_positions[index * 6 + 4] = pos2.y;
        line_positions[index * 6 + 5] = pos2.z;

        var color = new THREE.Color(0xffffff);

        color.setHSL((lat1 + 90) / 180, 0.5, 0.2);
        line_colors[index * 6 + 0] = color.r;
        line_colors[index * 6 + 1] = color.g;
        line_colors[index * 6 + 2] = color.b;

        color.setHSL((lat2 + 90) / 180, 0.5, 0.2);
        line_colors[index * 6 + 3] = color.r;
        line_colors[index * 6 + 4] = color.g;
        line_colors[index * 6 + 5] = color.b;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(line_positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(line_colors, 3));

    geometry.computeBoundingSphere();

    cell_material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: cell_opacity,
        depthTest: true,
        depthWrite: false
    });

    fitCameraToObject(geometry);

    cells_mesh = new THREE.LineSegments(geometry, cell_material);
    scene.add(cells_mesh);
}

function fitCameraToObject(geometry) {
    var fudge_factor = 1.02;
    var bounding_sphere_radius = geometry.boundingSphere.radius;

    var container_aspect_ratio = window.innerHeight / window.innerWidth;
    if (container_aspect_ratio > 1) bounding_sphere_radius = bounding_sphere_radius * container_aspect_ratio;
    var dist = bounding_sphere_radius / Math.sin((camera.fov * (Math.PI / 180.0)) / 2);
    dist *= fudge_factor;
    camera.position.set(-dist, 0.0, 0.0);
}
