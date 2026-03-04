import { cleanWeatherData, tooltip } from "../scripts/script.js";

const barMargin = { top: 20, right: 20, bottom: 80, left: 70 };
const barOuterWidth = 500;
const barOuterHeight = 500;	
const barWidth = barOuterWidth - barMargin.left - barMargin.right;
const barHeight = barOuterHeight - barMargin.top - barMargin.bottom;


const barContainer = d3.select("#barchart");
const barSvg = barContainer.append("svg")
	.attr("width", barOuterWidth)
	.attr("height", barOuterHeight);

const barG = barSvg.append("g")
	.attr("transform", `translate(${barMargin.left}, ${barMargin.top})`);

d3.csv("atl_weather_20to22.csv", cleanWeatherData).then(data => {
    const groupedData = d3.rollup(data, v => d3.mean(v, d => d.precip), d => d.weather);

	const x = d3.scaleBand()
		.domain(groupedData.keys())
		.range([0, barWidth])
		.padding(0.2);

	const y = d3.scaleLinear()
		.domain([0, d3.max(groupedData.values())])
		.range([barHeight, 0]);

	const bars = barG.selectAll("rect")
		.data(groupedData)
		.enter()
		.append("rect")
		.attr("x", d => x(d[0]))
		.attr("y", d => y(d[1]))
		.attr("width", x.bandwidth())
		.attr("height", d => barHeight - y(d[1]))
		.style("fill", "#487edb")
		.style("opacity", 0.9);

	// axes
	barG.append("g")
		.attr("transform", `translate(0, ${barHeight})`)
		.call(d3.axisBottom(x))
		.selectAll("text")
		.style("font-size", "1rem");

	barG.append("g")
		.call(d3.axisLeft(y));
	
	// labels
	barG.append("text")
		.attr("class", "x axis-label")
		.attr("text-anchor", "middle")
		.attr("x", barWidth / 2)
		.attr("y", barHeight + barMargin.bottom - 20)
		.text("Weather Condition");

	barG.append("text")
		.attr("class", "y axis-label")
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("x", -barHeight / 2)
		.attr("y", -barMargin.left + 30)
		.text("Average Windspeed");
	
	// interaction
	bars.on("mouseover", (event, d) => {
		d3.select(event.currentTarget)
			.transition()
			.style("opacity", 1)
			.duration(150);
		
		tooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
			
		tooltip.html(`<b>Weather:</b> ${d[0]}<br/><b>Avg Windspeed:</b> ${d[1].toFixed(2)}`)
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
