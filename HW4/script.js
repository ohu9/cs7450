const scroller = scrollama();

const margin = { top: 40, right: 40, bottom: 60, left: 60 };

// define each data source
let worldData, faoData, comtradeData, priceData;

// tooltip setup
const tooltip = d3.select("#tooltip");

// color scale
const highlightColor = "#819067"; 
const dispatch = d3.dispatch("brush", "unbrush"); // Unified brushing bus

// data loading and parsing
Promise.all([
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-50m.json"),
    d3.csv("data/FAOSTAT_tea_production_data.csv"),
    d3.csv("data/comtrade_export_data.csv"),
    d3.text("data/commodity_price_history.csv")
]).then(function([world, fao, comtrade, priceRaw]) {
    
    // map data
    worldData = topojson.feature(world, world.objects.countries);

    // FAO production data
    faoData = fao.filter(d => d.Element === "Production");
    
    // comtrade export data
    comtradeData = comtrade.filter(d => d.flowDesc === "Export");

    // price data
    const priceLines = priceRaw.split(/\r?\n/).slice(4);
    priceData = d3.csvParse(priceLines.join('\n'));
    priceData = priceData.filter(d => d[""] && d["Tea, avg 3 auctions"]);
    
    initCharts();
    setupScrollama();

}).catch(function(error) {
    console.error("Error loading data: ", error);
});

function initCharts() {
    drawMap();
    drawSankey();
    drawDumbbell();
    drawLineChart();
}

// utility to get container dimensions
// https://www.w3schools.com/jsref/prop_element_clientheight.asp
function getDimensions(selector) {
    const el = document.querySelector(selector);
    const width = el.clientWidth;
    const height = el.clientHeight || window.innerHeight * 0.8;
    return {
        width,
        height,
        chartWidth: width - margin.left - margin.right,
        chartHeight: height - margin.top - margin.bottom
    };
}

// Step 1: Map
function drawMap() {
    const {width, height, chartWidth, chartHeight} = getDimensions("#map-chart");
    const container = d3.select("#map-chart");
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    let productionMap = new Map();
    faoData.forEach(d => {
        let name = d.Area === "China, mainland" ? "China" : d.Area;
        productionMap.set(name, +d.Value);
    });

    const teaFeatures = worldData.features.filter(d => productionMap.has(d.properties.name));
    const teaWorld = { type: "FeatureCollection", features: teaFeatures };

    // We use chartWidth twice here to absolutely guarantee the width is the bottleneck constraint. This preserves the high-zoom level!
    const projection = d3.geoMercator()
        .fitSize([chartWidth, chartWidth], teaWorld);
        
    // We then force the vertical translation to sit perfectly identically in the Y center of our smaller SVG wrapper
    const t = projection.translate();
    projection.translate([t[0], height / 2]);
        
    const path = d3.geoPath().projection(projection);

    const maxProd = d3.max(Array.from(productionMap.values()));
    
    const colorScale = d3.scaleLinear()
        .domain([0, maxProd])
        .range(["#bbcdab", "#284321"]);

    const g = svg.append("g");

    // top 5 producing countries for bar chart
    const top5Countries = new Set(Array.from(productionMap.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(d => d[0]));

    g.selectAll("path")
        .data(worldData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
            const val = productionMap.get(d.properties.name);
            return val ? colorScale(val) : "#ebebebff";
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5)
        .attr("id", d => `map-${d.properties.name.replace(/\s+/g, '-')}`)
        .on("mouseenter", (event, d) => {
            const val = productionMap.get(d.properties.name);
            if(val) {
                tooltip.style("display", "block")
                    .html(`<strong>${d.properties.name}</strong><br>Production: ${d3.format(",")(val)} t`);
                
                if (top5Countries.has(d.properties.name)) {
                    dispatch.call("brush", this, d.properties.name);
                }
            }
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseleave", () => {
            tooltip.style("display", "none");
            dispatch.call("unbrush", this);
        });

    // listener for external brushing
    dispatch.on("brush.map", (countryName) => {
        g.selectAll("path").classed("dimmed", true);
        const target = d3.select(`#map-${countryName.replace(/\s+/g, '-')}`);
        if(!target.empty()) target.classed("dimmed", false);
    });

    dispatch.on("unbrush.map", () => {
        g.selectAll("path").classed("dimmed", false);
    });

    // legend
    const legendWidth = 150;
    const legendHeight = 12;
    
    const legendG = svg.append("g")
        .attr("transform", `translate(${20}, ${height - 25})`); 
        
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "map-legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
        
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#bbcdab"); 
        
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#284321");
        
    legendG.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#map-legend-gradient)");
        
    // legend gradient text
    legendG.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .text("0 tons")
        .style("font-size", "12px")
        .attr("fill", "#666");
        
    legendG.append("text")
        .attr("x", legendWidth)
        .attr("y", -5)
        .attr("text-anchor", "end")
        .text(d3.format(".2s")(maxProd) + " tons")
        .style("font-size", "12px")
        .attr("fill", "#666");

    // "Non-producing" box
    legendG.append("rect")
        .attr("x", legendWidth + 30)
        .attr("y", 0)
        .attr("width", legendHeight)
        .attr("height", legendHeight)
        .style("fill", "#ebebebff");
        
    legendG.append("text")
        .attr("x", legendWidth + 30 + legendHeight + 6)
        .attr("y", legendHeight - 2)
        .text("Non-Producing")
        .style("font-size", "12px")
        .attr("fill", "#666");

    // draw the bar chart
    drawBarChart(productionMap, colorScale);
}

function drawBarChart(productionMap, colorScale) {
    const {width, height} = getDimensions("#bar-chart");
    const container = d3.select("#bar-chart");
    
    // Adjusted margins to favor bottom text labels and tall columns
    const innerMargin = { top: 25, right: 20, bottom: 30, left: 20 };
    const chartWidth = width - innerMargin.left - innerMargin.right;
    const chartHeight = height - innerMargin.top - innerMargin.bottom;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${innerMargin.left}, ${innerMargin.top})`);

    // top 5 slice directly
    let top5 = Array.from(productionMap.entries())
        .map(([country, vol]) => ({ country, vol }))
        .sort((a,b) => b.vol - a.vol)
        .slice(0, 5);

    const xScale = d3.scaleBand()
        .domain(top5.map(d => d.country))
        .range([0, chartWidth])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(top5, d => d.vol)])
        .range([chartHeight, 0]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .style("font-size", "13px")
        .call(g => g.select(".domain").remove()); 

    svg.append("g")
        .selectAll("rect")
        .data(top5)
        .join("rect")
        .attr("class", "bar")
        .attr("id", d => `bar-${d.country.replace(/\s+/g, '-')}`)
        .attr("x", d => xScale(d.country))
        .attr("y", d => yScale(d.vol))
        .attr("width", xScale.bandwidth())
        .attr("height", d => chartHeight - yScale(d.vol))
        .attr("fill", d => colorScale(d.vol))
        .on("mouseenter", function(event, d) {
            dispatch.call("brush", this, d.country);
        })
        .on("mouseleave", function(event, d) {
            dispatch.call("unbrush", this);
        });
        
    svg.append("g")
        .selectAll("text")
        .data(top5)
        .join("text")
        .text(d => d3.format(".3s")(d.vol) + " t")
        .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.vol) - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#666");

    // connect listener to map
    dispatch.on("brush.bar", (countryName) => {
        svg.selectAll(".bar").classed("dimmed", true);
        d3.select(`#bar-${countryName.replace(/\s+/g, '-')}`).classed("dimmed", false);
    });
    
    dispatch.on("unbrush.bar", () => {
        svg.selectAll(".bar").classed("dimmed", false);
    });
}

function drawSankey() {
    const {width, height, chartWidth, chartHeight} = getDimensions("#sankey-chart");
    const container = d3.select("#sankey-chart");
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top + 50})`);

    const sankeyData = {
        nodes: [
            { id: "Fresh Leaves" }, { id: "Withering" }, { id: "Oxidation" },
            { id: "Fixation (Firing/Steaming)" }, { id: "Green Tea" },
            { id: "White Tea" }, { id: "Oolong Tea" }, { id: "Black Tea" }
        ],
        links: [
            { source: "Fresh Leaves", target: "Withering", value: 100 },
            { source: "Withering", target: "White Tea", value: 10 },
            { source: "Withering", target: "Fixation (Firing/Steaming)", value: 30 },
            { source: "Fixation (Firing/Steaming)", target: "Green Tea", value: 30 },
            { source: "Withering", target: "Oxidation", value: 60 },
            { source: "Oxidation", target: "Oolong Tea", value: 20 },
            { source: "Oxidation", target: "Black Tea", value: 40 }
        ]
    };

    const nodeMap = new Map(sankeyData.nodes.map((d, i) => [d.id, i]));
    const links = sankeyData.links.map(l => ({
        source: nodeMap.get(l.source),
        target: nodeMap.get(l.target),
        value: l.value
    }));

    const sankeyFormat = d3.sankey()
        .nodeWidth(20)
        .nodePadding(40)
        .extent([[0, 0], [chartWidth, chartHeight - 100]]);
    
    const { nodes, links: sankeyLinks } = sankeyFormat({
        nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
        links: links
    });

    const color = d3.scaleOrdinal()
        .domain(["Green Tea", "White Tea", "Oolong Tea", "Black Tea", "Fresh Leaves", "Withering", "Oxidation", "Fixation (Firing/Steaming)"])
        .range(["#388e3c", "#e0e0e0", "#f57c00", "#3e2723", highlightColor, "#689f38", "#ef6c00", "#afb42b"]);

    svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.id))
        .attr("stroke", "#888");

    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(sankeyLinks)
        .join("path")
        .attr("class", "sankey-link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => color(d.source.id))
        .attr("stroke-width", d => Math.max(1, d.width));

    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < chartWidth / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < chartWidth / 2 ? "start" : "end")
        .text(d => d.id)
        .attr("fill", "#333");
}

function drawDumbbell() {
    const {width, height, chartWidth, chartHeight} = getDimensions("#dumbbell-chart");
    const container = d3.select("#dumbbell-chart");
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left + 60}, ${margin.top})`);
    
    let prodData = faoData
        .filter(d => d.Value)
        .map(d => ({ 
            country: d.Area === "China, mainland" ? "China" : d.Area, 
            iso: d["Area Code (M49)"], 
            production: +d.Value 
        }))
        .sort((a,b) => b.production - a.production)
        .slice(0, 10);
        
    prodData.forEach(d => {
        const expRow = comtradeData.find(c => c.reporterDesc === d.country || c.reporterISO === d.iso || (d.country === "China" && c.reporterDesc === "China"));
        d.export = expRow && expRow.netWgt ? (+expRow.netWgt / 1000) : 0;
    });

    const yScale = d3.scaleBand()
        .domain(prodData.map(d => d.country))
        .range([0, chartHeight])
        .padding(0.4);

    const maxVal = d3.max(prodData, d => d.production);
    const xScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, chartWidth - 100]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d / 1000 + "k t"));
        
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    svg.selectAll(".dumbbell-line")
        .data(prodData)
        .join("line")
        .attr("class", "dumbbell-line")
        .attr("y1", d => yScale(d.country) + yScale.bandwidth() / 2)
        .attr("y2", d => yScale(d.country) + yScale.bandwidth() / 2)
        .attr("x1", d => xScale(d.export))
        .attr("x2", d => xScale(d.production));

    svg.selectAll(".prod-dot")
        .data(prodData)
        .join("circle")
        .attr("class", "dumbbell-point prod")
        .attr("cy", d => yScale(d.country) + yScale.bandwidth() / 2)
        .attr("cx", d => xScale(d.production))
        .attr("r", 7)
        .on("mouseenter", (event, d) => {
            tooltip.style("display", "block").html(`Production: ${Math.round(d.production)} t`);
        })
        .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px"))
        .on("mouseleave", () => tooltip.style("display", "none"));

    svg.selectAll(".exp-dot")
        .data(prodData.filter(d => d.export > 0))
        .join("circle")
        .attr("class", "dumbbell-point exp")
        .attr("cy", d => yScale(d.country) + yScale.bandwidth() / 2)
        .attr("cx", d => xScale(d.export))
        .attr("r", 7)
        .on("mouseenter", (event, d) => {
            tooltip.style("display", "block").html(`Export: ${Math.round(d.export)} t`);
        })
        .on("mousemove", event => tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px"))
        .on("mouseleave", () => tooltip.style("display", "none"));
        
    const legend = svg.append("g").attr("transform", `translate(${chartWidth - 200}, 20)`);
    legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 6).attr("class", "dumbbell-point prod");
    legend.append("text").attr("x", 12).attr("y", 4).text("Production Vol.").style("font-size", "12px");
    
    legend.append("circle").attr("cx", 0).attr("cy", 20).attr("r", 6).attr("class", "dumbbell-point exp");
    legend.append("text").attr("x", 12).attr("y", 24).text("Export Vol.").style("font-size", "12px");
}

function drawLineChart() {
    const {width, height, chartWidth, chartHeight} = getDimensions("#line-chart");
    const container = d3.select("#line-chart");
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
    const parseTime = d3.timeParse("%YM%m");
    
    let cleanPrice = priceData.map(d => ({
        date: parseTime(d[""]),
        price: +d["Tea, avg 3 auctions"]
    })).filter(d => d.date && d.price);

    const xScale = d3.scaleTime()
        .domain(d3.extent(cleanPrice, d => d.date))
        .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cleanPrice, d => d.price)])
        .nice()
        .range([chartHeight, 0]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));
        
    svg.append("text")
        .attr("x", 10)
        .attr("y", 10)
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Price per kg (Nominal USD)");

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.price));

    svg.append("path")
        .datum(cleanPrice)
        .attr("fill", "none")
        .attr("stroke", highlightColor)
        .attr("stroke-width", 2)
        .attr("d", line);
}

function setupScrollama() {
    scroller.setup({
        step: ".step",
        offset: 0.5,
        debug: false
    })
    .onStepEnter(response => {
        d3.selectAll(".step").classed("is-active", false);
        d3.select(response.element).classed("is-active", true);
    });

    window.addEventListener("resize", scroller.resize);
}