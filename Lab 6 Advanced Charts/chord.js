// Custom sizing variables for our chord diagram
const chordPadding = 80;
const chordWidth = 700; 
const chordHeight = 600;

const chordsvg = d3.select("#chord")
    .append("svg")
    .attr("width", chordWidth)
    .attr("heigh", chordHieght)

    d3.csv("students.csv").then(data => {
        const majors = Array.from(new Set([
                ...data.map(d => d.Previous_Major),
                ...data.map(d => d.Current_Major)
        ]))

        const num = majors.length;
        const matrix = Array.from({length: num}, () => Array(num).fill(0));
        const index = new Map(majors.map((name, i) => [name, i]));

        const majorCollege = new Map();
        data.forEach(d => {
            majortoCollege.set(d.Current_Major, d.CurrentCollege);
        })

        data.forEach( d=> {
            matrix[index.get(d.Previous_Major)][index.get(d.Current_Major)] += +d.Count;
        })

        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);
        
            const innerRadius = Math.min(chordWidth, chordHeight) * 0.3;
            const outerRadius = innerRadius + 20;

            const chords = chord(matrix);

            const container = chordsvg.append("g")
                .attr("transform", `translate(${chordWidth/2}, ${chordHeight/2 + 50})`);
            
            const ribbonGenerator = d3.ribbon().radius(innerRadius);

            const ribbons = container.append("g"
                    .selectAll("path")
                    .data(chords)
                    .enter()
                    .append("path")
                    .attr("d", ribbonGenerator)
                    .attr("fill", "navy")
                    .attr("opacity", 0.7)
            )
            
            const arcGenerator = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

            const groups = container.append("g")
                .selectAll("g")
                .data(chords.groups)
                .enter()
                .append("g");
            
            groups.append("path")
                .attr("fill", "navy")
                .attr("stroke", "white")
                .attr("d", arcGenerator);
            
            groups.append("text")
                .each( d => {d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr("dy", ".35em")
                .attr("transform", d => `
                    rotate${(d.angle * 180 / Math.PI - 90)})
                    translate(${outerRadius + 10})
                    ${d.angle > Math.PI ? "rotate(180)" : ""}
                    `)
                .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
                .text(d => majors[d.index])
                .style("font-size", "10px")
    })
