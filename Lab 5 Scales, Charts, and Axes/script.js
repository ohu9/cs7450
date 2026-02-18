const data = 
[
  { name: "A", value: 12, value2: 6 },
  { name: "B", value: 28, value2: 7 },
  { name: "C", value: 7,  value2: 36 },
  { name: "D", value: 35, value2: 42 },
  { name: "E", value: 19, value2: 44 },
  { name: "F", value: 42, value2: 13 }
];

// MARGIN CONVENTIONS
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const outerWidth = 900;
const outerHeight = 420;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;


const svg = d3.select("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

// step 2: clean data

// step 3: build scales
const x = d3.scaleBand()
	.domain(data.map(d => d.name))
	.range([0, width])
	.padding(0.2);

const y = d3.scaleLinear()
	.domain([0, d3.max(data, d => d.value)])
	.range([height, 0]);

const color = d3.scaleOrdinal()
  .domain(data.map(d => d.name))
  .range(d3.schemeTableau10);

// step 4: draw marks
const bars = g.selectAll("rect")
	.data(data)
	.enter()
	.append("rect")
	.attr("x", d => x(d.name))
	.attr("y", d => y(d.value))
	.attr("width", x.bandwidth())
	.attr("height", d => height - y(d.value))
  .style("fill", d => color(d.name))
  .style("opacity", 0.8);

const tooltips = g.selectAll("g")
  .data(data)
  .enter()
  .append("g");

tooltips
  .append("rect")
    .attr("width", (width - margin.left - margin.right) / 6 - 20)
    .attr("height", 20)
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value) - 23)
    .style("fill", "white");

tooltips
  .append("text")
    .text(d => "Value: " + d.value)
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value) - 11);

// step 5: add axes
g.append("g")
	.attr("transform", `translate(0, ${height})`)
	.call(d3.axisBottom(x));

g.append("g")
	.call(d3.axisLeft(y));
	
// step 6: add interaction
bars.on("mouseover", (event, d) => {
	d3.select(event.currentTarget)
    .transition()
    .style("opacity", 1)
    .duration(150);
});

bars.on("mouseout", (event, d) => {
  d3.select(event.currentTarget)
    .transition()
    .style("opacity", 0.8)
    .duration(150);
})
