d3.json("assignments.json").then(data => {

    const assignmentsContainer = document.getElementById('assignments-list');

    data.forEach(assignment => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Link svg from heroicons.com
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items: center;">
            <h3>${assignment.title}</h3>
                <span style="display:flex; flex-direction: row; align-items: center; gap: 10px; color:#4b5563; font-size:0.9rem;">
                    <p style="margin-left: 10px; font-weight:bold; font-size:0.9rem;">Due: ${assignment.due}</p>
                    ${assignment.link ? 
                        `<a href="${assignment.link}" target="_blank">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="blue" style="width: 1.25rem; height: 1.25rem;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                        </a>` 
                        : ''}
                </span>
            </div>
            <details>
                <summary><strong>Assignment Details</strong></summary>
                <p>${assignment.details}</p>
            </details>
        `;
        assignmentsContainer.appendChild(card);
    });
});


d3.csv("hw2-papers.csv").then(data => {

    const readingsContainer = document.getElementById('readings-list');
    data.forEach(paper => {
        const card = document.createElement('div');
        card.className = 'paper-card';
        
        // clean up titles
        const titleText = paper.Paper.replace(/^"|"$/g, '').trim();

        // create card for reading 
        card.innerHTML = `
            <div class="paper-topic">${paper.Topic || 'General'}</div>
            <h3 class="paper-title">
                <a href="${paper.Link}" target="_blank">${titleText}</a>
            </h3>
            <div class="paper-meta">
                Week ${paper.Week} – ${paper.Date}
            </div>
        `;
        // add card to list
        readingsContainer.appendChild(card);
    });
});

// BAR CHART
const data = [
    { label: 'HW Assignments', value: 30 },
    { label: 'Reading Presentation', value: 15 },
    { label: 'Reading Reflection', value: 10 },
    { label: 'Research Prototype', value: 35 },
    { label: 'Class Engagement', value: 10 }
];

const width = 600;
const height = 400;
const margin = { top: 20, right: 20, bottom: 20, left: 50 };

const container = d3.select('#grade-viz-container')

const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`)
    .style("fill", "red");

// Scales
const xScale = d3.scaleLinear()
    .domain([0, 50])
    .range([0, width - margin.left - margin.right]);

const yScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, height - margin.top - margin.bottom])
    .padding(0.2);

const color = d3.scaleOrdinal()
  .domain(data.map(d => d.label))
  .range(d3.schemeTableau10);

// Draw marks
const bars = g.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", margin.left)
    .attr("y", d => yScale(d.label))
    .attr("width", d => xScale(d.value))
    .attr("height", yScale.bandwidth())
    .attr("fill", d => color(d.label))
    .attr("opacity", 0.8);

// Tooltips
d3.select("#grade-viz-container").style("position", "relative");

const tooltips = d3.select("#grade-viz-container")
    .selectAll(".tooltip")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("left", d => `${margin.left + xScale(d.value) + width / 4}px`)
    .style("top", d => `${margin.top + yScale(d.label) + yScale.bandwidth() / 2 - 15}px`)
    .html(d => `${d.label}: ${d.value}%`);


// Axes
const xAxis = g.append("g")
	.attr("transform", `translate(${margin.left}, ${height - margin.bottom - margin.top})`)
	.call(d3.axisBottom(xScale));

const yAxis = g.append("g")
	.attr("transform", `translate(${margin.left}, 0)`)
	.call(d3.axisLeft(yScale));

xAxis.append("text")
	.attr("x", width / 2 - margin.left)
	.attr("y", 40)
	.text("Percentage (%)")
    .style("text-anchor", "middle")
    .style("font-size", "10pt")
    .style("fill", "black");

// Interaction
bars.on("mouseover", (event, d) => {
    d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .style("opacity", 1);
        
    // Find the corresponding tooltip and change its opacity
    tooltips.filter(t => t === d)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
})
.on("mouseout", (event, d) => {
    d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .style("opacity", 0.8);
        
    // Hide the corresponding tooltip
    tooltips.filter(t => t === d)
        .transition()
        .duration(500)
        .style("opacity", 0);
});


