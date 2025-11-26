function renderCorrelationChart(data) {
    d3.select("#correlation-chart").selectAll("*").remove();
    
    if (!data || !data.matrix) {
        d3.select("#correlation-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No correlation data available. Loading...");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#correlation-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins - more left space for horizontal labels, but centered
    const margin = { top: 50, right: 40, bottom: 120, left: 100 };
    const chartWidth = Math.max(400, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(400, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#correlation-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    const variables = data.variables || Object.keys(data.matrix);
    const cellSize = Math.min(chartWidth, chartHeight) / variables.length;
    
    // Helper function to create short labels with full names in tooltips
    function getShortLabel(fullName) {
        const abbreviations = {
            'GDP_Per_Capita': 'GDP/Cap',
            'Violent_Crime_Rate': 'Violent',
            'Property_Crime_Rate': 'Property',
            'Murder and nonnegligent manslaughter': 'Murder',
            'Forcible rape': 'Rape',
            'Robbery': 'Robbery',
            'Aggravated assault': 'Assault',
            'Burglary': 'Burglary',
            'Larceny-theft': 'Larceny',
            'Motor vehicle theft': 'Motor Theft',
            'Population': 'Population',
            'Real_GDP': 'Real GDP'
        };
        return abbreviations[fullName] || fullName.substring(0, 12);
    }
    
    // Color scale for correlation - better contrast
    const colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain([1, -1]);
    
    // Reverse variables so 1.00 (diagonal) appears at top-left
    const reversedVariables = [...variables].reverse();
    
    // Create grid - reversed so diagonal is at top
    reversedVariables.forEach((var1, i) => {
        reversedVariables.forEach((var2, j) => {
            // Map reversed indices to original matrix indices
            const origI = variables.length - 1 - i;
            const origJ = variables.length - 1 - j;
            
            const value = data.matrix[variables[origI]] && data.matrix[variables[origI]][variables[origJ]] !== undefined 
                ? data.matrix[variables[origI]][variables[origJ]] 
                : (origI === origJ ? 1 : 0);
            
            const cell = g.append("rect")
                .attr("x", j * cellSize)
                .attr("y", i * cellSize)
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("fill", colorScale(value))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .style("cursor", "pointer");
            
            // Add value text - only show if cell is large enough
            if (cellSize > 30) {
                g.append("text")
                    .attr("x", j * cellSize + cellSize / 2)
                    .attr("y", i * cellSize + cellSize / 2)
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "middle")
                    .attr("fill", Math.abs(value) > 0.5 ? "white" : "#e0e0e0")
                    .style("font-size", Math.max(9, Math.min(cellSize / 6, 12)) + "px")
                    .style("font-weight", "bold")
                    .style("pointer-events", "none")
                    .text(d3.format(".2f")(value));
            }
            
            // Add tooltip
            cell.on("mouseover", function(event) {
                d3.select(this)
                    .attr("stroke-width", 3)
                    .attr("stroke", "#667eea")
                    .attr("opacity", 0.9);
                
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
                    .style("position", "absolute")
                    .style("background", "rgba(0,0,0,0.95)")
                    .style("color", "white")
                    .style("padding", "12px")
                    .style("border-radius", "8px")
                    .style("font-size", "13px")
                    .style("z-index", "1000")
                    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.5)")
                    .style("border", "1px solid #667eea");
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                
                const correlationStrength = Math.abs(value);
                let strength = "Weak";
                let strengthColor = "#999";
                if (correlationStrength > 0.7) {
                    strength = "Strong";
                    strengthColor = "#4CAF50";
                } else if (correlationStrength > 0.4) {
                    strength = "Moderate";
                    strengthColor = "#FF9800";
                }
                
                const direction = value > 0 ? "positive" : value < 0 ? "negative" : "none";
                const directionIcon = value > 0 ? "↑" : value < 0 ? "↓" : "—";
                
                tooltip.html(`
                    <div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">
                        ${variables[origI]} ↔ ${variables[origJ]}
                    </div>
                    <div style="margin-bottom: 4px;">Correlation: <strong style="font-size: 16px;">${d3.format(".3f")(value)}</strong></div>
                    ${origI === origJ 
                        ? '<div style="font-size: 11px; color: #999; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">(Self-correlation - always 1.00)</div>'
                        : `<div style="font-size: 11px; color: ${strengthColor}; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                            ${directionIcon} ${strength} ${direction} correlation
                        </div>`
                    }
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke-width", 1.5)
                    .attr("stroke", "#fff")
                    .attr("opacity", 1);
                
                d3.selectAll(".tooltip").remove();
            });
        });
    });
    
    // Add axis labels with abbreviations and full names in tooltips
    reversedVariables.forEach((variable, i) => {
        const shortLabel = getShortLabel(variable);
        
        // X-axis labels (bottom) - show abbreviation, rotate for space
        const xLabel = g.append("text")
            .attr("x", i * cellSize + cellSize / 2)
            .attr("y", chartHeight + 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#e0e0e0")
            .style("font-size", "10px")
            .style("font-weight", "500")
            .attr("transform", `rotate(-45, ${i * cellSize + cellSize / 2}, ${chartHeight + 50})`)
            .text(shortLabel)
            .style("cursor", "help");
        
        // Add tooltip for full name
        xLabel.append("title").text(variable);
        
        // Y-axis labels (left) - show abbreviation horizontally
        const yLabel = g.append("text")
            .attr("x", -10)
            .attr("y", i * cellSize + cellSize / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("fill", "#e0e0e0")
            .style("font-size", "10px")
            .style("font-weight", "500")
            .text(shortLabel)
            .style("cursor", "help");
        
        // Add tooltip for full name
        yLabel.append("title").text(variable);
    });
    
    // Add legend with better styling - centered
    const legendWidth = 250;
    const legendHeight = 25;
    const legend = g.append("g")
        .attr("transform", `translate(${(chartWidth - legendWidth) / 2}, ${chartHeight + 80})`);
    
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "correlation-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");
    
    for (let i = 0; i <= 20; i++) {
        const value = -1 + (2 * i / 20);
        gradient.append("stop")
            .attr("offset", `${i * 5}%`)
            .attr("stop-color", colorScale(value));
    }
    
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#correlation-gradient)")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("rx", 3);
    
    // Add legend labels
    legend.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text("Correlation Coefficient");
    
    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 15)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("-1.0");
    
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("0.0");
    
    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "end")
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("1.0");
    
    // Add correlation strength guide - centered
    const guideY = chartHeight + 120;
    const guideStartX = (chartWidth - 300) / 2;
    
    g.append("text")
        .attr("x", guideStartX)
        .attr("y", guideY)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("Strength: ");
    
    g.append("text")
        .attr("x", guideStartX + 50)
        .attr("y", guideY)
        .attr("fill", "#4CAF50")
        .style("font-size", "9px")
        .style("font-weight", "500")
        .text("Strong (>0.7)");
    
    g.append("text")
        .attr("x", guideStartX + 130)
        .attr("y", guideY)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("|");
    
    g.append("text")
        .attr("x", guideStartX + 140)
        .attr("y", guideY)
        .attr("fill", "#FF9800")
        .style("font-size", "9px")
        .style("font-weight", "500")
        .text("Moderate (0.4-0.7)");
    
    g.append("text")
        .attr("x", guideStartX + 240)
        .attr("y", guideY)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .text("|");
    
    g.append("text")
        .attr("x", guideStartX + 250)
        .attr("y", guideY)
        .attr("fill", "#999")
        .style("font-size", "9px")
        .style("font-weight", "500")
        .text("Weak (<0.4)");
}
