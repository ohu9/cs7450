// Our margin and size contraints
const margin = { 
    top: 30, 
    right: 30, 
    bottom: 120, 
    left: 80 
};
const width = 500 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

// Select our scatterplot svg, size it, and create the internal part where our data will go
const svgScatter = d3.select("#scatterplot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Select our barchart svg, size it, and create the internal part where our data will go
const svgBar = d3.select("#barchart")
    .attr("width", width + margin.left + margin.right + 30)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left + 30},${margin.top})`);

// We create this so that when we zoom in, our dots stay within the internal part of our chart and don't go over
svgScatter.append("defs").append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("x", 1) 
    .attr("y", 0)
    .attr("width", width - 1)
    .attr("height", height - 1);

// Time to load our data! (Yes I did make it up)
d3.csv("countries.csv").then(data => {
    // Clean it up with some unary pluses
    data.forEach(d => {
        d.cheese_consumption = +d.cheese_consumption;
        d.life_exp = +d.life_exp;
    });

    // Create our x and y scales for the scatterplot based on our data
    const xScale = d3.scaleLinear().domain([0, d3.max(data, d => d.cheese_consumption) * 1.1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([50, 95]).range([height, 0]);

    // Create groupings for our axes for the scatterplot
    const xAxisG = svgScatter.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    const yAxisG = svgScatter.append("g")
        .call(d3.axisLeft(yScale));

    // An axis mean nothing if we don't know what they're encoding! ADD SOME LABELS!!
    svgScatter.append("text")
        .attr("x", width / 2).attr("y", height + 95).attr("text-anchor", "middle")
        .style("font-weight", "bold").text("Annual Cheese Consumption (kg)");

    svgScatter.append("text")
        .attr("transform", "rotate(-90)").attr("y", -60).attr("x", -height / 2).attr("text-anchor", "middle")
        .style("font-weight", "bold").text("Life Expectancy (Years)");

    // Now to draw our circles
    const circles = svgScatter.append('g')
        .attr("clip-path", "url(#chart-clip)")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.cheese_consumption))
        .attr("cy", d => yScale(d.life_exp))
        .attr("r", 0)
        .attr("fill", "none")
        .attr("opacity", 0.7);

    // Optional transitional flair
    circles.transition()
        .duration(1000)
        .delay((d, i) => i * 20)
        .attr("r", 6);

    // Time to make our barchart!
    // First let's make our x and y scales
    const xBar = d3.scaleBand().range([0, width]).padding(0.2);
    const yBar = d3.scaleLinear().range([height, 0]);
    // And our axes groupings
    const xAxisBar = svgBar.append("g").attr("transform", `translate(0,${height})`);
    const yAxisBar = svgBar.append("g");

    // Again, an axis ALWAYS NEEDS A LABEL!!!
    svgBar.append("text")
        .attr("x", width / 2).attr("y", height + 90).attr("text-anchor", "middle")
        .style("font-weight", "bold").text("Selected Countries");

    svgBar.append("text")
        .attr("transform", "rotate(-90)").attr("y", -65).attr("x", -height / 2).attr("text-anchor", "middle")
        .style("font-weight", "bold").text("Cheese Intake (kg)");

    // Now we need a method that updates our chart data, since we're dynamically changing it
    function updateBarChart(selectedData) {
        // Rescaling our axes based on the data that we have
        xBar.domain(selectedData.map(d => d.name));
        yBar.domain([0, d3.max(data, d => d.cheese_consumption)]);

        // We only want to create bars for the data that we have selected
        const bars = svgBar.selectAll(".bar")
            .data(selectedData, d => d.name);
        // Remember our enter - update - exit pattern? This gets rid of the old points we don't want anymore
        bars.exit()
            // With some more optional transition flair
            .transition()
            .duration(400)
            .attr("height", 0)
            .attr("y", height)
            .remove();

        // And this adds in our new ones based on our new selection!
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "#e67e22")
            .merge(bars)
            // With of course, some optional transition flair
            .transition()
            .duration(600)
            .attr("x", d => xBar(d.name))
            .attr("y", d => yBar(d.cheese_consumption))
            // Have to make sure that all of the bars fit inside of the chart! Can't have an ever increasing chart width
            .attr("width", xBar.bandwidth())
            .attr("height", d => height - yBar(d.cheese_consumption));

        // Country names tend to be rather long, so I rotated these ones so they don't blend together
        xAxisBar.call(d3.axisBottom(xBar)).selectAll("text")
            .attr("transform", "rotate(-90)").style("text-anchor", "end").attr("dx", "-.8em").attr("dy", ".15em");
        yAxisBar.call(d3.axisLeft(yBar));
    }

    // ZOOOOOOOOOOM
    const zoom = d3.zoom()
        // This sets the limit the user can zoom. We don't want them to be able to zoom OUT more than the default (1x), and there's a
        // point where zooming in isn't helpful anymore, so we're limiting them to 10x IN
        .scaleExtent([1, 10])
        // Every time the user zooms (like scrolling their mouse wheel)
        .on("zoom", (event) => {
            // Create new x and y scale copies that are rescaled based on how much the user has zoomed in
            const newX = event.transform.rescaleX(xScale);
            const newY = event.transform.rescaleY(yScale);
            // You need to tell the new axes to redraw themselves based on the scale or else your charts won't be accurate anymore!
            xAxisG.call(d3.axisBottom(newX));
            yAxisG.call(d3.axisLeft(newY));
            // Instead of making the circles "bigger", we instead move them farther apart to give the same visual effect of them "getting bigger"
            circles.attr("cx", d => newX(d.cheese_consumption)).attr("cy", d => newY(d.life_exp));
        });

    // Brushing!
    const brush = d3.brush()
        // We don't want the user to brush outside of the lines!
        .extent([[0, 0], [width, height]])
        // When the user is done brushing
        .on("brush end", (event) => {
            // If they don't actually end up creating a selection (i.e. when the user just clicks the graph to clear a selection)
            if (!event.selection) {
                // Reset the circles back to "unselected" look
                circles.attr("fill", "none");
                // Pass in an empty array to update the graph
                updateBarChart([]);
                return;
            }
            // Otherwise if they do actually make a selection, get the boundaries of it
            const [[x0, y0], [x1, y1]] = event.selection;
            // Because we have zooming and brushing, we need to find the current level of zoom
            const transform = d3.zoomTransform(svgScatter.node());
            // And now we get the current x and y values where the circles are at the current level of zoom
            const currX = transform.rescaleX(xScale);
            const currY = transform.rescaleY(yScale);

            // Get all of the circles that are within the selection boundaries
            const selected = data.filter(d => {
                const cx = currX(d.cheese_consumption);
                const cy = currY(d.life_exp);
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
            });
            // Fill them all in so that they are visually differentiated from the nonselected data points
            circles.attr("fill", d => selected.includes(d) ? "#e67e22" : "none");
            // Update the chart with the new selection of points
            updateBarChart(selected);
        });
    
    // Within our scatterplot, create a group with the class brush and running our brush constant
    svgScatter.append("g").attr("class", "brush").call(brush);
    // This attaches the zooming event to the inner part of our scatterplot as well, but tells it to not count clicking
    // part of our zoom, so that it can live harmoniously with our brush method
    svgScatter.call(zoom).on("mousedown.zoom", null);

    // Select our reset zoom button, when there is a click event
    d3.select("#reset-zoom").on("click", () => {
        // Fun Fact: zoomIdentity is a special D3 constant that represents a scale of 1 and a position of (0,0)
        // This line makes it so when you reset the chart, it slowly returns back to the zoomIdentity values
        // man transitions are so satisfying...
        svgScatter.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // Gotta call our method first to initialize it with nothing
    updateBarChart([]);
});



// CLASS ACTIVITY!!! (We're getting to the point where it's more important that you really understand what you're doing over trying
// a bunch of new things, so for this week, there's just one activity so you can really practice everything start to finish)

// 1) Add in a donut chart that is also linked to your scatterplot. It should display the distribution of cheese consumption for the
// selected data points. It should also contain a legend that shows both the country and the value of cheese consumption for each color
//
// If you really want to get fancy with it, try adding in some simple transitions to make the changes smoother
