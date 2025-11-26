function renderRadarChart(data, selectedMetrics = null) {
    d3.select("#radar-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#radar-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .html("Select state(s) from the main filter above to see radar chart(s).");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#radar-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 60, right: 60, bottom: 80, left: 60 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    const radius = Math.min(chartWidth, chartHeight) / 2 - 40;
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    const svg = d3.select("#radar-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${centerX}, ${centerY})`);
    
    // Define all available metrics
    const allMetrics = [
        { 
            name: "GDP Per Capita", 
            accessor: d => (d.gdpPerCapita || 0) / 1000, 
            max: (d3.max(data, d => d.gdpPerCapita || 0) || 150000) / 1000,
            format: d => `$${d3.format(".0f")(d)}K`,
            metricKey: 'GDP_Per_Capita'
        },
        { 
            name: "Violent Crime Rate", 
            accessor: d => d.violentCrimeRate || 0, 
            max: d3.max(data, d => d.violentCrimeRate || 0) || 400,
            format: d => d3.format(".1f")(d),
            metricKey: 'Violent_Crime_Rate'
        },
        { 
            name: "Property Crime Rate", 
            accessor: d => d.propertyCrimeRate || 0, 
            max: d3.max(data, d => d.propertyCrimeRate || 0) || 2000,
            format: d => d3.format(".0f")(d),
            metricKey: 'Property_Crime_Rate'
        },
        { 
            name: "Murder", 
            accessor: d => d.murder || 0, 
            max: d3.max(data, d => d.murder || 0) || 10,
            format: d => d3.format(".2f")(d),
            metricKey: 'Murder and nonnegligent manslaughter'
        },
        { 
            name: "Rape", 
            accessor: d => d.rape || 0, 
            max: d3.max(data, d => d.rape || 0) || 50,
            format: d => d3.format(".1f")(d),
            metricKey: 'Forcible rape'
        },
        { 
            name: "Robbery", 
            accessor: d => d.robbery || 0, 
            max: d3.max(data, d => d.robbery || 0) || 200,
            format: d => d3.format(".1f")(d),
            metricKey: 'Robbery'
        },
        { 
            name: "Assault", 
            accessor: d => d.assault || 0, 
            max: d3.max(data, d => d.assault || 0) || 300,
            format: d => d3.format(".1f")(d),
            metricKey: 'Aggravated assault'
        },
        { 
            name: "Burglary", 
            accessor: d => d.burglary || 0, 
            max: d3.max(data, d => d.burglary || 0) || 800,
            format: d => d3.format(".0f")(d),
            metricKey: 'Burglary'
        },
        { 
            name: "Larceny", 
            accessor: d => d.larceny || 0, 
            max: d3.max(data, d => d.larceny || 0) || 1500,
            format: d => d3.format(".0f")(d),
            metricKey: 'Larceny-theft'
        },
        { 
            name: "Motor Theft", 
            accessor: d => d.motorTheft || 0, 
            max: d3.max(data, d => d.motorTheft || 0) || 400,
            format: d => d3.format(".1f")(d),
            metricKey: 'Motor vehicle theft'
        }
    ];
    
    // Filter metrics based on selection
    let metrics = allMetrics;
    if (selectedMetrics && selectedMetrics.length > 0) {
        metrics = allMetrics.filter(m => selectedMetrics.includes(m.metricKey));
    }
    
    // Always include at least one metric
    if (metrics.length === 0) {
        metrics = allMetrics.slice(0, 5);
    }
    
    const angleSlice = (Math.PI * 2) / metrics.length;
    
    // Create scales
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, 1]);
    
    // Draw concentric grid circles with labels
    const gridLevels = 5;
    for (let j = 1; j <= gridLevels; j++) {
        const gridRadius = radius * (j / gridLevels);
        g.append("circle")
            .attr("r", gridRadius)
            .attr("fill", "none")
            .attr("stroke", j === gridLevels ? "#555" : "#333")
            .attr("stroke-width", j === gridLevels ? 1.5 : 0.5)
            .attr("stroke-dasharray", j === gridLevels ? "none" : "2,2");
        
        // Add value labels on one axis (top)
        if (j === gridLevels) {
            const labelValue = (j / gridLevels) * 100;
            g.append("text")
                .attr("x", 0)
                .attr("y", -gridRadius - 5)
                .attr("text-anchor", "middle")
                .attr("fill", "#999")
                .style("font-size", "9px")
                .text(`${labelValue}%`);
        }
    }
    
    // Draw axes and grid
    metrics.forEach((metric, i) => {
        const angle = (angleSlice * i) - (Math.PI / 2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Draw axis line
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "#666")
            .attr("stroke-width", 1.5);
        
        // Draw axis label with better positioning
        const labelX = x * 1.2;
        const labelY = y * 1.2;
        g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("fill", "#e0e0e0")
            .style("font-size", "11px")
            .style("font-weight", "500")
            .text(metric.name);
        
        // Add value labels along axis
        for (let j = 1; j <= 4; j++) {
            const labelRadius = radius * (j / 4);
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;
            const value = (metric.max * j) / 4;
            
            g.append("text")
                .attr("x", labelX * 1.05)
                .attr("y", labelY * 1.05)
                .attr("text-anchor", "middle")
                .attr("fill", "#999")
                .style("font-size", "8px")
                .style("opacity", 0.7)
                .text(metric.format(value));
        }
    });
    
    // Color palette for multiple states
    const colors = d3.schemeCategory10;
    const extendedColors = [
        ...colors,
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e',
        '#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#a29bfe'
    ];
    
    // Draw data for each state
    data.forEach((d, idx) => {
        const pathData = metrics.map((metric, i) => {
            const angle = (angleSlice * i) - (Math.PI / 2);
            const value = metric.max > 0 ? (metric.accessor(d) / metric.max) : 0;
            const r = rScale(value);
            return {
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                value: metric.accessor(d),
                rawValue: metric.accessor(d),
                name: metric.name,
                normalizedValue: value,
                format: metric.format
            };
        });
        
        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveLinearClosed);
        
        const stateColor = extendedColors[idx % extendedColors.length];
        
        // Draw area with gradient
        const defs = svg.append("defs");
        const gradientId = `radar-gradient-${idx}`;
        const gradient = defs.append("radialGradient")
            .attr("id", gradientId)
            .attr("cx", "50%")
            .attr("cy", "50%")
            .attr("r", "50%");
        
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", stateColor)
            .attr("stop-opacity", 0.4);
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", stateColor)
            .attr("stop-opacity", 0.1);
        
        // Draw area
        const areaPath = g.append("path")
            .datum(pathData)
            .attr("d", line)
            .attr("fill", `url(#${gradientId})`)
            .attr("stroke", stateColor)
            .attr("stroke-width", 2.5)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this)
                    .attr("fill-opacity", 0.6)
                    .attr("stroke-width", 4);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("fill-opacity", 1)
                    .attr("stroke-width", 2.5);
            });
        
        // Draw points with better styling
        pathData.forEach((pointData, pointIdx) => {
            const point = g.append("circle")
                .attr("cx", pointData.x)
                .attr("cy", pointData.y)
                .attr("r", 5)
                .attr("fill", stateColor)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseover", function(event) {
                    d3.select(this).attr("r", 8);
                    
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
                        .style("border", `2px solid ${stateColor}`);
                    
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                        <div style="font-weight: bold; margin-bottom: 6px; color: ${stateColor}; font-size: 14px;">
                            ${d.state}
                        </div>
                        <div style="margin-bottom: 3px;"><strong>${pointData.name}:</strong></div>
                        <div style="margin-bottom: 3px;">Value: ${pointData.format(pointData.rawValue)}</div>
                        <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                            Normalized: ${(pointData.normalizedValue * 100).toFixed(1)}%
                        </div>
                    `)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", 5);
                    d3.selectAll(".tooltip").remove();
                });
        });
    });
    
    // Add legend for multiple states - horizontal layout at bottom
    if (data.length > 1) {
        const legendY = centerY + radius + 50;
        const legendStartX = centerX - ((data.length - 1) * 60) / 2;
        
        data.forEach((d, idx) => {
            const legendX = legendStartX + idx * 60;
            const stateColor = extendedColors[idx % extendedColors.length];
            
            const legendItem = g.append("g")
                .attr("transform", `translate(${legendX - centerX}, ${legendY - centerY})`);
            
            legendItem.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", stateColor)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .attr("rx", 2);
            
            legendItem.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .attr("fill", "#e0e0e0")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .text(d.state.length > 10 ? d.state.substring(0, 8) + "..." : d.state);
        });
    } else if (data.length === 1) {
        // Single state - show label above chart
        g.append("text")
            .attr("x", 0)
            .attr("y", -radius - 20)
            .attr("text-anchor", "middle")
            .attr("fill", extendedColors[0])
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text(data[0].state);
        
        // Add summary below
        const avgValue = d3.mean(metrics, m => {
            const val = m.accessor(data[0]);
            return m.max > 0 ? (val / m.max) * 100 : 0;
        });
        
        g.append("text")
            .attr("x", 0)
            .attr("y", radius + 40)
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .style("font-size", "11px")
            .text(`Average Score: ${avgValue.toFixed(1)}%`);
    }
}
