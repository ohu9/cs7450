// Our margin and size contraints
const margin = { 
    top: 30, 
    right: 30, 
    bottom: 120, 
    left: 80 
};
const width = 500 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

// Select our scatterplot svg, size it, and create the internal part where our data will go
const svgScatter = d3.select("#scatterplot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Select our barchart svg, size it, and create the internal part where our data will go
const svgBar = d3.select("#barchart")
    .attr("width", width + margin.left + margin.right + 30)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + 30},${margin.top})`);

    svgScatter.append("defs").append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("x", 1)
        .attr("y", 0)
        .attr("width", width - 1)
        .attr("height", height - 1);
    

// Time to load our data! (Yes I did make it up)
d3.csv("countries.csv").then(data => {
    data.forEach(d => {
        d.cheese_consumption = +d.cheese_consumption;
        d.life_exp = +d.life_exp;
    });

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cheese_consumption) * 1.1])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([50, 95])
        .range([height, 0]);
    
    const xAxisG = svgScatter.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));
    
    const yAxisG = svgScatter.append("g")
        .call(d3.axisLeft(yScale));
    
    svgScatter.append("text")
        .attr("x", width / 2)
        .attr("y", height + 95)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Annual Cheese Consumption (kg)");
    
    svgScatter.append("text")
        .attr("transform", "roate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Life Expectancy (Years)");

    const circle = svgScatter.append("g")
        .attr("clip=path", "url(#chart-clip")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.cheese_consumption))
        .attr("cy", d => yScale(d.life_exp))
        .attr("r", 0)
        .attr("fill", "none")
        .attr("opacity", 0.7);
    
    circles.transition()
        .duration(1000)
        .delay((d,i) => i * 20)
        .attr("r", 6);
    
    const xBar = d3.scaleBand()
        .range([0, width])
        .padding(0.2);
    
    const yBar = d3.scaleLinear()
        .range([height, 0]);
    
    const xAxisBar = svgBar.append("g")
        .attr("transform", `translate(0,${height})`)
    
    const yAxisBar = svgBar.append("g");

    svgBar.append("text")
        .attr("x", width / 2)
        .attr("y", height + 90)
        .attr("text-anchor", "middle")
        .str("font-weight", "bold")
        .text("Selected Countries");
});