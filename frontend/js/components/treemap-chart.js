function renderTreemapChart(data) {
    d3.select("#treemap-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#treemap-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see treemap.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#treemap-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 50, right: 100, bottom: 50, left: 50 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#treemap-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Prepare hierarchical data structure
    const root = {
        name: "root",
        children: data.map(state => ({
            name: state.name,
            value: state.value || 0,
            avgCrimeRate: state.avgCrimeRate || 0,
            children: (state.children || []).map(county => ({
                name: county.name,
                value: county.value || county.crimeRate || 0,
                crimeRate: county.crimeRate || 0
            }))
        }))
    };
    
    // Create hierarchy
    const hierarchy = d3.hierarchy(root)
        .sum(d => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));
    
    // Create treemap layout
    const treemap = d3.treemap()
        .size([chartWidth, chartHeight])
        .padding(3)
        .round(true);
    
    treemap(hierarchy);
    
    // Color scale based on crime rate
    const maxCrimeRate = d3.max(data, d => d.avgCrimeRate || 0);
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, maxCrimeRate || 1]);
    
    // Get all leaf nodes (counties) and parent nodes (states)
    const nodes = hierarchy.descendants();
    const stateNodes = nodes.filter(d => d.depth === 1);
    const countyNodes = nodes.filter(d => d.depth === 2);
    
    // Calculate summary statistics
    const totalPopulation = d3.sum(stateNodes, d => d.value || 0);
    const avgCrimeRate = d3.mean(stateNodes, d => {
        const stateData = data.find(s => s.name === d.data.name);
        return stateData?.avgCrimeRate || 0;
    });
    
    // Add summary at top
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text(`Total Population: ${totalPopulation.toLocaleString()} | Avg Crime Rate: ${avgCrimeRate.toFixed(2)}`);
    
    // Draw state-level cells with better styling
    const stateCells = g.selectAll("g.state-cell")
        .data(stateNodes)
        .enter()
        .append("g")
        .attr("class", "state-cell")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("cursor", "pointer");
    
    stateCells.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => {
            const stateData = data.find(s => s.name === d.data.name);
            return stateData ? colorScale(stateData.avgCrimeRate) : "#2a2a2a";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("rx", 2)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("stroke-width", 4)
                .attr("stroke", "#667eea")
                .attr("opacity", 0.9);
            
            const stateData = data.find(s => s.name === d.data.name);
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
            const percentage = ((d.value || 0) / totalPopulation * 100).toFixed(1);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">
                    ${d.data.name}
                </div>
                <div style="margin-bottom: 3px;">Population: <strong>${(d.value || 0).toLocaleString()}</strong></div>
                <div style="margin-bottom: 3px;">Percentage: <strong>${percentage}%</strong></div>
                <div style="margin-bottom: 3px;">Avg Crime Rate: <strong>${(stateData?.avgCrimeRate || 0).toFixed(2)}</strong></div>
                <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                    Counties: ${d.children?.length || 0}
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 2)
                .attr("stroke", "#fff")
                .attr("opacity", 1);
            d3.selectAll(".tooltip").remove();
        })
        .on("click", function(event, d) {
            // Toggle county visibility on click
            const countyGroup = d3.select(this.parentNode).select(".counties-group");
            if (countyGroup.empty()) {
                // Show counties
                const counties = d.children || [];
                const countyGroup = d3.select(this.parentNode)
                    .append("g")
                    .attr("class", "counties-group");
                
                counties.forEach(county => {
                    countyGroup.append("rect")
                        .attr("x", county.x0 - d.x0)
                        .attr("y", county.y0 - d.y0)
                        .attr("width", county.x1 - county.x0)
                        .attr("height", county.y1 - county.y0)
                        .attr("fill", d => {
                            const parentState = data.find(s => s.name === d.parent.data.name);
                            if (parentState) {
                                const countyData = parentState.children?.find(c => c.name === county.data.name);
                                return countyData ? colorScale(countyData.crimeRate || 0) : "#1a1a1a";
                            }
                            return "#1a1a1a";
                        })
                        .attr("stroke", "#667eea")
                        .attr("stroke-width", 1)
                        .attr("opacity", 0.9)
                        .datum(county);
                });
            } else {
                // Hide counties
                countyGroup.remove();
            }
        });
    
    // Add state labels with better styling
    stateCells.append("text")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-size", d => {
            const size = Math.min(d.x1 - d.x0, d.y1 - d.y0);
            return size > 80 ? "16px" : size > 60 ? "14px" : size > 40 ? "12px" : size > 25 ? "10px" : "0px";
        })
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
        .text(d => {
            const name = d.data.name;
            const size = Math.min(d.x1 - d.x0, d.y1 - d.y0);
            if (size < 25) return "";
            if (size < 40) {
                // Use abbreviation for small cells
                const stateNameToAbbr = {
                    'CALIFORNIA': 'CA', 'TEXAS': 'TX', 'FLORIDA': 'FL', 'NEW YORK': 'NY',
                    'PENNSYLVANIA': 'PA', 'ILLINOIS': 'IL', 'OHIO': 'OH', 'GEORGIA': 'GA',
                    'NORTH CAROLINA': 'NC', 'MICHIGAN': 'MI'
                };
                return stateNameToAbbr[name.toUpperCase()] || name.substring(0, 3).toUpperCase();
            }
            return name.length > 15 ? name.substring(0, 12) + "..." : name;
        });
    
    // Add population labels for large states
    stateCells.append("text")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2 + 15)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#ccc")
        .style("font-size", d => {
            const size = Math.min(d.x1 - d.x0, d.y1 - d.y0);
            return size > 80 ? "11px" : size > 60 ? "10px" : "0px";
        })
        .style("pointer-events", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
        .text(d => {
            const size = Math.min(d.x1 - d.x0, d.y1 - d.y0);
            if (size > 60) {
                const pop = d.value || 0;
                return pop >= 1000000 ? `${(pop / 1000000).toFixed(1)}M` : pop >= 1000 ? `${(pop / 1000).toFixed(0)}K` : pop.toLocaleString();
            }
            return "";
        });
    
    // Draw county-level cells (initially visible)
    const countyCells = g.selectAll("g.county-cell")
        .data(countyNodes)
        .enter()
        .append("g")
        .attr("class", "county-cell")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("cursor", "pointer");
    
    countyCells.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => {
            const parentState = data.find(s => s.name === d.parent.data.name);
            if (parentState) {
                const county = parentState.children?.find(c => c.name === d.data.name);
                return county ? colorScale(county.crimeRate || 0) : "#1a1a1a";
            }
            return "#1a1a1a";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .style("opacity", 0.85)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("stroke-width", 2)
                .attr("stroke", "#667eea")
                .attr("opacity", 1);
            
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
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">
                    ${d.data.name}
                </div>
                <div style="margin-bottom: 3px;">State: <strong>${d.parent.data.name}</strong></div>
                <div style="margin-bottom: 3px;">Population: <strong>${(d.value || 0).toLocaleString()}</strong></div>
                <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                    Crime Rate: ${(d.data.crimeRate || 0).toFixed(2)}
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 0.5)
                .attr("stroke", "#333")
                .attr("opacity", 0.85);
            d3.selectAll(".tooltip").remove();
        });
    
    // Add enhanced legend with better styling
    const legend = g.append("g")
        .attr("transform", `translate(${chartWidth - 80}, 20)`);
    
    const legendScale = d3.scaleLinear()
        .domain([0, maxCrimeRate || 1])
        .range([0, 100]);
    
    // Color gradient for legend
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "treemap-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");
    
    for (let i = 0; i <= 20; i++) {
        const value = (maxCrimeRate * i) / 20;
        gradient.append("stop")
            .attr("offset", `${i * 5}%`)
            .attr("stop-color", colorScale(value));
    }
    
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 100)
        .style("fill", "url(#treemap-gradient)")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("rx", 3);
    
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => d.toFixed(0));
    
    legend.append("g")
        .attr("transform", "translate(20, 0)")
        .call(legendAxis)
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "10px");
    
    legend.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -25)
        .attr("x", -50)
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text("Crime Rate");
    
    // Add instructions
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 30)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "10px")
        .text("Click on a state to toggle county view • Hover for details");
}
