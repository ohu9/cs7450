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