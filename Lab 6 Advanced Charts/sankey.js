// Custom sizing variables for our sankey diagram
const sankeyPadding = 80;
const sankeyWidth = 700; 
const sankeyHeight = 600;

// We need to create a separate SVG for our sankey diagram and attach it to its specific div in the HTML file
const sankeysvg = d3.select("#sankey")
    .append("svg")
    .attr("width", sankeyWidth)
    .attr("height", sankeyHeight + sankeyPadding );

// Let's load our data!
d3.csv("students.csv").then(data => {
    // First  we need to transform our data into the format a sankey diagram requires. For this one, we will need
    // nodes, knowledge of if a node is a source or target, and links with those pairs. We'll start by mapping
    // our data so that we can attach the (Prev) and (Curr) labels to differentiate source and target nodes, then
    // creating a new set of them so that we get each unique node once (instead of having 50 Computing (Prev) nodes).
    // From this set, we are able to make an array, and now we have all previous and current colleges ready to become nodes!
    const prevColleges = Array.from(new Set(data.map(d => d.Previous_College + " (Prev)")));
    const currColleges = Array.from(new Set(data.map(d => d.Current_College + " (Curr)")));
    
    // Our allNodes constant is an array with all of the previous colleges and current colleges. We use the ... (spread operator)
    // to make sure that we are combining the two arrays into one big array instead of making an array of arrays. We then map over this array
    // to create an array of objects with a 'name' property, which is the format that the sankey diagram expects for its nodes.
    const allNodes = [...prevColleges, ...currColleges];
    const nodes = allNodes.map(name => ({ name: name}));

    // Now we must create our links so that we have pairs of source and target nodes. We need to map our data so that the
    // source and target are the INDEX of the node in our allNodes array, and then increase the value of that link based
    // on the number of times this pairing appears in our data
    const linkData = data.map(d => ({
        source: allNodes.indexOf(d.Previous_College + " (Prev)"),
        target: allNodes.indexOf(d.Current_College + " (Curr)"),
        value: +d.Count
    }));

    // Reminder that .sankey() is not native to D3, so we need to make sure we include the import in our HTML file!
    // This method easily computes the important information of our sankey diagram based on some parameters we give
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .size([sankeyWidth, sankeyHeight]);
    
    // We now need to assign all of our nodes and links into the sankey layout! Sometimes the sankey method will mutate
    // the original data, so we use Object.assign() to copy all of our original data to an empty object so that we can
    // keep the original data intact if needed.
    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: linkData.map(d => Object.assign({}, d))
    });

    // Now it's time to draw the diagram! First, let's draw the links by appending paths for each link in our graph
    const allLinks = sankeysvg.append("g")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("path")
        // To make the paths look more sankey-like, we can use the built in D3 method sankeyLinkHorizontal() to generate the d attribute
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("fill", "none")
        .attr("stroke", "navy")
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("opacity", 0.4);

    // We want to group all of our nodes together so that we can easily append both rectangles and labels to each node
    const allNodesSelection = sankeysvg.append("g")
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g")
    
    // Next we need to draw the rectangles for each node
    allNodesSelection.append("rect")
        // Our data now has x0, y0, x1, and y1 properties from the sankey method earlier (this is that mutation that was
        // mentioned before) so we can use these to position and size our rectangles!
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", "navy")
        .attr("stroke", "#000");

    // Lastly, we need to add our text labels so people know what each node is!
    allNodesSelection.append("text")
        // This is mostly styling so that the labels are position nicely, you can adjust as needed
        .attr("x", d => d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .style("font-size", "12px")
        .filter(d => d.x0 < sankeyWidth / 2)
        .attr("x", d => d.x1 + 6)
        .attr("text-anchor", "start");
});