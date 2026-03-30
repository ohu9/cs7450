// Main control file for controlling which chart is displayed. This is only activated when the dropdown
// menu is changed, and makes it seem like the charts are swapping in and out
d3.select("#chart-select").on("change", function(e) {
    const selected = e.target.value;

    if (selected === "barchart") {
        d3.select("#barchart").style("display", "block");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "none");
        d3.select("#heatmap").style("display", "none");
    } else if (selected === "scatterplot") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "block");
        d3.select("#linechart").style("display", "none");
        d3.select("#heatmap").style("display", "none");
    } else if (selected === "linechart") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "block");
        d3.select("#heatmap").style("display", "none");
    } else if (selected === "heatmap") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "none");
        d3.select("#heatmap").style("display", "block");
    }
});

// Define data cleaning function for all charts
export const cleanWeatherData = (data) => {
	return {
		date: d3.timeParse("%m/%d/%Y")(data.Date),
		weather: data.Weather,
		precip: data.Precip ? +data.Precip : 0,
		pressure: +data.Pressure,
		visibility: +data.Visibility,
		windspeed: +data.Windspeed,
		maxspeed: +data.MaxSpeed,
		tempmax: +data.TempMax,
		tempmin: +data.TempMin
	}
}

// Define tooltip for all charts
export const tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("position", "absolute")
	.style("background", "white")
	.style("border", "1px solid #ddd")
	.style("border-radius", "4px")
	.style("padding", "8px")
	.style("font-size", "14px")
	.style("opacity", 0)
	.style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

