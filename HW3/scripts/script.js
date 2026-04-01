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

export const getMonthDay = (date) => `${date.getMonth()}-${date.getDate()}`;
// listeners for linked brushing across files
export const dispatchScatterBar = d3.dispatch("filter");
export const dispatchLineHeatmap = d3.dispatch("filter");
