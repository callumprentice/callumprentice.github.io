/**
 * @file app.js
 *
 * @brief Visualization of global historical surface temperature
 *        anomalies relative to a 1850-1900 reference period.
 *        Source: see data.js for links to original data
 *
 * @author Callum & Siena Prentice (callum@gmail.com)
 *
 * @license See LICENSE.txt
 *
 * @date October 2023
 */

import * as THREE from './js/three.module.js';
import { CSS2DRenderer, CSS2DObject } from './js/CSS2DRenderer.js';
import CameraControls from './js/camera-controls.module.js';
import { Line2 } from './js/Line2.js';
import { LineMaterial } from './js/LineMaterial.js';
import { LineGeometry } from './js/LineGeometry.js';

window.toggleLabels = toggleLabels;
window.toggleHelp = toggleHelp;

const clock = new THREE.Clock();
const climateDataValueMin = Math.min(...climateData.map((element) => element.value));
const climateDataValueMax = Math.max(...climateData.map((element) => element.value));
const climateDataYearMin = Math.min(...climateData.map((element) => element.year));
const climateDataYearMax = Math.max(...climateData.map((element) => element.year));

let camera;
let cameraControls;
let scene;
let renderer;
let labelRenderer;
let baseObject = new THREE.Object3D();
let params = {
    stackHeight: 10.0,
    lineThickness: 0.05,
    numPointsPerDivision: 12,
    labelYOffsetDeg: 0.25,
    labelsName: 'labels',
};

init();

function init() {
    console.log(`three.js: ${THREE.REVISION}`);

    function getContainer() {
        return document.getElementById('webgl');
    }

    function getContainerSize() {
        const elem = getContainer();

        return {
            width: elem.clientWidth,
            height: elem.clientHeight,
        };
    }

    const ctrSize = getContainerSize();
    camera = new THREE.PerspectiveCamera(30, ctrSize.width / ctrSize.height, 0.01, 2000);

    scene = new THREE.Scene();

    scene.add(baseObject);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(ctrSize.width, ctrSize.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    getContainer().appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(ctrSize.width, ctrSize.height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    getContainer().appendChild(labelRenderer.domElement);

    CameraControls.install({ THREE: THREE });
    cameraControls = new CameraControls(camera, renderer.domElement);
    cameraControls.minPolarAngle = Math.PI / 2.0;
    cameraControls.maxPolarAngle = Math.PI / 2.0;
    cameraControls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    cameraControls.mouseButtons.middle = CameraControls.ACTION.NONE;
    cameraControls.mouseButtons.right = CameraControls.ACTION.NONE;
    cameraControls.mouseButtons.wheel = CameraControls.ACTION.NONE;
    cameraControls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
    cameraControls.touches.two = CameraControls.ACTION.TOUCH_NONE;
    cameraControls.touches.three = CameraControls.ACTION.TOUCH_NONE;
    cameraControls.addEventListener('update', function (e) {
        baseObject.rotation.copy(camera.rotation);
    });

    const ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);

    renderer.setAnimationLoop(function () {
        const delta = clock.getDelta();
        cameraControls.update(delta);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    });

    window.addEventListener(
        'resize',
        function () {
            const ctrSize = getContainerSize();
            camera.aspect = ctrSize.width / ctrSize.height;
            camera.updateProjectionMatrix();
            renderer.setSize(ctrSize.width, ctrSize.height);
            labelRenderer.setSize(ctrSize.width, ctrSize.height);
        },
        false,
    );

    addSpiral();
}

function addSpiral() {
    const colorPalette = [
        '#08306b',
        '#08519c',
        '#2171b5',
        '#4292c6',
        '#6baed6',
        '#9ecae1',
        '#c6dbef',
        '#deebf7',
        '#fee0d2',
        '#fcbba1',
        '#fc9272',
        '#fb6a4a',
        '#ef3b2c',
        '#cb181d',
        '#a50f15',
        '#67000d',
    ];

    const baseRadius = Math.ceil(Math.abs(climateDataValueMin));
    let rawPoints = [];

    climateData.forEach(function (data, index) {
        let month = index % 12;

        const angle = (month / 12) * Math.PI * 2.0;

        const pointRadius = baseRadius + data.value;
        const x = pointRadius * Math.sin(angle);
        const y = 0;
        const z = pointRadius * Math.cos(angle);

        rawPoints.push(new THREE.Vector3(x, y, z));
    });

    const isClosed = false;
    const curve = new THREE.CatmullRomCurve3(rawPoints, isClosed);
    const smoothedPoints = curve.getPoints(params.numPointsPerDivision * climateData.length);

    let positions = [];
    let colors = [];

    let colorRange = chroma.scale(colorPalette).domain([climateDataValueMin, climateDataValueMax]);

    smoothedPoints.forEach(function (point, index) {
        const x = point.x;
        const y = -params.stackHeight / 2 + (index / smoothedPoints.length) * params.stackHeight;
        const z = point.z;
        positions.push(x, y, z);

        const color = new THREE.Color();
        let magnitude = Math.sqrt(x * x + z * z) - baseRadius;
        color.set(colorRange(magnitude).hex());
        colors.push(color.r, color.g, color.b);
    });

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const lineMaterial = new LineMaterial({
        linewidth: params.lineThickness / 10,
        vertexColors: true,
    });
    const spiral = new Line2(geometry, lineMaterial);
    scene.add(spiral);

    addLabels(baseRadius);

    let entireBoundingBox = new THREE.Box3().setFromObject(spiral);
    const padding = 0.5;
    const animateTransition = true;
    cameraControls.rotateTo(0, Math.PI / 2, animateTransition);
    cameraControls.fitToBox(entireBoundingBox, animateTransition, {
        paddingLeft: padding,
        paddingRight: padding,
        paddingBottom: padding,
        paddingTop: padding,
    });
}

function addLabels(baseRadius) {
    let x_0_0 = (baseRadius + 0.0) * Math.cos(0.0);
    addLine(x_0_0, -params.stackHeight / 2, 0.0, x_0_0, params.stackHeight / 2, 0.0, 0x9999ff, 0xff9999);
    addLabel('0°C', x_0_0, -params.stackHeight / 2 - params.labelYOffsetDeg, 0.0);
    x_0_0 = (baseRadius + 0.0) * Math.cos(Math.PI);
    addLine(x_0_0, -params.stackHeight / 2, 0.0, x_0_0, params.stackHeight / 2, 0.0, 0x09999ff, 0xff9999);
    addLabel('0°C', x_0_0, -params.stackHeight / 2 - params.labelYOffsetDeg, 0.0);

    let x_1_0 = (baseRadius + 1.0) * Math.cos(0.0);
    addLine(x_1_0, -params.stackHeight / 2, 0.0, x_1_0, params.stackHeight / 2, 0.0, 0x9999ff, 0xff9999);
    addLabel('+1°C', x_1_0, -params.stackHeight / 2 - params.labelYOffsetDeg, 0.0);
    x_1_0 = (baseRadius + 1.0) * Math.cos(Math.PI);
    addLine(x_1_0, -params.stackHeight / 2, 0.0, x_1_0, params.stackHeight / 2, 0.0, 0x9999ff, 0xff9999);
    addLabel('+1°C', x_1_0, -params.stackHeight / 2 - params.labelYOffsetDeg, 0.0);

    const angle = 0;
    const yearGranuality = 10;
    let pointRadius;
    for (let year = climateDataYearMin; year <= climateDataYearMax; year += yearGranuality) {
        pointRadius = baseRadius + climateData[(year - climateDataYearMin) * 12].value;

        const x = pointRadius * Math.sin(angle);
        const y =
            ((year - climateDataYearMin) / (climateDataYearMax - climateDataYearMin)) * params.stackHeight -
            params.stackHeight / 2;
        const z = pointRadius * Math.cos(angle);
        addLabel(year.toString(), x, y, z);
    }
    pointRadius = baseRadius + climateData[(climateDataYearMax - climateDataYearMin) * 12].value;
    const x = pointRadius * Math.sin(angle);
    const y = params.stackHeight / 2;
    const z = pointRadius * Math.cos(angle);
    addLabel(climateDataYearMax.toString(), x, y, z);
}

function addLabel(text, x, y, z) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = text;
    const label = new CSS2DObject(labelDiv);
    label.position.set(x, y, z);
    label.name = params.labelsName;
    baseObject.add(label);
}

function addLine(x1, y1, z1, x2, y2, z2, color1, color2) {
    let col1 = new THREE.Color(color1);
    let col2 = new THREE.Color(color2);

    let positions = [x1, y1, z1, x2, y2, z2];
    let colors = [col1.r, col1.g, col1.b, col2.r, col2.g, col2.b];

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const lineMaterial = new LineMaterial({
        linewidth: 0.0025,
        vertexColors: true,
    });

    const line = new Line2(geometry, lineMaterial);
    line.name = 'label';
    baseObject.add(line);
}

function toggleLabels(forcehide) {
    scene.traverse(function (o) {
        if (o.name == params.labelsName) {
            if (forcehide) {
                o.visible = false;
            } else {
                if (o.visible) {
                    o.visible = false;
                } else {
                    o.visible = true;
                }
            }
        }
    });
}

function toggleHelp() {
    const elem = document.getElementById('help');
    var labels = document.querySelectorAll('.label');
    if (elem.style.display == 'block') {
        elem.style.display = 'none';
        for (let i = 0; i < labels.length; i++) {
            labels[i].style.color = '#aaffaa';
        }
    } else {
        elem.style.display = 'block';
        for (let i = 0; i < labels.length; i++) {
            labels[i].style.color = 'rgba(0.0, 0.0, 0.0, 0.1)';
        }
    }
}
