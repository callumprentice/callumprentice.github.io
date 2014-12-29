// http://callum.com

var js = document.createElement('script');
js.setAttribute("type", "text/javascript");
js.setAttribute("src", 'http://callum.com/apps/amui/dat.gui.min.js');
js.onload = function() {

    var gui = new dat.GUI();

    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '20px';
    gui.domElement.style.left = '20px'

    scene.traverse(function (node) {

        if ( node instanceof THREE.Mesh ) {

            var node_name = node.name + " - " + node.uuid;

            var folder = gui.addFolder(node_name);
            folder.open();

            var updater = function(n) {
                this.node = n;

                this.scalex = n.scale.x;
                this.scaley = n.scale.y;
                this.scalez = n.scale.z;

                this.rotationx = n.rotation.x * 180.0 / Math.PI;
                this.rotationy = n.rotation.y * 180.0 / Math.PI;
                this.rotationz = n.rotation.z * 180.0 / Math.PI;
            };
            var u = new updater(node);

            var min_scale = 0.0;
            var max_scale = 10.0;
            folder.add(u, 'scalex').min(min_scale).max(max_scale).name("scale X").onChange(function(v){ u.node.scale.x = v; });
            folder.add(u, 'scaley').min(min_scale).max(max_scale).name("scale Y").onChange(function(v){ u.node.scale.y = v; });
            folder.add(u, 'scalez').min(min_scale).max(max_scale).name("scale Z").onChange(function(v){ u.node.scale.z = v; });

            var min_rot = 0.0;
            var max_rot = 360.0;
            folder.add(u, 'rotationx').min(min_rot).max(max_rot).name("rot X").onChange(function(v){ u.node.rotation.x = v * Math.PI / 180.0;});
            folder.add(u, 'rotationy').min(min_rot).max(max_rot).name("rot Y").onChange(function(v){ u.node.rotation.y = v * Math.PI / 180.0;});
            folder.add(u, 'rotationz').min(min_rot).max(max_rot).name("rot Z").onChange(function(v){ u.node.rotation.z = v * Math.PI / 180.0;});
        }
    });
};
document.getElementsByTagName('body')[0].appendChild(js);