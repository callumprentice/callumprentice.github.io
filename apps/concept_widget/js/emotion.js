emotionWidget = function(values, colors, inner_radius, outer_radius) {

    var _colors = colors;
    var _inner_radius = inner_radius;
    var _outer_radius = outer_radius;
    var _cur_angle = 0.0;
    var _sector_spacing = (Math.PI * 2) / 100.0;   
    var _widget_group = 0;
    var _cur_values = values.slice(0);
    var emotion_tag = "Emotion";
    var projector = new THREE.Projector;

    ////////////////////////////////////////////////////////////////////////////////
    //
    createWidget(_cur_values);

    ////////////////////////////////////////////////////////////////////////////////
    //
    function createWidget(values) {

        if ( _widget_group != 0 ) {
            var geometry_for_deletion = [];

            _widget_group.traverse(function (node) {

                if (node instanceof THREE.Mesh && node.userData == emotion_tag) {
                    geometry_for_deletion.push(node);
                }
            });

            for (var each = 0; each < geometry_for_deletion.length; ++each) {
                geometry_for_deletion[each].parent.remove(geometry_for_deletion[each]);
            }
        }
        else {
            _widget_group = new THREE.Object3D();

                var background_material = new THREE.MeshBasicMaterial( { color:0xffffff, side: THREE.DoubleSide, overdraw: true } );
                var radius_circle = _inner_radius * 0.95;
                var num_sides_circle = 96;
                var background_geom = new THREE.CircleGeometry( radius_circle, num_sides_circle, 0, Math.PI * 2 );
                var background_mesh = new THREE.Mesh( background_geom, background_material);

            _widget_group.add(background_mesh);
        }

        var total_value = 0;
        for (var i = 0; i < values.length; ++i) {
            total_value += values[i];
        };

        for (var i = 0; i < values.length; ++i) {

            var angle_1 = _cur_angle;
            var angle_2 = _cur_angle + (values[i] / total_value) *
                                ( Math.PI * 2 - ( values.length ) * _sector_spacing );
            var name = "Emotion" + i.toString();
            var mesh = createSegment(angle_1, angle_2, _inner_radius, outer_radius, _colors[i], name);
            _widget_group.add(mesh);

            _cur_angle = angle_2 + _sector_spacing;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //    
    function createSegment(begin_angle, end_angle, _inner_radius, outer_radius, color, name) {

        var sector_pts = [];

        var num_verts_per_arc = 16;

        for (var j = 0; j < num_verts_per_arc; ++j) {
            var a = begin_angle + (j / (num_verts_per_arc - 1)) * (end_angle - begin_angle);
            var x = outer_radius * Math.cos(a);
            var y = outer_radius * Math.sin(a);
            sector_pts.push(new THREE.Vector2(x, y));
        }

        for (var j = 0; j < num_verts_per_arc; ++j) {
            var a = end_angle - (j / (num_verts_per_arc - 1)) * (end_angle - begin_angle);
            var x = _inner_radius * Math.cos(a);
            var y = _inner_radius * Math.sin(a);
            sector_pts.push(new THREE.Vector2(x, y));
        }

        var sector_shape = new THREE.Shape(sector_pts);

        var geometry = new THREE.ShapeGeometry(sector_shape);

        var material = new THREE.MeshBasicMaterial({
            color: color,
            overdraw: true
        });
        material.side = THREE.DoubleSide;

        var segment_mesh = new THREE.Mesh(geometry, material);

        segment_mesh.name = name;
        segment_mesh.userData = emotion_tag;

        return segment_mesh;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    this.getParent = function() {
        return _widget_group;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    this.updateValues = function(new_values) {

        if ( new_values.length != values.length ) {
            console.error("Different number of values in update not allowed");
            return;
        }

        var tween_values = _cur_values.slice(0);

        new TWEEN.Tween({ val: 0 })
            .to({ val: 1 }, 500)
            .easing(TWEEN.Easing.Circular.InOut)
            .onUpdate(function () {

                for(var i=0; i < tween_values.length;++i) {
                    tween_values[i] = _cur_values[i] + ( new_values[i] - _cur_values[i] ) * this.val;
                }

                createWidget(tween_values);
            })
            .onComplete(function () {
                _cur_values = tween_values.slice(0);
            }).start();
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    this.checkClick = function(event, is_touch_event) {

        if ( is_touch_event ) {

            mouseX = (event.touches[0].pageX / window.innerWidth ) * 2 - 1;
            mouseY = -(event.touches[0].pageY / window.innerHeight ) * 2 + 1;

        } else {

            mouseX = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouseY = -( event.clientY / window.innerHeight ) * 2 + 1;
        }

        var vector = new THREE.Vector3( mouseX, mouseY, -1);

        projector.unprojectVector( vector, camera );
        
        var raycaster = new THREE.Raycaster(camera.position, vector.sub( camera.position ).normalize());

        document.getElementById("intersects").innerHTML="";
        _widget_group.traverse(function (node) {
            if (node instanceof THREE.Mesh && node.userData == emotion_tag) {
                var intersects = raycaster.intersectObject(node);
                if ( intersects.length > 0 ) {
                    document.getElementById("intersects").innerHTML=node.name;
                }
            }
        });
    }
};
