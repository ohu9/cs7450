import { cleanWeatherData, tooltip } from "./script.js";

// MARGIN CONVENTIONS
const heatmapMargin = { top: 20, right: 20, bottom: 50, left: 60 };
const heatmapOuterWidth = 1200;
const heatmapOuterHeight = 400;
const heatmapWidth = heatmapOuterWidth - heatmapMargin.left - heatmapMargin.right;
const heatmapHeight = heatmapOuterHeight - heatmapMargin.top - heatmapMargin.bottom;

const heatmapContainer = d3.select("#heatmap");
const heatmapSvg = heatmapContainer.append("svg")
    .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
    .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom);

const heatmapG = heatmapSvg.append("g")
    .attr("transform", `translate(${heatmapMargin.left}, ${heatmapMargin.top})`);
d3.csv("atl_weather_20to22.csv", cleanWeatherData).then(data => {

    // get the average max, min temp for each date across 3 years
    const rollupMap = d3.rollup(data, 
        v => ({
            date: v[0].date,
            label_date: d3.timeFormat("%B %d")(v[0].date), // reformat date for tooltip
            week_number: d3.timeSunday.count(d3.timeYear(v[0].date), v[0].date) + 1, // calculate week number of grid x
            weekday: d3.timeFormat("%A")(v[0].date), // calculate day for grid y
            tempmax: d3.mean(v, d => d.tempmax)
        }),
        d => `${d.date.getMonth()}-${d.date.getDate()}`
    );

    const groupedData = Array.from(rollupMap.values())
        .sort((a, b) => a.date - b.date);

    // scales
    const x = d3.scaleBand()
        .domain(groupedData.map(d => d.week_number))
        .range([0, heatmapWidth])
        .padding(0.1);
    
    const y = d3.scaleBand()
        .range([0, heatmapHeight])
        .domain(["Saturday", "Friday", "Thursday", "Wednesday", "Tuesday", "Monday", "Sunday"])
        .padding(0.1);
    
    const color = d3.scaleSequential()
        .domain([d3.min(groupedData, d => d.tempmax), d3.max(groupedData, d => d.tempmax)])
        .interpolator(d3.interpolateOrRd);
    
    // add boxes
    const boxes = heatmapG.selectAll("rect")
        .data(groupedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.week_number))
        .attr("y", d => y(d.weekday))
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.tempmax));

    // axes
    heatmapG.append("g")
        .attr("transform", `translate(0, ${heatmapHeight})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select(".domain").remove()
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "8px");

    heatmapG.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickFormat(d => d[0]))
        .select(".domain").remove()
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "8px");

    
    // labels
    heatmapG.append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "middle")
        .attr("x", heatmapWidth / 2)
        .attr("y", heatmapHeight + heatmapMargin.bottom - 15)
        .text("Week number")
        .style("font-size", "12px");

    heatmapG.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -heatmapHeight / 2)
        .attr("y", -heatmapMargin.left + 35)
        .text("Week Day")
        .style("font-size", "12px");

    // interaction
    boxes.on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
    })
    .on("mousemove", (event, d) => {
        tooltip.html(`<b>Date:</b> ${d.label_date}<br/><b>Max Temp:</b> ${d.tempmax.toFixed(2)}`)  
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
    });
});
