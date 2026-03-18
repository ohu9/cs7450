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


// Time to load our data! (Yes I did make it up)
d3.csv("countries.csv").then(data => {
    
});