/**
 * @file app.js
 *
 * @author Callum Prentice (callum@gmail.com)
 *
 * @contributors PanonNom: - Spite (https://clicktorelease.com)
 *
 * @date May 2022
 */

import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";
import { GoogleStreetViewLoader, getIdFromURL } from "./PanomNom/src/PanomNom.js";
import { GoogleStreetViewDepthLoader } from "./PanomNom/src/GoogleStreetViewDepthLoader.js";
import Stats from "./stats.module.js";

window.replaceSceneIndex = replaceSceneIndex;
window.openCurrentStreetView = openCurrentStreetView;

let scene, renderer, camera, controls, stats;
const depthLoader = new GoogleStreetViewDepthLoader();
const imageLoader = new GoogleStreetViewLoader();
const pointsMaterial = new THREE.PointsMaterial({
    size: 12,
    vertexColors: true,
    sizeAttenuation: false,
});

let sv_urls = [
    "https://www.google.com/maps/@48.870696,2.3323723,3a,75y,186.22h,85.57t/data=!3m6!1e1!3m4!1sHTEsfpLjZ1Z1xMNECwU9wA!2e0!7i16384!8i8192",
    "https://www.google.com/maps/@37.8002369,-122.40143,3a,75y,258.08h,91.28t/data=!3m7!1e1!3m5!1s42qaC8f7Pz-PzDErCEWTfA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3D42qaC8f7Pz-PzDErCEWTfA%26cb_client%3Dsearch.revgeo_and_fetch.gps%26w%3D96%26h%3D64%26yaw%3D184.47023%26pitch%3D0%26thumbfov%3D100!7i16384!8i8192",
    "https://www.google.com/maps/@41.4040541,2.1752232,3a,75y,234.91h,91.16t/data=!3m6!1e1!3m4!1sRkp48IBIKSyEXUM9TRoKPg!2e0!7i16384!8i8192",
    "https://www.google.com/maps/@51.5148282,-0.080013,3a,75y,209.89h,117.34t/data=!3m7!1e1!3m5!1sX3hvhJ5yCyYMHqcI73cGKQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3DX3hvhJ5yCyYMHqcI73cGKQ%26cb_client%3Dsearch.revgeo_and_fetch.gps%26w%3D96%26h%3D64%26yaw%3D198.10841%26pitch%3D0%26thumbfov%3D100!7i16384!8i8192",
    "https://www.google.com/maps/@22.2812943,114.1569259,3a,75y,168.16h,104.05t/data=!3m6!1e1!3m4!1sXpsRi2S8Fy3iUGXsC1UJ2w!2e0!7i16384!8i8192",
];
var curIndex = 0;

function init() {
    console.log(`three.js: ${THREE.REVISION}`);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0001, 1000);
    camera.position.set(0.000001, 0, 0.000001);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.dom.style.left = "";
    stats.dom.style.right = "0";
    container.appendChild(stats.dom);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = -1.0;

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    renderer.setAnimationLoop(function () {
        controls.update();

        renderer.render(scene, camera);
        stats.update();
    });

    window.addEventListener(
        "resize",
        function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        false
    );

    replaceSceneIndex(curIndex);
}

function parseURL(sv_url) {
    const url = decodeURIComponent(sv_url);
    let pov = url.match(/,([0-9.]+)y,([0-9.]+)h,([0-9.]+)t/);
    let heading = 0;
    let pitch = 0;
    let lat = sv_url.split("@")[1].split("z")[0].split(",")[0];
    let lng = sv_url.split("@")[1].split("z")[0].split(",")[1];

    if (pov) {
        heading = Number(pov[2]);
        pitch = Number(pov[3]);
    } else {
        console.warn(`No heading/pitch found for this URL`);
    }

    return {
        heading: heading,
        pitch: pitch,
        lat: lat,
        lng: lng,
    };
}

function openCurrentStreetView() {
    window.open(sv_urls[curIndex]);
}

async function replaceSceneIndex(index) {
    curIndex = index;

    let panoid = getIdFromURL(sv_urls[curIndex]);
    let view_info = parseURL(sv_urls[curIndex]);

    await imageLoader.load(panoid, 0);
    const image_canvas = imageLoader.canvas;
    const metadata = imageLoader.metadata;

    const image_canvas_ctx = image_canvas.getContext("2d");
    const image_colors = image_canvas_ctx.getImageData(0, 0, image_canvas.width, image_canvas.height).data;

    let copyright_div = document.getElementById("copyright");
    copyright_div.innerHTML = `${metadata.location.description} : Street View data ${metadata.copyright}`;

    const depth_map = await depthLoader.load(panoid);

    let positions = [];
    let colors = [];

    for (let y = 0; y < depth_map.height; y += 1) {
        let cf_b = -0.5 * Math.PI + (1 * y * Math.PI) / (depth_map.height - 1);
        let color_v = parseInt((y * image_canvas.height) / depth_map.height - 1);

        for (let x = 0; x < depth_map.width; x += 1) {
            let cf_a = (2 * x * Math.PI) / (depth_map.width - 1);

            let depth_distance = depth_map.depthMap[y * depth_map.width + x];

            let xp = depth_distance * Math.cos(cf_a) * Math.cos(cf_b);
            let yp = depth_distance * Math.sin(cf_a) * Math.cos(cf_b);
            let zp = depth_distance * Math.sin(cf_b);

            positions.push(xp, -zp, yp);

            let color_u = parseInt((x * image_canvas.width) / depth_map.width - 1);
            const color_depth = 4;
            let rc = image_colors[image_canvas.width * color_depth * color_v + color_u * color_depth + 0] / 0xff;
            let gc = image_colors[image_canvas.width * color_depth * color_v + color_u * color_depth + 1] / 0xff;
            let bc = image_colors[image_canvas.width * color_depth * color_v + color_u * color_depth + 2] / 0xff;

            colors.push(rc, gc, bc);
        }
    }

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    let existing_points = scene.getObjectByName("STREET_VIEW");
    scene.remove(existing_points);

    let points = new THREE.Points(geometry, pointsMaterial);
    points.name = "STREET_VIEW";
    scene.add(points);

    let pitch_radians = ((view_info.pitch + metadata.tiles.originPitch - 90.0) * Math.PI) / 180.0;
    let yaw_radians = ((metadata.tiles.originHeading - view_info.heading + 90.0) * Math.PI) / 180.0;
    let roll_radians = 0.0;

    controls.enabled = false;
    camera.rotation.reorder("YXZ");
    camera.rotation.set(pitch_radians, yaw_radians, roll_radians);
    let spherical_target = new THREE.Spherical(1, Math.PI / 2 - pitch_radians, yaw_radians + Math.PI);
    controls.target = new THREE.Vector3().setFromSpherical(spherical_target);
    controls.update();
    controls.enabled = true;
}

init();
