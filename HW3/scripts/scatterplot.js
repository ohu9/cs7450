import { dispatch, getMonthDay } from "./script.js";

// MARGIN CONVENTIONS
const margin = { top: 20, right: 20, bottom: 70, left: 70 };
const outerWidth = 600;
const outerHeight = 500;
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

    scatterContainer.style("position", "relative");

    // axis labels are select buttons
    const xSelect = scatterContainer.append("select")
        .attr("id", "scatter-x")
        .style("position", "absolute")
        .style("left", `${margin.left + width / 2}px`)
        .style("bottom", "10px")
        .style("transform", "translateX(-50%)")
        .style("font-size", "14px")
        .style("padding", "4px");

    const ySelect = scatterContainer.append("select")
        .attr("id", "scatter-y")
        .style("position", "absolute")
        .style("left", "-20px")
        .style("top", `${margin.top + height / 2}px`)
        .style("transform", "rotate(-90deg)")
        .style("font-size", "14px")
        .style("padding", "4px");

    const attributes = [
        {value: "tempmax", text: "Max Temperature"},
        {value: "tempmin", text: "Min Temperature"},
        {value: "dewpoint", text: "Dewpoint"},
        {value: "precip", text: "Precipitation"},
        {value: "Pressure", text: "Pressure"},
        {value: "visibility", text: "Visibility"},
        {value: "windspeed", text: "Windspeed"},
        {value: "maxspeed", text: "Max Speed"}
    ];

    xSelect.selectAll("option")
        .data(attributes)
        .enter()
        .append("option")
        .attr("value", d => d.value)
        .text(d => d.text);
        
    ySelect.selectAll("option")
        .data(attributes)
        .enter()
        .append("option")
        .attr("value", d => d.value)
        .text(d => d.text);

    // initialize as tempmax vs dewpoint
    let currentX = "tempmax";
    let currentY = "dewpoint";
    xSelect.property("value", currentX);
    ySelect.property("value", currentY);

	const x = d3.scaleLinear().range([0, width]);
	const y = d3.scaleLinear().range([height, 0]);

	const xAxisG = scatterG.append("g")
		.attr("transform", `translate(0, ${height})`);

	const yAxisG = scatterG.append("g");
    
    const circles = scatterG.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", d => d.weather === "sun" ? "#ff9742" : "#487edb")
        .style("opacity", 0.6);

	// interaction
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushed);

    scatterG.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.sourceEvent) return;
        
        if (!event.selection) {
            circles.style("opacity", 0.6).attr("r", 5);
            dispatch.call("filterByDate", this, null, "scatter");
            return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        const selectedMd = new Set();
        
        circles.style("opacity", function(d) {
            const cx = x(d[currentX]);
            const cy = y(d[currentY]);
            const isInside = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
            if (isInside) selectedMd.add(getMonthDay(d.date));
            return isInside ? 1 : 0.1;
        }).attr("r", d => {
            const cx = x(d[currentX]);
            const cy = y(d[currentY]);
            const isInside = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
            return isInside ? 7 : 5;
        });
        
        dispatch.call("filterByDate", this, selectedMd, "scatter");
    }

    dispatch.on("filterByDate.scatter", function(selectedMd, source) {
        if (source === "scatter") return;
        scatterG.select(".brush").call(brush.move, null);
        if (!selectedMd) {
            circles.style("opacity", 0.6).attr("r", 5);
        } else {
            circles.style("opacity", d => selectedMd.has(getMonthDay(d.date)) ? 1 : 0.1)
                   .attr("r", d => selectedMd.has(getMonthDay(d.date)) ? 7 : 5);
        }
    });

    scatterG.on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event);
        let hovered = null;
        let minDist = 10;
        for (let d of data) {
            const cx = x(d[currentX]);
            const cy = y(d[currentY]);
            const dist = Math.hypot(cx - mx, cy - my);
            if (dist < minDist) {
                hovered = d;
                minDist = dist;
            }
        }
        if (hovered) {
             tooltip.style("opacity", 0.9)
                .html(`<b>Date:</b> ${d3.timeFormat("%B %d")(hovered.date)}<br/><b>Weather:</b> ${hovered.weather}<br/><b>${attributes.find(o=>o.value===currentX).text}:</b> ${hovered[currentX]}<br/><b>${attributes.find(o=>o.value===currentY).text}:</b> ${hovered[currentY]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        } else {
             tooltip.style("opacity", 0);
        }
    }).on("mouseleave", () => tooltip.style("opacity", 0));

	// add legend
	const legendGroups = scatterG.selectAll(".legend")
		.data([{label: "Sun", color: "#ff9742"}, {label: "Other", color: "#487edb"}])
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

    // update function to redraw on select change
    function update() {
        x.domain(d3.extent(data, d => d[currentX]));
        y.domain(d3.extent(data, d => d[currentY]));

        xAxisG.transition().duration(500).call(d3.axisBottom(x));
        yAxisG.transition().duration(500).call(d3.axisLeft(y));



        circles.transition().duration(500)
            .attr("cx", d => x(d[currentX]))
            .attr("cy", d => y(d[currentY]));
            
        scatterG.select(".brush").call(brush.move, null);
    }

    xSelect.on("change", function() {
        currentX = this.value;
        update();
    });
    
    ySelect.on("change", function() {
        currentY = this.value;
        update();
    });

    // Initial draw
    update();
});
