const data = [
    { x: 30,  y: 20,  value: 10, category: "A", label: "Label A" },
    { x: 85,  y: 60,  value: 25, category: "B", label: "Label B" },
    { x: 50,  y: 40,  value: 15, category: "A", label: "Label A" },
    { x: 15,  y: 80,  value: 5,  category: "C", label: "Label C" },
    { x: 90,  y: 10,  value: 30, category: "B", label: "Label B" },
    { x: 60,  y: 90,  value: 20, category: "C", label: "Label C" },
    { x: 15,  y: 40,  value: 15, category: "D", label: "Label D" },
    { x: 45,  y: 60,  value: 15,  category: "A", label: "Label A" },
    { x: 40,  y: 25,  value: 20, category: "B", label: "Label B" },
    { x: 30,  y: 50,  value: 25, category: "C", label: "Label C" },
    { x: 70,  y: 50,  value: 12, category: "D", label: "Label D" }
];

const padding = 80;
const width = 600;
const height = 400;

const svg = d3.select("#vis")
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
    .attr("x", padding-15)
    .attr("y", height+15)
    .text("(0,0)");

svg.append("text")
    .attr("x", width)
    .attr("y", height+20)
    .text("100 (X)");

svg.append("text")
    .attr("x", 20)
    .attr("y", 20)
    .text("100 (Y)");

svg.selectAll("g")
    .data(data)
    .join("g")
    .append("circle")
    .attr("cx", d => (d.x * 5.5) + padding)
    .attr("cy", d => height - (d.y * 3.8))
    .attr("r", d => d.value)
    .style("fill", d => {
        switch (d.category) {
            case "A": return "lightblue";
            case "B": return "steelblue";
            case "C": return "darkseagreen";
            case "D": return "darkcyan"
            default: return "gray"
            }
    })
    .style("stroke", "black");

// CLASS ACTIVITY!
// 1) add hover functionality to the circles
// 2) change colors based on data category
// 3) add labels for the data that appear next to the circle
// 4) create a button that when clicked assigned rank created 

svg.selectAll("g")
    .data(data)
    .append("text")
    .attr("x", d => (d.x * 5.5) + padding + 25)
    .attr("y", d => height - (d.y * 3.8) + d.value)
    .attr("class", "label")
    .text(d => d.label);