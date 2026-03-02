// Custom sizing variables for our treemap
const treePadding = 80;
const treeWidth = 700; 
const treeHeight = 600;

// We need to create a separate SVG for our treemap and attach it to its specific div in the HTML file
const treemapsvg = d3.select("#treemap")
    .append("svg")
    .attr("width", treeWidth)
    .attr("height", treeHeight + treePadding );

// Let's load our data!
d3.csv("students.csv").then(data => {
    // First we need to transform our data into the correct format for a treemap. We start with D3's rollup() method, which is
    // a good way to quickly group things hierarchically and do some sort of aggregation. In this case, we are saying that we
    // want to first group our data by Current_College, then by Current_Major, and lastly keep a count of how many data points
    // fall into that grouping
    const grouping = d3.rollup(data, v => d3.sum(v, d => +d.Count), d => d.Current_College, d=> d.Current_Major);

    // Next we need one root variable that has all of our data together in a hierarchy. We can use D3's hierarchy() method to do
    // this. This method will take our nested grouping from the rollup() method and convert it into the format that a treemap needs
    const root = d3.hierarchy(grouping)
        // The sum() method tells our treemap how we want to size the rectangles, in our case we want to do so by d[1] (which is
        // the count of students in each grouping)
        .sum(d => d[1])
        // The sort() method just makes our treemap look nicer by sorting the rectangles from largest to smallest
        .sort((a, b) => b.value - a.value);

    // We can now use D3's treemap() method to computer those x0, y0, x1, and y1 properties that are needed!
    const treemap = d3.treemap()
        .size([treeWidth, treeHeight])
        .padding(1)
        (root);

    // Now we need to create each individual node of data in our treemap! We start by selecting all of the smallest nodes
    // (i.g. the leaves) and append a group element to each so we can have both the rectangle and the label together.
    const nodes = treemapsvg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Now we append our rectangle
    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", "navy") 
        .attr("stroke", "white");

    // Now we append our text labels! In our data, d.data[0] is the name of the major associated with that rectangle
    nodes.append("text")
        .attr("x", 5)
        .attr("y", 20)
        .text(d => d.data[0]) 
        .attr("font-size", "10px")
        .attr("fill", "white");
});


