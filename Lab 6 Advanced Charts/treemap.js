// Custom sizing variables for our treemap
const treePadding = 80;
const treeWidth = 700; 
const treeHeight = 600;

const treemapsvg = d3.select("#treemap")
    .attr("width", treeWidth)
    .attr("height", treeHeight)

d3.csv("students.csv").then(data => {
    const grouping = d3.rollup(data, v => d3.sum(v, d => +d.Count), d => d.Current_Major)

    const root = d3.hierarchy(grouping)
        .sum(d => d[1])
        .sort((a,b) => b.value - a.value);
    
    const treemap = d3.treemap()
        .size([treeWidth, treeHeight])
        .padding(1)
        (root);

        // const nodes = treemapsvg.selectAll("g")
        //     .data(root.leaves())
        //     .enter()
        //     .append("g")
        //     .attr("transform", d => `translate(${d.x0}, ${d.y0})`)

        // nodes.append("rect")
        //     .attr("width", d => d.x1 - d.x0)
        //     .attr("height", d => d.y1 - d.y0)
        //     .attr("fill", "navy")
        //     .attr("stroke", "white")
    
        // nodes.append("text")
        //     .attr("x", 4)
        //     .attr("y", 20)
        //     .text(d => d.data[0])
})