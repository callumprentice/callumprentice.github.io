/*****************************************************************************

    Second Life 360 Snapshot Viewer
    Author: Callum Prentice (callum@lindenlab.com)

    Copyright (c) 2013, Linden Research, Inc.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

*****************************************************************************/

var camera, scene, renderer, equiManaged;
var webGLCanvasHeight = window.innerHeight;
var uiClosed = true;
var uiOpenScale = 0;
var uiHeight = 400;
var preview_url = "";
var snapshot_title = "";
var auto_rotate_speed = 0.03;

function app() {
    init();
    animate();
}

function init() {

    show_loading(true);

    parse_url_params();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x333366, 1.0);
    renderer.setSize(window.innerWidth, webGLCanvasHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 800);
    camera.position.z = 200;

    equi_managed = new CubemapToEquirectangular(renderer, true);

    controls = new THREE.OrbitControls(camera);
    controls.autoRotate = true;
    controls.autoRotateSpeed = auto_rotate_speed;
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.05;
    controls.enablePan = false;
    controls.enableZoom = false;

    window.addEventListener('resize', on_window_resize, false);
}

function parse_url_params() {
    if (get_query_parameter_by_name("preview")
        .length > 0) {
        var current_url = window.location.href;
        preview_url = current_url.replace("preview=", "");
        remove_element('help_div');
        remove_element('export_equirectangular_div');
        remove_element('settings_div');
        remove_element('full_screen_div');
        document.getElementById("title_div")
            .style.width = "100%";
        document.getElementById("title_div")
            .style.fontSize = "20px";
        document.getElementById("title_text_div")
            .style.top = "10px";
    }

    if (isMobile.any) {
        preview_url = "http://secondlife.com"
        remove_element('help_div');
        remove_element('export_equirectangular_div');
        remove_element('settings_div');
        remove_element('full_screen_div');
        document.getElementById("title_div")
            .style.width = "100%";
        document.getElementById("title_div")
            .style.fontSize = "20px";
        document.getElementById("title_text_div")
            .style.top = "10px";
    }

    var show_location = "./shots/default.zip";
    if (get_query_parameter_by_name("shot")
        .length > 0) {
        show_location = get_query_parameter_by_name("shot");
    }
    add_content(show_location);

    if (get_query_parameter_by_name("ars")
        .length > 0) {
        auto_rotate_speed = parseFloat(get_query_parameter_by_name("ars"));
    }
}

function on_window_resize() {

    webGLCanvasHeight = window.innerHeight - uiHeight * uiOpenScale;
    camera.aspect = window.innerWidth / webGLCanvasHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, webGLCanvasHeight);
    document.getElementById('ui_div')
        .style.height = (window.innerHeight - webGLCanvasHeight) + 'px';
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

function get_query_parameter_by_name(name) {
    name = name.replace(/[\[]/, "\\\[")
        .replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null) {
        return "";
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
}

function full_screen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}

function show_help_contents(id) {
    document.getElementById('about_app_text')
        .className = "hide help_contents mouse_off";
    document.getElementById('about_snap_text')
        .className = "hide help_contents mouse_off";
    document.getElementById('controls_text')
        .className = "hide help_contents mouse_off";

    var element = document.getElementById(id);
    if (element) {
        document.getElementById(id)
            .className = "show help_contents mouse_on";
    }
}

function show_loading(state) {

    var element = document.getElementById('loading_holder');

    if (state) {
        element.className = 'show';
        element.style.pointerEvents = 'auto';

    } else {
        element.className = 'hide';
        element.style.pointerEvents = 'none';
    }
}

function export_equirectangular() {

    // replace potential junk (non letter/number) in Region name with '_' and
    // make sure there aren't lots of '__'
    var valid_name = snapshot_title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    valid_name = valid_name.replace(/\_\_/g, '_');
    var suggested_filename = "sl360_";
        suggested_filename += valid_name;
        suggested_filename += ".jpg";

    equi_managed.update(camera, scene, suggested_filename);
}

function remove_element(id) {
    return (elem = document.getElementById(id))
        .parentNode.removeChild(elem);
}

function show_help(visible) {
    if (visible) {
        document.getElementById("about_box_bkg")
            .className = "show";
        document.getElementById("about_box")
            .className = "show";
        document.getElementById("about_box")
            .style.pointerEvents = "all";

        show_help_contents("about_app_text");

    } else {
        document.getElementById("about_box_bkg")
            .className = "hide";
        document.getElementById("about_box")
            .className = "hide";
        document.getElementById("about_box")
            .style.pointerEvents = "none";

        show_help_contents("none");
    }
}

function update_info(info) {

    document.title = "Second Life 360 Snapshot - " + info.title;

    var elem = document.getElementById("title_text_div");
    if (elem) {
        elem.innerHTML = info.title;
    }

    elem = document.getElementById("title_link");
    if (elem) {
        if (preview_url.length > 0) {
            elem.setAttribute("href", preview_url);
        } else {
            elem.setAttribute("href", info.url);
        }
    }

    // update Help -> Snapshot
    elem = document.getElementById("snap_info_title");
    if (elem && info.title != undefined) {
        elem.innerHTML = "<i>Title</i>:&nbsp;&nbsp;&nbsp;" + info.title;
    }

    elem = document.getElementById("snap_info_url");
    if (elem && info.url != undefined) {
        elem.innerHTML = "<i>URL</i>:&nbsp;&nbsp;&nbsp;" + "<a href='" + info.url + "' target='_new'>" + info.url + "</a>";
    }

    elem = document.getElementById("snap_info_version");
    if (elem && info.version != undefined) {
        elem.innerHTML = "<i>Version</i>:&nbsp;&nbsp;&nbsp;" + info.version;
    }

    elem = document.getElementById("snap_info_capture_time");
    if (elem && info.capture_time != undefined) {
        elem.innerHTML = "<i>Time</i>:&nbsp;&nbsp;&nbsp;" + info.capture_time;
    }

    elem = document.getElementById("snap_info_format");
    if (elem && info.format != undefined) {
        elem.innerHTML = "<i>Format</i>:&nbsp;&nbsp;&nbsp;" + info.format;
    }
}

function overlay_fatal_error(msg) {

    show_loading(false);

    // background to all errors
    var element = document.createElement("div");
    element.className = "error_msg_bkg";
    document.body.appendChild(element);

    // red for fatal errors - others to follow
    element = document.createElement("div");
    element.className = "fatal_error_msg";
    element.innerHTML = "<h3>360 Snapshot error</h3>";
    element.innerHTML += msg;

    document.body.appendChild(element);
}

function add_content(zip_file) {

    var texture_urls = [];

    JSZipUtils.getBinaryContent(zip_file, function (err, data) {
        if (err) {
            console.error("error reading file", err);
            overlay_fatal_error(err);
            return;
        }

        JSZip.loadAsync(data)
            .then(function (zip) {

                zip.file("info.json")
                    .async("text")
                    .then(function (json) {
                        var info = JSON.parse(json);
                        snapshot_title = info.title;
                        update_info(info);

                        var filenames = ['posx.png', 'negx.png', 'posy.png', 'negy.png', 'posz.png', 'negz.png'];

                        // addition of this field coincides with change to jpeg files.
                        if (info.format === 'jpeg') {
                            filenames = ['posx.jpeg', 'negx.jpeg', 'posy.jpeg', 'negy.jpeg', 'posz.jpeg', 'negz.jpeg'];
                        }
                        filenames.forEach(function (filename) {
                            zip.file(filename)
                                .async("blob")
                                .then(function (blob) {
                                    var texture_url = URL.createObjectURL(blob);

                                    var img_holder = document.getElementById('image_list_div');
                                    var image = document.createElement('img');
                                    image.setAttribute("width", "400px");
                                    image.src = texture_url;
                                    img_holder.appendChild(image);

                                    texture_urls[filenames.indexOf(filename)] = texture_url;
                                    if (texture_urls.filter(function (x) {
                                            return x;
                                        })
                                        .length === 6) {
                                        scene.background = new THREE.CubeTextureLoader()
                                            .load(texture_urls);
                                        show_loading(false);
                                    }
                                });
                        });
                    });

            }, function (e) {
                console.error("error decoding data", e);
                overlay_fatal_error(e);
            });
    });
}

function toggle_ui() {
    var start_scale = 0.0;
    var end_scale = 0.0;

    if (uiClosed) {
        start_scale = 0.0;
        end_scale = 1.0;
        uiClosed = false;
    } else {
        start_scale = 1.0;
        end_scale = 0.0;
        uiClosed = true;
    }

    new TWEEN.Tween({
            scale: start_scale
        })
        .to({
            scale: end_scale
        }, 500)
        .easing(TWEEN.Easing.Quartic.InOut)
        .onStart(function () {
            if (uiClosed) {
                document.getElementById('settings_button')
                    .src = 'img/settings_closed.png';
            } else {
                document.getElementById('settings_button')
                    .src = 'img/settings_open.png';
            }
        })
        .onUpdate(function () {
            uiOpenScale = this.scale;
            on_window_resize();
        })
        .start();
}
