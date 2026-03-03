// MARGIN CONVENTIONS
const margin = { top: 20, right: 20, bottom: 70, left: 70 };
const outerWidth = 700;
const outerHeight = 520;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

const scatterContainer = d3.select("#scatterplot");
const scatterSvg = scatterContainer.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

const scatterG = scatterSvg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

const cleanWeatherData = d => {
	return {
		date: d3.timeParse("%m/%d/%Y")(d.Date),
		weather: d.Weather,
        dewpoint: d.Dewpoint ? +d.Dewpoint : 0,
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
	.style("pointer-events", "none")
	.style("opacity", 0)
	.style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

d3.csv("atl_weather_20to22.csv", cleanWeatherData).then(data => {

	const x = d3.scaleLinear()
		.domain(d3.extent(data, d => d.tempmax))
		.range([0, width]);

	const y = d3.scaleLinear()
		.domain(d3.extent(data, d => d.dewpoint))
		.range([height, 0]);

	scatterG.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(x));

	scatterG.append("g")
		.call(d3.axisLeft(y));
    
    const circles = scatterG.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.tempmax))
        .attr("cy", d => y(d.dewpoint))
        .attr("r", 5)
        .attr("fill", d => d.weather === "sun" ? "#e39a42" : "#487edb")
        .style("opacity", 0.7);
	
    // labels
	scatterG.append("text")
		.attr("class", "x axis-label")
		.attr("text-anchor", "middle")
		.attr("x", width / 2)
		.attr("y", height + margin.bottom - 20)
		.text("Max Temperature");

	scatterG.append("text")
		.attr("class", "y axis-label")
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("x", -height / 2)
		.attr("y", -margin.left + 30)
		.text("Dewpoint");

	// interaction
	circles.on("mouseover", (event, d) => {
		d3.select(event.currentTarget)
			.transition()
			.style("opacity", 1)
			.attr("r", 7)
			.duration(150);
		
		tooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
			
		tooltip.html(`<b>Weather:</b> ${d.weather}<br/><b>Max Temp:</b> ${d.tempmax}<br/><b>Dewpoint:</b> ${d.dewpoint}`)
			.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
	});

	circles.on("mousemove", (event) => {
		tooltip.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
	});

	circles.on("mouseout", (event, d) => {
		d3.select(event.currentTarget)
			.transition()
			.style("opacity", 0.7)
			.attr("r", 5)
			.duration(150);
		
		tooltip.transition()
			.duration(500)
			.style("opacity", 0);
	});

	// add legend
	const legendGroups = scatterG.selectAll(".legend")
		.data([{label: "Sun", color: "#e39a42"}, {label: "Other", color: "#487edb"}])
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", (d, i) => `translate(${width - 80}, ${height - margin.bottom + i * 20})`);

	legendGroups.append("rect")
		.attr("x", 0)
		.attr("width", 12)
		.attr("height", 12)
		.style("fill", d => d.color)
		.style("opacity", 0.7);

	legendGroups.append("text")
		.attr("x", 20)
		.attr("y", 6)
		.attr("dy", ".35em")
		.style("text-anchor", "start")
		.style("font-size", "14px")
		.text(d => d.label);
});
