import { cleanWeatherData, tooltip, dispatchLineHeatmap, getMonthDay } from "./script.js";

// MARGIN CONVENTIONS
const heatmapMargin = { top: 20, right: 20, bottom: 85, left: 60 };
const heatmapOuterWidth = 1200;
const heatmapOuterHeight = 500;
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

    // legend
    const minTemp = d3.min(groupedData, d => d.tempmax);
    const maxTemp = d3.max(groupedData, d => d.tempmax);

    const defs = heatmapSvg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
        
    linearGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.1))
        .enter().append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(minTemp + d * (maxTemp - minTemp)));

    const legendWidth = 150;
    const legendHeight = 12;
    const legendG = heatmapSvg.append("g")
        .attr("transform", `translate(${heatmapMargin.left + heatmapWidth / 2 - legendWidth / 2 + 450}, ${heatmapMargin.top + heatmapHeight + 40})`);

    legendG.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

    const legendScale = d3.scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, legendWidth]);

    legendG.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(d3.axisBottom(legendScale).ticks(6))
        .select(".domain").remove(); 

    legendG.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -5)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text("Max Temp °F");

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
        .attr("y", heatmapHeight + heatmapMargin.bottom - 30)
        .text("Week number")
        .style("font-size", "14px");

    heatmapG.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -heatmapHeight / 2)
        .attr("y", -heatmapMargin.left + 35)
        .text("Week Day")
        .style("font-size", "14px");

    // interaction
    const brush = d3.brush()
        .extent([[0, 0], [heatmapWidth, heatmapHeight]])
        .on("brush end", brushed);

    heatmapG.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.sourceEvent) return;
        
        if (!event.selection) {
            boxes.style("opacity", 1); // Source resets to full view
            dispatchLineHeatmap.call("filter", this, new Set(), "heatmap"); // Target hides
            return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        
        const selected = groupedData.filter(d => {
            const bx = x(d.week_number);
            const by = y(d.weekday);
            const cx = bx + x.bandwidth()/2;
            const cy = by + y.bandwidth()/2;
            return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
        });
        
        const selectedMd = new Set(selected.map(d => getMonthDay(d.date)));
        
        boxes.style("opacity", d => selected.includes(d) ? 1 : 0.2);
        
        dispatchLineHeatmap.call("filter", this, selectedMd, "heatmap");
    }

    dispatchLineHeatmap.on("filter.heatmap", function(selectedMd, source) {
        if (source === "heatmap") return;
        heatmapG.select(".brush").call(brush.move, null);
        
        if (selectedMd.size === 0) {
            boxes.style("opacity", 1);
        } else {
            boxes.style("opacity", d => selectedMd.has(getMonthDay(d.date)) ? 1 : 0.2);
        }
    });

    heatmapG.on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event);
        let hovered = null;
        for (let d of groupedData) {
            const bx = x(d.week_number);
            const by = y(d.weekday);
            if (mx >= bx && mx <= bx + x.bandwidth() && my >= by && my <= by + y.bandwidth()) {
                hovered = d;
                break;
            }
        }
        if (hovered) {
             tooltip.style("opacity", 0.9)
                .html(`<b>Date:</b> ${hovered.label_date}<br/><b>Max Temp:</b> ${hovered.tempmax.toFixed(2)}`)  
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        } else {
             tooltip.style("opacity", 0);
        }
    }).on("mouseleave", () => tooltip.style("opacity", 0));
});
