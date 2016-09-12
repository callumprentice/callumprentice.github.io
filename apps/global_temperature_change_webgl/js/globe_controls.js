/*
 * Global Warming WebGL Experiment
 * testing controls for viewing a globe - still a lot of work to do!
 * September 2016
 * Callum Prentice / http://callum.com/
 */

var GLOBE_CONTROLS = GLOBE_CONTROLS || {};

GLOBE_CONTROLS = function (parameters) {

    'use strict';

    var _parameters = parameters || {};
    var renderer = parameters.renderer;

    var _target_rotation_x = 0;
    var _target_rotation_on_mouse_down_x = 0;
    var _target_rotation_y = 0;
    var _target_rotation_on_mouse_down_t = 0;
    var _mouse_x = 0;
    var _mouse_x_on_mouse_down = 0;
    var _mouse_y = 0;
    var _mouse_y_on_mouse_down = 0;

    this.init = function () {
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('touchstart', onDocumentTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onDocumentTouchMove, false);
    };

    function onDocumentMouseDown(event) {

        event.preventDefault();

        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.addEventListener('mouseout', onDocumentMouseOut, false);

        _mouse_x_on_mouse_down = event.clientX - window.innerWidth / 2;
        _target_rotation_on_mouse_down_x = _target_rotation_x;

        _mouse_y_on_mouse_down = event.clientY - window.innerHeight / 2;
        _target_rotation_on_mouse_down_t = _target_rotation_y;

        if (!sphere_verts_enabled) {
            anim_globe(false);
        }
    }

    function onDocumentMouseMove(event) {

        _mouse_x = event.clientX - window.innerWidth / 2;
        _mouse_y = event.clientY - window.innerHeight / 2;

        _target_rotation_y = _target_rotation_on_mouse_down_t + (_mouse_y - _mouse_y_on_mouse_down) * 0.01;
        _target_rotation_x = _target_rotation_on_mouse_down_x + (_mouse_x - _mouse_x_on_mouse_down) * 0.01;

    }

    function onDocumentMouseUp(event) {

        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.removeEventListener('mouseout', onDocumentMouseOut, false);

    }

    function onDocumentMouseOut(event) {

        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
        renderer.domElement.removeEventListener('mouseout', onDocumentMouseOut, false);

    }

    function onDocumentTouchStart(event) {

        if (event.touches.length == 1) {
            event.preventDefault();
            _mouse_x_on_mouse_down = event.touches[0].pageX - window.innerWidth / 2;
            _target_rotation_on_mouse_down_x = _target_rotation_x;
            _mouse_y_on_mouse_down = event.touches[0].pageY - window.innerHeight / 2;
            _target_rotation_on_mouse_down_t = _target_rotation_y;
        }
    }

    function onDocumentTouchMove(event) {

        if (event.touches.length == 1) {

            event.preventDefault();

            _mouse_x = event.touches[0].pageX - window.innerWidth / 2;
            _target_rotation_x = _target_rotation_on_mouse_down_x + (_mouse_x - _mouse_x_on_mouse_down) * 0.005;

            _mouse_y = event.touches[0].pageY - window.innerHeight / 2;
            _target_rotation_y = _target_rotation_on_mouse_down_t + (_mouse_y - _mouse_y_on_mouse_down) * 0.005;
        }
    }

    this.update = function (rot_x) {

        var _final_rotation_x = (_target_rotation_y - rot_x);

        if (rot_x <= 1 && rot_x >= -1) {

            rot_x += _final_rotation_x * 0.1;
        }
        if (rot_x > 1) {

            rot_x = 1
        }

        if (rot_x < -1) {

            rot_x = -1
        }

        return rot_x;
    }

    this.get_delta = function (rot_y) {
        return (_target_rotation_x - rot_y) * 0.1;
    }

    this.reset = function (val) {
        _target_rotation_y = _target_rotation_x = val;

    }

    this.init();
};
