import { cleanWeatherData, tooltip, dispatchScatterBar } from "./script.js";

const barMargin = { top: 20, right: 20, bottom: 80, left: 70 };
const barOuterWidth = 600;
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
    
    const fullGrouped = d3.rollup(data, v => d3.mean(v, d => d.windspeed), d => d.weather);

	const x = d3.scaleBand()
		.domain(fullGrouped.keys())
		.range([0, barWidth])
		.padding(0.2);

	const y = d3.scaleLinear()
		.domain([0, d3.max(fullGrouped.values())])
		.range([barHeight, 0]);

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
	
    // group for bars
    const barsG = barG.append("g");

    // interaction tooltips
    barsG.on("mouseover", (event) => {
        const rect = event.target;
        if (rect.tagName !== "rect") return;
        const d = d3.select(rect).datum();
        if (!d) return;

		d3.select(rect)
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

	barsG.on("mousemove", (event) => {
		tooltip.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
	});

	barsG.on("mouseout", (event) => {
        const rect = event.target;
        if (rect.tagName !== "rect") return;
		d3.select(rect)
			.transition()
			.style("opacity", 0.8)
			.duration(150);
		
		tooltip.transition()
			.duration(500)
			.style("opacity", 0);
	})

    const bars = barsG.selectAll("rect")
        .data(Array.from(fullGrouped), d => d[0])
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .style("fill", "#487edb")
        .style("opacity", 0.8)
        .attr("y", d => y(d[1]))
        .attr("height", d => barHeight - y(d[1]));

    // brushing!
    const brush = d3.brushX()
        .extent([[0, 0], [barWidth, barHeight]])
        .on("brush end", brushed);

    barG.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.sourceEvent) return;
        
        if (!event.selection) {
            barsG.selectAll("rect")
                .style("opacity", 0.8)
                .style("fill", "#487edb");
            dispatchScatterBar.call("filter", this, new Set(), "barchart");
            return;
        }
        
        const [x0, x1] = event.selection;
        
        // filter data first
        const selectedWeathers = Array.from(fullGrouped.keys()).filter(weather => {
            const cx = x(weather) + x.bandwidth() / 2;
            return cx >= x0 && cx <= x1;
        });
        const selectedSet = new Set(selectedWeathers);
        
		// modify bar styles
        barsG.selectAll("rect").style("opacity", d => selectedSet.has(d[0]) ? 0.8 : 0.2);
        
        dispatchScatterBar.call("filter", this, selectedSet, "barchart");
    }

    // listen to brush from scatterplot
    dispatchScatterBar.on("filter.barchart", function(selectedData, source) {
        if (source === "barchart") return;
        barG.select(".brush").call(brush.move, null);
        
        if (!selectedData || selectedData.length === 0) {
            barsG.selectAll("rect").style("opacity", 0.8)
                .style("fill", "#487edb"); 
            return;
        }
        
        const activeWeathers = new Set(selectedData.map(d => d.weather));
        barsG.selectAll("rect")
            .style("opacity", d => activeWeathers.has(d[0]) ? 0.8 : 0.2)
            .style("fill", d => activeWeathers.has(d[0]) ? "#ff9742" : "#487edb");
    });

});
