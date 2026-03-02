// Custom sizing variables for our chord diagram
const chordPadding = 80;
const chordWidth = 700; 
const chordHeight = 600;

// We need to create a separate SVG for our chord diagram and attach it to its specific div in the HTML file
const chordsvg = d3.select("#chord")
    .append("svg")
    .attr("width", chordWidth)
    .attr("height", chordHeight + chordPadding);

// Let's load our data!
d3.csv("students.csv").then(data => {

    // For our chord diagram, we will need an N x N matrix that shows the flow from each major to every other major. To do
    // this, we first map our data to get a list of all unique previous and current majors, and create an array for us to
    // reference when building the matrix
    const majors = Array.from(new Set([
        ...data.map(d => d.Previous_Major),
        ...data.map(d => d.Current_Major)
    ]));

    // Next we need to create the matrix, where N is the number of unique majors we have. We first create an empty matrix
    // of size num x num that is filled with zeroes
    const num = majors.length;
    const matrix = Array.from({length: num}, () => Array(num).fill(0));
    // We then create a map of major name and its corresponding index in the matrix for easier reference later
    const index = new Map(majors.map((name, i) => [name, i]));
    
    // Now we loop through our data and create a map of which majors belong to which college for easier reference later
    const majorToCollege = new Map();
    data.forEach(d => {
        majorToCollege.set(d.Current_Major, d.Current_College);
    });

    // Lastly, we loop through our data again and fill in the matrix with the count of students flowing from each previous
    // major to each current major. We are able to use our index map to easily know the correct row and column to update
    data.forEach(d => {
        matrix[index.get(d.Previous_Major)][index.get(d.Current_Major)] += +d.Count;
    });

    // Now we can use D3's chord() method to compute the necessary information for our chord diagram based on our matrix!
    const chord = d3.chord()
        .padAngle(0.05)
        // We are sorting the subgroups in descending order so that the largest flows are closest to the outer edge of the 
        // diagram and are easier to see
        .sortSubgroups(d3.descending);

    // We need some inner and outer radius parameters so we know how large to make our diagram
    const innerRadius = Math.min(chordWidth, chordHeight) * 0.3;
    const outerRadius = innerRadius + 20;
    const chords = chord(matrix);

    // Now we can start drawing our diagram. First we create a container group element that holds the rest of our diagram
    const container = chordsvg.append("g")
        .attr("transform", `translate(${chordWidth / 2}, ${(chordHeight / 2) + 50})`);

    // Next we generate our ribbons using D3's ribbon() method, which creates the curved paths between the arcs based on 
    // the parameters we use
    const ribbonGenerator = d3.ribbon().radius(innerRadius);

    // We draw all of our ribbons using paths, and use the ribbon generator to create the d attribute for us!
    const ribbons = container.append("g")
        .selectAll("path")
        .data(chords)
        .enter()
        .append("path")
        .attr("d", ribbonGenerator)
        .attr("fill", "navy")
        .attr("opacity", 0.7)
        .attr("stroke", "none");

    // Now we need to draw our arcs (outer parts of the diagram), so first we need a generator so they look nice!
    const arcGenerator = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // We create a group for each arc so that we can have the ribbon path and the arc label together
    const groups = container.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter()
        .append("g");
    
    // We then append our arc paths and use the arc generator to create the d attribute for us!
    groups.append("path")
        .attr("fill", "navy")
        .attr("stroke", "white")
        .attr("d", arcGenerator)

    // Lastly, we need to add labels so people know what each arc represents!
    groups.append("text")
        // These are mostly just styling so that the labels stick out from the arcs and oriented nicely, you can adjust as needed
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
        .text(d => majors[d.index])
        .style("font-size", "10px")
        .style("font-family", "sans-serif");
});