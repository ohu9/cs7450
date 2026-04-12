const scroller = scrollama();
const width = window.innerWidth;
const height = window.innerHeight;
const baseRadius = 8; 
const padding = 6;
const cols = 10;
const colorMatrix = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"

const sadnessGroups = [
    "In Denial", 
    "Holding it Together", 
    "Kinda Sad", 
    "Very Sad", 
    "Bawling"
];

const data = d3.range(47).map(i => {
    return {
        id: i,
        actualSadness: i % 5,
        grade: Math.floor(Math.random() * 50) + 50,   
        sadnessLevel: Math.random() * 100 
    };
});

const gridWidth = cols * (baseRadius * 4);
const offsetX = (width - gridWidth) / 2;
const offsetY = height * 0.2;

const radiusScale = d3.scaleLinear().domain([50, 100]).range([4, 16]);

const colorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(["#B3A369", "#003057", "#42a5f5"]); 

const xScale = d3.scaleLinear().domain([0, 100]).range([100, width - 100]);

const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

const defs = svg.append("defs");
const filter = defs.append("filter").attr("id", "goo");
filter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", 8).attr("result", "blur");
filter.append("feColorMatrix").attr("in", "blur").attr("mode", "matrix").attr("values", colorMatrix).attr("result", "goo");
filter.append("feBlend").attr("in", "SourceGraphic").attr("in2", "goo");

const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height / 2 + 100})`)
    .style("opacity", 0)
    .call(d3.axisBottom(xScale));

const xAxisLabel = svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2 + 140)
    .style("opacity", 0)
    .attr("text-anchor", "middle")
    .style("font-family", "sans-serif")
    .style("font-weight", "bold")
    .text("Level of Sadness (Tears per Minute)");

const groupLabels = svg.selectAll(".group-label")
    .data(d3.range(5))
    .join("text")
    .attr("class", "group-label")
    .attr("x", d => (width / 6) * (d + 1))
    .attr("y", height / 2 - 120)
    .attr("text-anchor", "middle")
    .style("opacity", 0)
    .style("font-family", "sans-serif")
    .style("font-weight", "bold")
    .style("fill", "#555")
    .text(d => sadnessGroups[d]);

const circleGroup = svg.append("g");

const nodes = circleGroup.selectAll("circle")
    .data(data, d => d.id)
    .join("circle")
    .attr("cx", width / 2)
    .attr("cy", -50) 
    .attr("r", baseRadius)
    .attr("fill", "#003057");

const simulation = d3.forceSimulation(data)
    .force("collide", d3.forceCollide().radius(d => radiusScale(d.grade) + 2).iterations(2))
    .on("tick", () => {
        nodes.attr("cx", d => d.x).attr("cy", d => d.y);
    })
    .stop();

function handleStepEnter(response) {
    const t = d3.transition().duration(1000).ease(d3.easeCubicInOut);

    circleGroup.style("filter", "none");

    xAxis.transition(t).style("opacity", response.index === 2 ? 1 : 0);
    xAxisLabel.transition(t).style("opacity", response.index === 2 ? 1 : 0);
    groupLabels.transition(t).style("opacity", response.index === 1 ? 1 : 0);

    switch(response.index) {
        case 0:
            simulation.stop();
            nodes.transition(t)
                .attr("cx", d => { d.x = (d.id % cols) * (baseRadius * 4) + offsetX; return d.x; })
                .attr("cy", d => { d.y = Math.floor(d.id / cols) * (baseRadius * 4) + offsetY; return d.y; })
                .attr("r", d => radiusScale(d.grade))
                .attr("fill", "#003057");
            break;

        case 1:
            nodes.transition(t)
                .attr("r", d => radiusScale(d.grade))
                .attr("fill", d => colorScale(d.sadnessLevel));
            
            simulation
                .force("x", d3.forceX(d => (width / 6) * (d.actualSadness + 1)).strength(0.08))
                .force("y", d3.forceY(height / 2).strength(0.08))
                .force("collide", d3.forceCollide().radius(d => radiusScale(d.grade) + 2))
                .alpha(1).restart();
            break;

        case 2:
            nodes.transition(t)
                .attr("r", d => radiusScale(d.grade))
                .attr("fill", d => colorScale(d.sadnessLevel)); 

            simulation
                .force("x", d3.forceX(d => xScale(d.sadnessLevel)).strength(0.2))
                .force("y", d3.forceY(height / 2).strength(0.05))
                .force("collide", d3.forceCollide().radius(d => radiusScale(d.grade) + 1.5))
                .alpha(1).restart();
            break;

        case 3:
            circleGroup.style("filter", "url(#goo)");
            
            nodes.transition(t)
                .attr("r", baseRadius) 
                .attr("fill", "#42a5f5");

            simulation
                .force("x", d3.forceX(width / 2).strength(0.02)) 
                .force("y", d3.forceY(height - 20).strength(0.3)) 
                .force("collide", d3.forceCollide().radius(baseRadius + 1))
                .alpha(1).restart();
            break;
    }
}

scroller
    .setup({ step: ".step", offset: 0.5, debug: false })
    .onStepEnter(handleStepEnter);

window.addEventListener("resize", () => {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
    scroller.resize();
});