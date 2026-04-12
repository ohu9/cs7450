// Our constants for this lab
const width = 900;
const height = 600;

// First, we select the area that our graph is going to live in
const svg = d3.select("#network-graph")
    // We set the viewbox to ensure that graph is using a coordinate system of the correct width and height
    // Otherwise, the nodes might show up off screen or might not center correctly
    .attr("viewBox", [0, 0, width, height]);

// Alright, first we gotta load in our nodes. Without knowing our nodes, how can we really match our links?
d3.csv("nodes.csv").then(nodes => {
    
    // With a successful list of nodes, now we need our links!
    d3.csv("links.csv").then(links => {
        
        // Now it's time to start setting up our simulation!
        const simulation = d3.forceSimulation(nodes)
            // For each link, go through and match the node ids, set the link distance to 100 so they're
            // spaced out properly
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            // Makes the nodes REPEL each other so they don't clump on top of one another or get too close
            .force("charge", d3.forceManyBody().strength(-250)) 
            // Keeps the graph centered at the center of the SVG. This helps ensure our graph is always
            // fully visible!
            .force("center", d3.forceCenter(width / 2, height / 2))
            // This creates a small amount of "gravity" in the center of our SVG. This makes the nodes
            // cluster a bit more and keeps them all in frame. It also stops lone nodes from floating away
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            // Makes sure that nodes collide so that 2 can't live in the same place at the same time!
            .force("collision", d3.forceCollide().radius(30));

        // Let's draw our link lines
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .join("line");

        // Now we create the base for each of our nodes
        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .join("g")
            // To add interactivity, we're adding some event listeners so that our graph knows
            // how to handle each part of the interaction
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // And of course, we need to add a color scale! Don't want a bunch of plain and boring circles!
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        // Next we draw the circles
        node.append("circle")
            .attr("r", 10)
            // And we use that color scale from earlier to encode the group that each node belongs to
            .attr("fill", d => colorScale(d.group));

        // Lastly, some labels! Otherwise who knows what each circle could be
        node.append("text")
            .text(d => d.id)
            .attr("x", 15)
            .attr("y", 5);

        // Here's that tick function we were talking about earlier! On each tick of our simulation:
        simulation.on("tick", () => {
            // The SVG should update each link
            link
                // By updating the starting and ending coordinates
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            // It should also update each node
            node
                // By translating the node to its new location
                .attr("transform", d => `translate(${d.x}, ${d.y})`);
        });

        // The best part of these types of graphs, is the interaction! So let's tell ours how to handle
        // being interacted with. First, when dragging a node starts
        function dragstarted(event, d) {
            // D3 simulations will start "cooling down" or stopping after a bit, this just gets it turned
            // back on if it needs to
            if (!event.active) simulation.alphaTarget(0.3).restart();
            // Update our node's location each time you move it so that it doesn't look like it's snapping
            // to the new location
            d.fx = d.x;
            d.fy = d.y;
        }

        // While being dragged
        function dragged(event, d) {
            // Keep updating that location!
            d.fx = event.x;
            d.fy = event.y;
        }

        // When the user is done dragging
        function dragended(event, d) {
            // It's ok for the simulation to start cooling down, it doesn't need to calculate
            // more physics if the user's not changing it
            if (!event.active) simulation.alphaTarget(0);
            // Release the fixed position and let the node move to where it naturally wants to go
            // based on the other forces in the graph acting on it
            d.fx = null;
            d.fy = null;
        }
    });
})


// CLASS ACTIVITY!!! (These generally get a little harder as you go down the list)

// 1) Some networks are directional, try treating our data as if it were and add arrows

// 2) Sometimes for networks, what you really want to see is the clusters, who's connecting to lots of other nodes. Try encoding this in
//      the radius of each node

// 3) Let's make the graph a little more useful to the user, try adding tooltips on hover to provide additional information about each node