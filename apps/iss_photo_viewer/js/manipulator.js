// ISS PHoto Viewer - globe manipulator (http://callum.com) 2014

globe_manipulator = function(params) {
    var _dom_object = params.dom_object;
    var _camera = params.camera;
    var _radius = params.radius;
    var _on_clicked_callback = params.on_clicked_callback;
    var _right_click_to_select = params.right_click_to_select;
    var _min_distance = params.min_distance;
    var _max_distance = params.max_distance;
    var _camera_position = {
        x: 0.0,
        y: 0.0,
        z: 0.0
    };
    var _mouse_pos_on_down = {
        x: 0,
        y: 0
    };
    var _target_on_down = {
        x: 0.0,
        y: 0.0
    };
    var _start_lat = params.start_lat;
    var _start_lng = params.start_lng;
    var _start_distance = params.start_distance;
    var _auto_rotate = params.auto_rotate;
    var _distance = 0;
    var _distance_target = 0;
    var _rotation = {
        x: 0.0,
        y: 0.0
    };
    var _target = {
        x: 0.0,
        y: 0.0
    };
    var motion_scaling_factor = 0.1;
    var _smoothing_factor = 0.1;
    var _wheel_scaling = 0.1;
    var _navigation_enabled = true;
    var _mesh = params.mesh;
    var camera_target = new THREE.Vector3(0, 0, 0);
    var projector = new THREE.Projector();
    if (_right_click_to_select) {
        document.oncontextmenu = document.body.oncontextmenu = function() {
            return false;
        }
    }
    this.reset = function() {
        this.set_lat_lng(_start_lat, _start_lng);
        this.set_distance(_start_distance);
    }
    this.update = function() {
        if (_auto_rotate) {
            _target.x += 0.001;
            if (_target.x > Math.PI * 2.0) {
                _target.x = 0.0;
            }
            _rotation.x = _target.x;
        } else {
            _rotation.x += (_target.x - _rotation.x) * _smoothing_factor;
            _rotation.y += (_target.y - _rotation.y) * _smoothing_factor;
        }
        _distance += (_distance_target - _distance) * _smoothing_factor;
        _camera.position.x = _distance * Math.sin(_rotation.x) * Math.cos(_rotation.y);
        _camera.position.y = _distance * Math.sin(_rotation.y);
        _camera.position.z = _distance * Math.cos(_rotation.x) * Math.cos(_rotation.y);
        _camera.lookAt(camera_target);
        _camera.aspect = window.innerWidth / webgl_canvas_height;
        _camera.updateProjectionMatrix();
    }
    this.set_navigation_enabled = function(enabled) {
        _navigation_enabled = enabled;
    }
    this.set_lat_lng = function(lat, lng) {
        _target.x = (lng + 90) * Math.PI / 180.0;
        _target.y = lat * Math.PI / 180.0;
    }
    this.set_distance = function(distance) {
        _distance_target = distance;
    }

    function _on_mouse_down(event) {
        if (!_navigation_enabled) return;
        _dom_object.addEventListener('mousemove', _on_mouse_move, false);
        _dom_object.addEventListener('mouseup', _on_mouse_up, false);
        _dom_object.addEventListener('mouseout', _on_mouse_out, false);
        _mouse_pos_on_down.x = -event.clientX;
        _mouse_pos_on_down.y = event.clientY;
        _target_on_down.x = _target.x;
        _target_on_down.y = _target.y;
        if (_right_click_to_select && event.button != 2) {
            _dom_object.style.cursor = 'move';
        }
        if (_on_clicked_callback) lat_lng_from_mouse_pos(event);
        _auto_rotate = false;
    }

    function _on_mouse_move(event) {
        if (!_navigation_enabled) return;
        if (_right_click_to_select && event.button == 2) {
            return;
        }
        var pos = {
            x: -event.clientX,
            y: event.clientY
        };
        var distance_range = _max_distance - _min_distance;
        var scaled_distance = ((_distance - _min_distance) / distance_range) * 0.9 + 0.1;
        var motion_scaling = (scaled_distance * motion_scaling_factor) / _distance;
        _target.x = _target_on_down.x + (pos.x - _mouse_pos_on_down.x) * motion_scaling;
        _target.y = _target_on_down.y + (pos.y - _mouse_pos_on_down.y) * motion_scaling;
        _target.y = _target.y > Math.PI / 2 ? Math.PI / 2 : _target.y;
        _target.y = _target.y < -Math.PI / 2 ? -Math.PI / 2 : _target.y;
    }

    function lat_lng_from_mouse_pos(event) {
        var mouse_x = (event.clientX / window.innerWidth) * 2 - 1;
        var mouse_y = -(event.clientY / webgl_canvas_height) * 2 + 1;
        var vector = new THREE.Vector3(mouse_x, mouse_y, -1);
        projector.unprojectVector(vector, _camera);
        var raycaster = new THREE.Raycaster(_camera.position, vector.sub(_camera.position).normalize());
        var intersects = raycaster.intersectObject(_mesh);
        if (intersects.length > 0) {
            var click_event = {
                mouse_event: event,
                intersects: true,
                point: intersects[0].point,
                lat: 90.0 - Math.acos(intersects[0].point.y / _radius) * 180.0 / Math.PI,
                lng: -(Math.atan2(intersects[0].point.z, intersects[0].point.x) * 180.0 / Math.PI)
            }
        } else {
            var click_event = {
                intersects: false
            }
        }
        if (_on_clicked_callback) {
            if (event.button === 2) {
                if (_right_click_to_select) {
                    _on_clicked_callback(click_event);
                }
            }
        }
    }

    function _on_mouse_up(event) {
        if (!_navigation_enabled) return;
        _dom_object.removeEventListener('mousemove', _on_mouse_move, false);
        _dom_object.removeEventListener('mouseup', _on_mouse_up, false);
        _dom_object.removeEventListener('mouseout', _on_mouse_out, false);
        _dom_object.style.cursor = 'auto';
    }

    function _on_mouse_out() {
        if (!_navigation_enabled) return;
        _dom_object.removeEventListener('mousemove', _on_mouse_move, false);
        _dom_object.removeEventListener('mouseup', _on_mouse_up, false);
        _dom_object.removeEventListener('mouseout', _on_mouse_out, false);
        _dom_object.style.cursor = 'auto';
    }

    function _on_mouse_wheel(event) {
        if (!_navigation_enabled) return;

        _distance_target -= ( event.deltaY && event.deltaY / Math.abs(event.deltaY) ) * _wheel_scaling;
        _distance_target = _distance_target > _max_distance ? _max_distance : _distance_target;
        _distance_target = _distance_target < _min_distance ? _min_distance : _distance_target;
    }
    this._on_key_down = function(event) {
        if (!_navigation_enabled) return;
        if (event.keyCode === 27) {
            globe_manipulator.reset();
            event.preventDefault();
        }
        if (event.keyCode === 32) {
            _auto_rotate = !_auto_rotate;
            event.preventDefault();
        }
    }
    _dom_object.addEventListener('mousedown', _on_mouse_down, false);
    document.addEventListener('keydown', this._on_key_down, false);
    document.addEventListener('wheel', _on_mouse_wheel, false);
    this.reset();
}