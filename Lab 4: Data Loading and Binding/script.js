const padding = 80;
const width = 500; 
const height = 500;

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + padding)
    .attr("height", height + padding);

svg.append("line")
    .attr("x1", padding)
    .attr("y1", 0)
    .attr("x2", padding)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

svg.append("line")
    .attr("x1", padding)
    .attr("y1", height)
    .attr("x2", width)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

svg.append("text")
    .attr("x", padding - 15)
    .attr("y", height + 15)
    .text("0");

svg.append("text")
    .attr("x", width)
    .attr("y", height + 20)
    .text("Lvl 50 Attack");

svg.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .text("Lvl 50 HP");

const cleanDigimon = d => {
    return {
        name: d.Digimon,
        hp: +d["Lv 50 HP"],
        atk: +d["Lv50 Atk"],
        memory: +d.Memory
    }
}

d3.csv("Digimon.csv", cleanDigimon).then(data => {

    const slider = d3.select("#data-slider");
    const label = d3.select("#slider-value");

    function updateChart(limit) {

        const subset = data.slice(0, limit);
        label.text(limit);

        svg.selectAll("circle")
            .data(subset)
            .join("circle")
            .attr("cx", d => ((d.atk - 50) / (350 - 50) * 500) + padding)
            .attr("cy", d => height - ((d.hp - 500) / (2100 - 500) * 500))
            .attr("r", d => d.memory)
            .style("fill", "blue")
            .style("stroke", "black")
            .style("opacity", 0.7)

    }

    updateChart(slider.property("value"))

    // event listener called updateChart whenever slider is moved
    slider.on("input", function() {
        updateChart(this.value);
    })
})
// /* 

// CLASS ACTIVITY!!! (These generally get a little harder as you go down the list)

// 1) Add some more interactivity, let the user pick what stats they want to see on each axis and for the size of the bubble!

// 2) Get some practice with key functions by adding a tooltip that appears when you hover over a bubble that shows the name of the Digimon and its stats

// 3) Work ahead of schedule and try to implement dynamic axes that update when the user changes the stats being shown

// 4) Work even further ahead and see if you can implement a simple animation when the axes change!

// */