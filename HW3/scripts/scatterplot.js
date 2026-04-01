import { dispatchScatterBar, getMonthDay } from "./script.js";

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
        .style("fill", "#487edb")
        .style("opacity", 0.6);

	// interaction
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushed);

    scatterG.append("g")
        .attr("class", "brush")
        .call(brush);

    // brushing!
    function brushed(event) {
        if (!event.sourceEvent) return;
        
        if (!event.selection) {
            circles.style("opacity", 0.6).attr("r", 5).style("fill", "#487edb");
            dispatchScatterBar.call("filter", this, [], "scatter");
            return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        
        // filter data based on brush
        const selected = data.filter(d => {
            const cx = x(d[currentX]);
            const cy = y(d[currentY]);
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        });
        
        // modify appearance of brushed circles
        circles.style("opacity", d => selected.includes(d) ? 1 : 0.1);
        
        dispatchScatterBar.call("filter", this, selected, "scatter");
    }

    // listen to bar chart updates
    dispatchScatterBar.on("filter.scatter", function(selectedWeathers, source) {
        if (source === "scatter") return;
        scatterG.select(".brush").call(brush.move, null);
        if (!selectedWeathers || selectedWeathers.size === 0) {
            circles.style("opacity", 0.6).attr("r", 5).style("fill", "#487edb");
        } else {
            circles.style("opacity", d => selectedWeathers.has(d.weather) ? .8 : 0.1)
                .style("fill", d => selectedWeathers.has(d.weather) ? "#ff9742" : "#487edb");
        }
    });

    // tooltips
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
