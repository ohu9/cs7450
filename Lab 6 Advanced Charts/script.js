// Main control file for controlling which chart is displayed. This is only activated when the dropdown
// menu is changed, and makes it seem like the charts are swapping in and out
d3.select("#chart-select").on("change", function(e) {
    const selected = e.target.value;

    if (selected === "treemap") {
        d3.select("#treemap").style("display", "block");
        d3.select("#chord").style("display", "none");
        d3.select("#sankey").style("display", "none");
    } else if (selected === "chord") {
        d3.select("#treemap").style("display", "none");
        d3.select("#chord").style("display", "block");
        d3.select("#sankey").style("display", "none");
    } else if (selected === "sankey") {
        d3.select("#treemap").style("display", "none");
        d3.select("#chord").style("display", "none");
        d3.select("#sankey").style("display", "block");
    }
});


// CLASS ACTIVITY!!! (These generally get a little harder as you go down the list)

// 1) See if you can get your labels to dynamically size based on the size of the rectangle in your treemap!

// 2) Try adding a legend to your treemap so users know which colors correspond to which colleges

// 3) Try changing the colors of the paths in your chord and sankey diagrams so they match the color of the 
//    major/college they're associated with 

// 4) Work ahead and try adding some interactivity! When hovering over a box or group in each of your diagrams
//    try highlighting it or the paths connected to it while dimming the rest of the diagram!