// Our constants for this lab
const width = 900;
const height = 600;

// Alright, first we gotta load in our nodes. Without knowing our nodes, how can we really match our links?
d3.csv("nodes.csv").then(nodes => {
    
    // With a successful list of nodes, now we need our links!
    d3.csv("links.csv").then(links => {
        
        // NOW WHAT?!?
    });
})


// CLASS ACTIVITY!!! (These generally get a little harder as you go down the list)

// 1) Some networks are directional, try treating our data as if it were and add arrows

// 2) Sometimes for networks, what you really want to see is the clusters, who's connecting to lots of other nodes. Try encoding this in
//      the radius of each node

// 3) Let's make the graph a little more useful to the user, try adding tooltips on hover to provide additional information about each node