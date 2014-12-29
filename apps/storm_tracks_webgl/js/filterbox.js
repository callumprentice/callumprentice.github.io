var minDate = new Date();
var maxDate = new Date();
var minWindSpeed = 0;
var maxWindSpeed = 180;
var nameFilter = "";
var drawGuides = false;

function initFilterBox() {
    var min_date_default = new Date();
    var max_date_default = new Date();
    min_date_default.setFullYear(max_date_default.getFullYear() - 10);

    var min_date_bound = new Date();
    var max_date_bound = new Date();
    min_date_bound.setFullYear(max_date_bound.getFullYear() - 15);

    minDate = min_date_default;
    maxDate = max_date_default;

    $("#filter-box-date-slider").dateRangeSlider({
        wheelMode: "scroll",
        wheelSpeed: 5,
        valueLabels: "show",
        bounds: {
            min: min_date_bound,
            max: max_date_bound
        },
        defaultValues: {
            min: min_date_default,
            max: max_date_default
        },
        range: false,
        step: {
            days: 1
        }
    });

    $("#filter-box-date-slider").bind("valuesChanged", function (event, data) {
        minDate = data.values.min;
        maxDate = data.values.max;
        update();
    });

    $("#filter-box-windspeed-slider").rangeSlider({
        wheelMode: "scroll",
        wheelSpeed: 5,
        valueLabels: "show",
        bounds: {
            min: minWindSpeed,
            max: maxWindSpeed
        },
        defaultValues: {
            min: minWindSpeed,
            max: maxWindSpeed
        },
        step: 1.0,
        range: false
    });
    
    $("#filter-box-windspeed-slider").bind("valuesChanged", function (event,
        data) {
        minWindSpeed = data.values.min;
        maxWindSpeed = data.values.max;
        update();
    });
}

function setDateRange(start, end) {
    $("#filter-box-date-slider").dateRangeSlider({
        bounds: {
            min: start,
            max: end
        },
        range: false,
        step: {
            days: 1
        }
    }).dateRangeSlider("values", start, end);
    minDate = start;
    maxDate = end;
    update();
}

function setWindSpeedRange(min, max) {
    $("#filter-box-windspeed-slider").rangeSlider({}).rangeSlider("values", min,
        max);
    minWindSpeed = min;
    maxWindSpeed = max;
    update();
}

function filterStorms() {
    nameFilter = document.getElementById('filter-storms').value;
    update();
}

function toggleGuides() {

    drawGuides = !drawGuides;

    update();
}

function update() {

    updateFlag = true;

    console.log("Filter box updated.")
    console.log("    Date range is", minDate, " to ", maxDate);
    console.log("    Wind speed range is", minWindSpeed, "to", maxWindSpeed);
    console.log("    Name filer is", nameFilter);
    console.log("    Draw guides option is", drawGuides);
}