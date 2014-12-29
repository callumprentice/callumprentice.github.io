function cpPlanet(params) {

	this.planet_radius = 100;
	if (typeof (params.planet_radius) != "undefined") {
		this.planet_radius = params.planet_radius;
	}

	this.cloud_radius = this.planet_radius * 1.02;
	if (typeof (params.cloud_radius) != "undefined") {
		this.cloud_radius = params.cloud_radius;
	}

	this.cloud_scale = this.cloud_radius / this.planet_radius;

	this.planet_tilt = 0;
	if (typeof (params.planet_tilt) != "undefined") {
		this.planet_tilt = params.planet_tilt;
	}

	this.planet_geom_segments = 50;
	if (typeof (params.planet_geom_segments) != "undefined") {
		this.planet_geom_segments = params.planet_geom_segments;
	}

	this.planet_geom_rings = 50;
	if (typeof (params.planet_geom_rings) != "undefined") {
		this.planet_geom_rings = params.planet_geom_rings;
	}

	this.planet_surface_texture = "";
	if (typeof (params.planet_surface_texture) != "undefined") {
		this.planet_surface_texture = params.planet_surface_texture;
	}
	
	this.planet_cloud_texture = "";
	if (typeof (params.planet_cloud_texture) != "undefined") {
		this.planet_cloud_texture = params.planet_cloud_texture;
	}

	this.planet_normals_texture = "";
	if (typeof (params.planet_normals_texture) != "undefined") {
		this.planet_normals_texture = params.planet_normals_texture;
	}

	this.planet_specular_texture = "";
	if (typeof (params.planet_specular_texture) != "undefined") {
		this.planet_specular_texture = params.planet_specular_texture;
	}

	this.use_surface_shader = false;
	if (typeof (params.use_surface_shader) != "undefined") {
		this.use_surface_shader = params.use_surface_shader;
	}

	this.create_combined_mesh = false;
	if (typeof (params.create_combined_mesh) != "undefined") {
		this.create_combined_mesh = params.create_combined_mesh;
	}

	this.geometry = new THREE.SphereGeometry(this.planet_radius, this.planet_geom_segments, this.planet_geom_rings);
	this.geometry.computeTangents();

	this.shader = THREE.ShaderUtils.lib.normal;
	this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);

	if (this.use_surface_shader === true) {

		this.uniforms.tNormal.value = THREE.ImageUtils.loadTexture(this.planet_normals_texture);
		this.uniforms.uNormalScale.value.x = 1.85;
		this.uniforms.uNormalScale.value.y = 1.85;
		this.uniforms.tDiffuse.value = THREE.ImageUtils.loadTexture(this.planet_surface_texture);

		this.uniforms.tSpecular.value = THREE.ImageUtils.loadTexture(this.planet_specular_texture);
		this.uniforms.enableAO.value = false;
		this.uniforms.enableDiffuse.value = true;
		this.uniforms.enableSpecular.value = true;
		this.uniforms.uDiffuseColor.value.setHex(0xffffff);
		this.uniforms.uSpecularColor.value.setHex(0x999999);
		this.uniforms.uAmbientColor.value.setHex(0xffffff);
		this.uniforms.uShininess.value = 50;
		this.uniforms.uDiffuseColor.value.convertGammaToLinear();
		this.uniforms.uSpecularColor.value.convertGammaToLinear();
		this.uniforms.uAmbientColor.value.convertGammaToLinear();

		this.surface_material = new THREE.ShaderMaterial({
			fragmentShader: this.shader.fragmentShader,
			vertexShader: this.shader.vertexShader,
			uniforms: this.uniforms,
			lights: true
		});

		this.surface_mesh = new THREE.Mesh(this.geometry, this.surface_material);
		
	} else if (this.planet_surface_texture.length > 0) {
		this.surface_material = new THREE.MeshLambertMaterial({
			color: 0xffffff,
			map: THREE.ImageUtils.loadTexture(this.planet_surface_texture),
			transparent: false
		});
		this.surface_mesh = new THREE.Mesh(this.geometry, this.surface_material);
		
	} else {
		this.default_materials = [
		new THREE.MeshBasicMaterial({
			color: 0x333399
		}),
		new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
			wireframeLinewidth: 2
		})];
		this.surface_mesh = THREE.SceneUtils.createMultiMaterialObject(this.geometry, this.default_materials);
	}

	this.surface_mesh.rotation.z = this.planet_tilt;

	if (this.planet_cloud_texture.length > 0 ) {		
		this.cloud_material = new THREE.MeshLambertMaterial({
			color: 0x6666ff,
			map: THREE.ImageUtils.loadTexture(this.planet_cloud_texture),
			transparent: true
		});
		this.cloud_mesh = new THREE.Mesh(this.geometry, this.cloud_material);
		this.cloud_mesh.scale.set(this.cloud_scale, this.cloud_scale, this.cloud_scale);
		this.cloud_mesh.rotation.z = this.planet_tilt;
	};
	
	if (this.create_combined_mesh === true) {
		this.combined_mesh = new THREE.Object3D();
		this.combined_mesh.add(this.surface_mesh);
		this.combined_mesh.add(this.cloud_mesh);
	}

	return {
		surface_mesh: this.surface_mesh,
		cloud_mesh: this.cloud_mesh,
		combined_mesh: this.combined_mesh
	};
}