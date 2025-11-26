function renderParallelCoords(data, selectedMetrics = null) {
    d3.select("#parallel-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#parallel-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see parallel coordinates.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#parallel-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 50, right: 40, bottom: 50, left: 60 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#parallel-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Define all available dimensions
    const allDimensions = [
        { name: "GDP Per Capita", accessor: d => d.gdp, format: d => `$${d3.format(".0f")(d)}`, metricKey: 'GDP_Per_Capita' },
        { name: "Violent Crime", accessor: d => d.violentCrime, format: d => d3.format(".1f")(d), metricKey: 'Violent_Crime_Rate' },
        { name: "Property Crime", accessor: d => d.propertyCrime, format: d => d3.format(".1f")(d), metricKey: 'Property_Crime_Rate' },
        { name: "Murder", accessor: d => d.murder || 0, format: d => d3.format(".1f")(d), metricKey: 'Murder and nonnegligent manslaughter' },
        { name: "Rape", accessor: d => d.rape || 0, format: d => d3.format(".1f")(d), metricKey: 'Forcible rape' },
        { name: "Robbery", accessor: d => d.robbery || 0, format: d => d3.format(".1f")(d), metricKey: 'Robbery' },
        { name: "Assault", accessor: d => d.assault || 0, format: d => d3.format(".1f")(d), metricKey: 'Aggravated assault' },
        { name: "Burglary", accessor: d => d.burglary || 0, format: d => d3.format(".1f")(d), metricKey: 'Burglary' },
        { name: "Larceny", accessor: d => d.larceny || 0, format: d => d3.format(".1f")(d), metricKey: 'Larceny-theft' },
        { name: "Motor Theft", accessor: d => d.motorTheft || 0, format: d => d3.format(".1f")(d), metricKey: 'Motor vehicle theft' },
        { name: "Population", accessor: d => d.population, format: d => d3.format(".2s")(d), metricKey: 'Population' }
    ];
    
    // Filter dimensions based on selected metrics
    let dimensions = allDimensions;
    if (selectedMetrics && selectedMetrics.length > 0) {
        dimensions = allDimensions.filter(dim => selectedMetrics.includes(dim.metricKey));
    }
    
    // Always include at least GDP and Population for context
    const essentialMetrics = ['GDP_Per_Capita', 'Population'];
    essentialMetrics.forEach(key => {
        if (!dimensions.find(d => d.metricKey === key)) {
            const essential = allDimensions.find(d => d.metricKey === key);
            if (essential) dimensions.unshift(essential);
        }
    });
    
    const x = d3.scalePoint()
        .domain(dimensions.map(d => d.name))
        .range([0, chartWidth])
        .padding(0.5);
    
    const y = {};
    dimensions.forEach(dim => {
        const values = data.map(dim.accessor);
        y[dim.name] = d3.scaleLinear()
            .domain(d3.extent(values))
            .nice()
            .range([chartHeight, 0]);
    });
    
    // Add background grid for each axis
    dimensions.forEach(dim => {
        const axisG = g.append("g")
            .attr("class", "axis-background")
            .attr("transform", `translate(${x(dim.name)},0)`);
        
        // Add subtle background rectangle
        axisG.append("rect")
            .attr("x", -30)
            .attr("y", 0)
            .attr("width", 60)
            .attr("height", chartHeight)
            .attr("fill", "#1a1a1a")
            .attr("opacity", 0.3);
    });
    
    // Draw axes with better styling
    dimensions.forEach(dim => {
        const axisG = g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${x(dim.name)},0)`);
        
        // Add axis line
        axisG.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "#666")
            .attr("stroke-width", 2);
        
        // Add axis ticks and labels
        axisG.append("g")
            .call(d3.axisLeft(y[dim.name]).ticks(5))
            .attr("stroke", "#666")
            .selectAll("text")
            .attr("fill", "#e0e0e0")
            .style("font-size", "10px");
        
        // Add axis title with better styling
        axisG.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -15)
            .attr("fill", "#e0e0e0")
            .style("font-size", "11px")
            .style("font-weight", "500")
            .text(dim.name);
        
        // Add brush for filtering (interactive)
        const brush = d3.brushY()
            .extent([[-30, 0], [30, chartHeight]])
            .on("brush", function(event) {
                const selection = event.selection;
                if (selection) {
                    const [y0, y1] = selection.map(y[dim.name].invert);
                    const filtered = data.filter(d => {
                        const value = dim.accessor(d);
                        return value >= y0 && value <= y1;
                    });
                    highlightLines(filtered);
                } else {
                    resetLines();
                }
            })
            .on("end", function(event) {
                if (!event.selection) {
                    resetLines();
                }
            });
        
        axisG.append("g")
            .attr("class", "brush")
            .call(brush);
    });
    
    // Draw lines with better styling
    const line = d3.line()
        .x(d => x(d.dimension))
        .y(d => y[d.dimension](d.value))
        .curve(d3.curveMonotoneX);
    
    // Color scale for lines based on violent crime rate
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain(d3.extent(data, d => d.violentCrime));
    
    const path = g.selectAll(".line")
        .data(data.slice(0, 200)) // Increased limit for better visualization
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => {
            const points = dimensions.map(dim => ({
                dimension: dim.name,
                value: dim.accessor(d)
            }));
            return line(points);
        })
        .style("fill", "none")
        .style("stroke", d => colorScale(d.violentCrime))
        .style("stroke-width", 1.5)
        .style("opacity", 0.4)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("stroke-width", 4)
                .style("opacity", 1)
                .style("stroke", "#667eea");
            
            // Dim other lines
            g.selectAll(".line")
                .filter(function(lineData) { return lineData !== d; })
                .style("opacity", 0.1);
            
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("background", "rgba(0,0,0,0.95)")
                .style("color", "white")
                .style("padding", "12px")
                .style("border-radius", "8px")
                .style("font-size", "12px")
                .style("z-index", "1000")
                .style("box-shadow", "0 4px 12px rgba(0,0,0,0.5)")
                .style("border", "2px solid #667eea");
            
            tooltip.transition().duration(200).style("opacity", 1);
            
            let tooltipContent = `<div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">${d.county}, ${d.state}</div>`;
            dimensions.forEach(dim => {
                const value = dim.accessor(d);
                tooltipContent += `<div style="margin-bottom: 3px;"><strong>${dim.name}:</strong> ${dim.format(value)}</div>`;
            });
            
            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .style("stroke-width", 1.5)
                .style("opacity", 0.4)
                .style("stroke", d => colorScale(d.violentCrime));
            
            // Restore other lines
            g.selectAll(".line")
                .style("opacity", 0.4);
            
            d3.selectAll(".tooltip").remove();
        });
    
    // Helper functions for brushing
    function highlightLines(filtered) {
        const filteredSet = new Set(filtered.map(d => `${d.county}-${d.state}`));
        g.selectAll(".line")
            .style("opacity", d => {
                return filteredSet.has(`${d.county}-${d.state}`) ? 0.8 : 0.1;
            })
            .style("stroke-width", d => {
                return filteredSet.has(`${d.county}-${d.state}`) ? 2.5 : 1;
            });
    }
    
    function resetLines() {
        g.selectAll(".line")
            .style("opacity", 0.4)
            .style("stroke-width", 1.5);
    }
    
    // Add legend for color scale
    const legendWidth = 200;
    const legendHeight = 15;
    const legend = g.append("g")
        .attr("transform", `translate(${(chartWidth - legendWidth) / 2}, ${chartHeight + 30})`);
    
    const legendScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.violentCrime))
        .range([0, legendWidth]);
    
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "parallel-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");
    
    for (let i = 0; i <= 20; i++) {
        const value = d3.extent(data, d => d.violentCrime)[0] + 
            (d3.extent(data, d => d.violentCrime)[1] - d3.extent(data, d => d.violentCrime)[0]) * (i / 20);
        gradient.append("stop")
            .attr("offset", `${i * 5}%`)
            .attr("stop-color", colorScale(value));
    }
    
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#parallel-gradient)")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("rx", 3);
    
    legend.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("fill", "#e0e0e0")
        .style("font-size", "10px")
        .style("font-weight", "500")
        .text("Violent Crime Rate");
    
    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 12)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text(d3.format(".0f")(d3.min(data, d => d.violentCrime)));
    
    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 12)
        .attr("text-anchor", "end")
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text(d3.format(".0f")(d3.max(data, d => d.violentCrime)));
}
