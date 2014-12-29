// ISS PHoto Viewer - USS data loader (http://callum.com) 2014

var ISSLOADER = ISSLOADER || {};
ISSLOADER.DataLoader = function(parameters) {
    'use strict';
    var _parameters = parameters || {},
        self = this,
        onDataLoaded = null,
        onMissionLoaded = null,
        num_missions = 41,
        all_iss_data = new Array(num_missions)
    this.load_each = function(url) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var dv = new DataView(xhr.response);
                var mission_number = dv.getUint8(0);
                var num_entries = (dv.byteLength - 1) / 8;
                var iss_data = new Array(num_entries);
                for (var i = 0; i < num_entries; ++i) {
                    var base_index = i * 8 + 1;
                    var lat = ((dv.getUint16(base_index + 0) / 10.0) - 90.0);
                    var lon = ((dv.getUint16(base_index + 2) / 10.0) - 180.0);
                    var mission_id = dv.getUint32(base_index + 4);
                    var entry = [lat, lon, mission_id];
                    iss_data[i] = entry;
                }
                all_iss_data[mission_number - 1] = iss_data;
                if (self.onMissionLoaded) {
                    self.onMissionLoaded(mission_number);
                }
                var finished = true;
                for (var c = 0; c < num_missions; ++c) {
                    if (typeof all_iss_data[c] === 'undefined') {
                        finished = false;
                    }
                }
                if (finished) {
                    if (self.onDataLoaded) {
                        self.onDataLoaded(all_iss_data);
                    }
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
    }
    this.getNumMissions = function() {
        return num_missions;
    }
    this.load = function() {
        for (var each_mission = 0; each_mission < num_missions; ++each_mission) {
            var url = "issjs_bin/iss" + ("00" + (each_mission + 1)).slice(-3) + "_bin.js";
            this.load_each(url);
        }
    }
}