// get the point in space on surface of sphere radius radius from lat lng
// lat and lng are in degrees
function latlngPosFromLatLng(lat, lng, radius) {
	var phi = (90 - lat) * Math.PI / 180;
	var theta = (360 - lng) * Math.PI / 180;
	var x = radius * Math.sin(phi) * Math.cos(theta);
	var y = radius * Math.cos(phi);
	var z = radius * Math.sin(phi) * Math.sin(theta);

	return {
		phi: phi,
		theta: theta,
		x: x,
		y: y,
		z: z
	};
}

// convert an angle in degrees to same in radians
function latlngDeg2rad(n) {
	return n * Math.PI / 180;
}

// Find intermediate points on sphere between two lat/lngs
// lat and lng are in degrees
// offset goes from 0 (lat/lng1) to 1 (lat/lng2)
// formula from http://williams.best.vwh.net/avform.htm#Intermediate
function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
	lat1 = latlngDeg2rad(lat1);
	lng1 = latlngDeg2rad(lng1);
	lat2 = latlngDeg2rad(lat2);
	lng2 = latlngDeg2rad(lng2);

	d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
	A = Math.sin((1 - offset) * d) / Math.sin(d);
	B = Math.sin(offset * d) / Math.sin(d);
	x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
	y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
	z = A * Math.sin(lat1) + B * Math.sin(lat2);
	lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
	lng = Math.atan2(y, x) * 180 / Math.PI;

	return {
		lat: lat,
		lng: lng
	};
}
