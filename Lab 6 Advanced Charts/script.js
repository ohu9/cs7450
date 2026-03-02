// Main control file for controlling which chart is displayed. This is only activated when the dropdown
// menu is changed, and makes it seem like the charts are swapping in and out
d3.select("#chart-select").on("change", function(e) {
    const selected = e.target.value;

    if (selected === "barchart") {
        d3.select("#barchart").style("display", "block");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "none");
        d3.select("#piechart").style("display", "none");
    } else if (selected === "scatterplot") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "block");
        d3.select("#linechart").style("display", "none");
        d3.select("#piechart").style("display", "none");
    } else if (selected === "linechart") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "block");
        d3.select("#piechart").style("display", "none");
    } else if (selected === "piechart") {
        d3.select("#barchart").style("display", "none");
        d3.select("#scatterplot").style("display", "none");
        d3.select("#linechart").style("display", "none");
        d3.select("#piechart").style("display", "block");
    }
});