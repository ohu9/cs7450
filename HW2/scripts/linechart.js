import { cleanWeatherData, tooltip } from "../scripts/script.js";

// MARGIN CONVENTIONS
const lineMargin = { top: 20, right: 20, bottom: 70, left: 70 };
const lineOuterWidth = 1000;
const lineOuterHeight = 520;
const lineWidth = lineOuterWidth - lineMargin.left - lineMargin.right;
const lineHeight = lineOuterHeight - lineMargin.top - lineMargin.bottom;

const lineContainer = d3.select("#linechart");
const lineSvg = lineContainer.append("svg")
	.attr("width", lineWidth + lineMargin.left + lineMargin.right)
	.attr("height", lineHeight + lineMargin.top + lineMargin.bottom);

const lineG = lineSvg.append("g")
	.attr("transform", `translate(${lineMargin.left}, ${lineMargin.top})`);
d3.csv("atl_weather_20to22.csv", cleanWeatherData).then(data => {
    
    // get the average max, min temp for each date across 3 years
    const rollupMap = d3.rollup(data, 
        v => ({
            date: new Date(2020, v[0].date.getMonth(), v[0].date.getDate()),
            tempmax: d3.mean(v, d => d.tempmax),
            tempmin: d3.mean(v, d => d.tempmin)
        }),
        d => `${d.date.getMonth()}-${d.date.getDate()}`
    );

    const groupedData = Array.from(rollupMap.values())
        .sort((a, b) => a.date - b.date);


    // scales
	const temp = d3.scaleLinear()
		.domain([d3.min(groupedData, d => d.tempmin), d3.max(groupedData, d => d.tempmax)])
		.range([lineHeight, 0]);

    const date = d3.scaleTime()
        .domain(d3.extent(groupedData, d => d.date))
        .range([0, lineWidth]);

    // axes
	lineG.append("g")
		.attr("transform", `translate(0, ${lineHeight})`)
		.call(d3.axisBottom(date));

	lineG.append("g")
		.call(d3.axisLeft(temp));

    // plot lines
    const maxLine = d3.line()
        .x(d => date(d.date))
        .y(d => temp(d.tempmax));
    lineG.append("path")
        .attr("d", maxLine(groupedData))
        .attr("fill", "none")
        .attr("stroke", "#e39a42")
        .attr("stroke-width", 2);

    const minLine = d3.line()
        .x(d => date(d.date))
        .y(d => temp(d.tempmin));
    lineG.append("path")
        .attr("d", minLine(groupedData))
        .attr("fill", "none")
        .attr("stroke", "#487edb")
        .attr("stroke-width", 2);
	
    // labels
	lineG.append("text")
		.attr("class", "x axis-label")
		.attr("text-anchor", "middle")
		.attr("x", lineWidth / 2)
		.attr("y", lineHeight + lineMargin.bottom - 20)
		.text("Date");

	lineG.append("text")
		.attr("class", "y axis-label")
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("x", -lineHeight / 2)
		.attr("y", -lineMargin.left + 30)
		.text("Temperature");

	// interaction — linked tooltips for both lines
	const focusG = lineG.append("g")
		.style("display", "none");
		
	const maxFocus = focusG.append("circle")
		.attr("r", 5)
		.attr("fill", "#e39a42");
		
	const minFocus = focusG.append("circle")
		.attr("r", 5)
		.attr("fill", "#487edb");

    // use bisector to snap to the closest date to the left
	const bisectDate = d3.bisector(d => d.date).left;

	lineG.append("rect")
		.attr("width", lineWidth)
		.attr("height", lineHeight)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", () => {
			focusG.style("display", null);
			tooltip.transition().duration(200).style("opacity", 0.9);
		})
		.on("mouseout", () => {
			focusG.style("display", "none");
			tooltip.transition().duration(500).style("opacity", 0);
		})
		.on("mousemove", (event) => {
			const x0 = date.invert(d3.pointer(event)[0]);
			const i = bisectDate(groupedData, x0, 1);
			const d0 = groupedData[i - 1];
			const d1 = groupedData[i];
			
			if (!d0 || !d1) return;
			
			const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

			maxFocus.attr("transform", `translate(${date(d.date)},${temp(d.tempmax)})`);
			minFocus.attr("transform", `translate(${date(d.date)},${temp(d.tempmin)})`);

			tooltip.html(`<b>Date:</b> ${d3.timeFormat("%b %d")(d.date)}<br/><b>Max Temp:</b> ${d.tempmax.toFixed(2)}<br/><b>Min Temp:</b> ${d.tempmin.toFixed(2)}`)
				.style("left", (event.pageX + 10) + "px")
				.style("top", (event.pageY - 28) + "px");
		});
});
