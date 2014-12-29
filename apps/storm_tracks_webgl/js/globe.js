var planetMesh;
var planetSurfaceTexture;
var updateFlag = true;
var canvas;
var context;
var backingCanvas;
var backingContext;
var earthImageWidth = 4096;
var earthImageHeight = 2048;
var displayControlsBox = true;
var controls;
var clock = new THREE.Clock();
var rotationSpeed = 0.1;
var autoSpinGlobe = true;
var displayHelp = false;
var rStatsInstance;
var debugMode = false;

function initCanvas() {

    canvas = document.getElementById('canvas_texture');
    context = canvas.getContext('2d');

    canvas.width = earthImageWidth
    canvas.height = earthImageHeight;

    backingCanvas = document.getElementById('backing_canvas_texture');
    backingContext = backingCanvas.getContext('2d');

    backingCanvas.width = canvas.width;
    backingCanvas.height = canvas.height;

    var img = new Image();
    img.src = "img/earth_surface.jpg"
    img.onload = function() {
        updateFlag = true;
        backingContext.drawImage(img, 0, 0);
    }

    return canvas;
}

function buildPlanet() {

    var radius = 150;
    var segments = 64;
    var rings = 64;

    var geometry = new THREE.SphereGeometry(radius, rings, segments);

    planetSurfaceTexture = new THREE.Texture(initCanvas());

    var surface_material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: planetSurfaceTexture,
        transparent: false
    });
    return new THREE.Mesh(geometry, surface_material);
}

function onWindowResize(event) {
    width = window.innerWidth;
    height = window.innerHeight;

    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.radius = (width + height) / 4;
}

function initGlobe() {

    var parent = document.createElement('div');
    document.body.appendChild(parent);
    var container = document.createElement('div');
    container.id = 'globe';
    container.style.position = 'absolute';
    container.style.top = '0px';
    container.style.left = '0px';
    container.style.width = '100%';
    container.style.textAlign = 'center';
    container.style.color = '#000';
    container.style.backgroundColor = 'transparent';
    container.style.zIndex = '-1';
    parent.appendChild(container);

    renderer = new THREE.WebGLRenderer();
    renderer.autoClear = true;
    renderer.antiAlias = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    var query_value = getQueryParameterByName("debug").toLowerCase();
    if ( query_value == '1' || query_value == 'y' || query_value == 'true' )
        debugMode = true;

    if ( debugMode ) {
        tS = new threeStats( renderer ); // init after WebGLRenderer is created

        rStatsInstance = new rStats( {
            values: {
                frame: { caption: 'Total frame time (ms)', over: 16 },
                fps: { caption: 'Framerate (FPS)', below: 30 },
                calls: { caption: 'Calls (three.js)', over: 3000 },
                drawstorms: { caption: 'Render storms', over: 100 }
            },
            plugins: [
                tS
            ]
        } );
    }

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 300;

    var ambient_light = new THREE.AmbientLight(0xffffff);
    scene.add(ambient_light);

    planetMesh = new buildPlanet();
    scene.add(planetMesh);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.4;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.minDistance = 190;
    controls.maxDistance = 450;
    controls.dynamicDampingFactor = 0.2;

    window.addEventListener('resize', onWindowResize, false);
    document.body.addEventListener('webkitTransitionEnd', transitionEnded, false);
    document.body.addEventListener('transitionend', transitionEnded, false);

    updateFlag = true;
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

function drawStorms(start_date, end_date, min_speed, max_speed, name) {

    var start_date_time = new Date(start_date).getTime();
    var end_date_time = new Date(end_date).getTime();
    var tracks_count = 0;
    var storms_count = 0;
    var storms_to_plot = [];

    for (var i = 0; i < storms.length; ++i) {

        var name_filter_match = false;
        if (name.length === 0) {
            name_filter_match = true;
        } else {
            var storm_name = storms[i][0].toString();
            var regexp = new RegExp(name + ".*", "i");

            if (storm_name.match(regexp) != null) {
                name_filter_match = true;
            }
        }

        var storm_added = false;

        if (name_filter_match) {

            var storm_date_time = new Date(storms[i][1][2]).getTime();

            if (storm_date_time >= start_date_time && storm_date_time <= end_date_time) {

                for (var j = 1; j < storms[i].length; ++j) {

                    var lat = storms[i][j][0];
                    var lng = storms[i][j][1];
                    var date = storms[i][j][2];
                    var wind_kts = storms[i][j][3];
                    if (wind_kts < 0) wind_kts = 0;

                    var x = ((lng) + 180.0) * earthImageWidth / 360;
                    var y = earthImageHeight - (((lat) + 90.0) * earthImageHeight / 180);

                    if (wind_kts >= min_speed && wind_kts <= max_speed) {

                        var plot_col;
                        var plot_size;
                        if (wind_kts < 34) {
                            plot_col = '5ebaff';
                            plot_size = 1;
                        } else if (wind_kts > 35 && wind_kts <= 63) {
                            plot_col = '#00faf4';
                            plot_size = 2;
                        } else if (wind_kts > 64 && wind_kts <= 82) {
                            plot_col = '#ffffcc';
                            plot_size = 3;
                        } else if (wind_kts > 83 && wind_kts <= 95) {
                            plot_col = '#ffe775';
                            plot_size = 4;
                        } else if (wind_kts > 96 && wind_kts <= 112) {
                            plot_col = '#ffc140';
                            plot_size = 5;
                        } else if (wind_kts > 113 && wind_kts <= 136) {
                            plot_col = '#ff8f20';
                            plot_size = 6;
                        } else if (wind_kts > 137) {
                            plot_col = '#ff6060';
                            plot_size = 7;
                        } else {
                            plot_col = '#666';
                            plot_size = 1;
                        }

                        storms_to_plot.push({
                            x: x,
                            y: y,
                            size: plot_size,
                            color: plot_col
                        });

                        tracks_count++;

                        storm_added = true;
                    }
                }
            }
        }

        if (storm_added) storms_count++;
    }

    storms_to_plot.sort(function(a,b) { return parseFloat(b.size) - parseFloat(a.size) } );

    for(var i = 0; i < storms_to_plot.length; ++i ) {
        context.fillStyle = storms_to_plot[i].color;
        context.beginPath();
        context.arc(storms_to_plot[i].x, storms_to_plot[i].y, storms_to_plot[i].size/2, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
    }

    var elem = document.getElementById('controlsNameOptionsStormCount');

    if (elem != null) 
        elem.innerHTML = numberWithCommas(storms_count) + " storms" + "<br>" + numberWithCommas(tracks_count) + " tracks";
}

function drawGuidelines() {
    for (var i = 0; i < 180 / 10; ++i) {
        var y = i / (180 / 10) * earthImageHeight;
        context.strokeStyle = 'rgba(255,0,0,0.5)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(earthImageWidth, y);
        context.stroke();
    }

    for (var i = 0; i < 360 / 10; ++i) {
        var x = i / (360 / 10) * earthImageWidth;
        context.strokeStyle = 'rgba(255,0,0,0.3)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, earthImageHeight);
        context.stroke();
    }

    context.strokeStyle = 'rgba(255,255,0,0.8)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, earthImageHeight / 2);
    context.lineTo(earthImageWidth, earthImageHeight / 2);
    context.stroke();

}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toggleControlsBox() {

    displayControlsBox = !displayControlsBox;

    if (displayControlsBox) {
        document.getElementById('filter-box').style.opacity = 1;
    } else {
        document.getElementById('filter-box').style.opacity = 0;
    }
}

function toggleSpin() {

    autoSpinGlobe = !autoSpinGlobe;

    if (autoSpinGlobe) {
        rotationSpeed = 0.1;
    } else {
        rotationSpeed = 0.0;
    }
}

function toggleHelp() {
    displayHelp = !displayHelp;
    if (displayHelp) {
        document.getElementById('help').style.opacity = 1;
    } else {
        document.getElementById('help').style.opacity = 0;
    }
}

function transitionEnded(event) {
    var elem = document.getElementById(event.srcElement.id);
    if (elem != null) {
        if (elem.style.opacity > 0) elem.style.pointerEvents = "auto";
        else elem.style.pointerEvents = "none";
    }
}

function zoomToStart() {
    new TWEEN.Tween({
        scale: 1
    })
        .to({
        scale: 100
    }, 2500)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onUpdate(function() {
        var true_scale = this.scale / 100;
        planetMesh.scale.set(true_scale, true_scale, true_scale);
    })
        .start();
}

function animate() {

    requestAnimationFrame(animate);

    if ( debugMode ) rStatsInstance( 'fps' ).start();

    if ( updateFlag ) {

        context.drawImage(backingCanvas, 0, 0);

        if (drawGuides) {
            drawGuidelines();
        }

        if ( debugMode ) rStatsInstance( 'drawStorms' ).start();
        
        drawStorms(minDate, maxDate, minWindSpeed, maxWindSpeed, nameFilter);
        
        if ( debugMode ) rStatsInstance( 'drawStorms' ).end();

        planetSurfaceTexture.needsUpdate = true;

        updateFlag = false;
    }

    var delta = clock.getDelta();
    planetMesh.rotation.y += rotationSpeed * delta;

    if ( debugMode ) rStatsInstance( 'frame' ).start();
    
    renderer.render(scene, camera);

    TWEEN.update();

    controls.update();

    if ( debugMode ) rStatsInstance( 'frame' ).end();
    if ( debugMode ) rStatsInstance( 'fps' ).start();

    if ( debugMode ) rStatsInstance().update();
}