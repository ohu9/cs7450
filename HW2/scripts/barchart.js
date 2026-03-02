// MARGIN CONVENTIONS
const margin = { top: 20, right: 20, bottom: 100, left: 70 };
const outerWidth = 700;
const outerHeight = 520;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

const container = d3.select("#barchart");
const svg = container.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

const cleanWeatherData = d => {
	return {
		date: d3.timeParse("%m/%d/%Y")(d.Date),
		weather: d.Weather,
		precip: d.Precip ? +d.Precip : 0,
		Pressure: +d.Pressure,
		visibility: +d.Visibility,
		windspeed: +d.Windspeed,
		maxspeed: +d.MaxSpeed,
		tempmax: +d.TempMax,
		tempmin: +d.TempMin
	}
}

const tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("position", "absolute")
	.style("background", "white")
	.style("border", "1px solid #ddd")
	.style("border-radius", "4px")
	.style("padding", "8px")
	.style("font-size", "14px")
	.style("opacity", 0)
	.style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

d3.csv("atl_weather_20to22.csv", cleanWeatherData).then(data => {
    const groupedData = d3.rollup(data, v => d3.mean(v, d => +d.windspeed), d => d.weather);

	const x = d3.scaleBand()
		.domain(groupedData.keys())
		.range([0, width])
		.padding(0.2);

	const y = d3.scaleLinear()
		.domain([.25, d3.max(groupedData.values())+ 0.05])
		.range([height, 0]);

	const bars = g.selectAll("rect")
		.data(groupedData)
		.enter()
		.append("rect")
		.attr("x", d => x(d[0]))
		.attr("y", d => y(d[1]))
		.attr("width", x.bandwidth())
		.attr("height", d => height - y(d[1]))
		.style("fill", "#5aaee6")
		.style("opacity", 0.8);

	g.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(x))
		.selectAll("text")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em");

	g.append("g")
		.call(d3.axisLeft(y));
	
	// add interaction
	bars.on("mouseover", (event, d) => {
		d3.select(event.currentTarget)
			.transition()
			.style("opacity", 1)
			.duration(150);
		
		tooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
			
		tooltip.html(`<strong>Weather:</strong> ${d[0]}<br/><strong>Avg Windspeed:</strong> ${d[1].toFixed(2)}`)
			.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
	});

	bars.on("mousemove", (event) => {
		tooltip.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
	});

	bars.on("mouseout", (event, d) => {
		d3.select(event.currentTarget)
			.transition()
			.style("opacity", 0.8)
			.duration(150);
		
		tooltip.transition()
			.duration(500)
			.style("opacity", 0);
	})
});
