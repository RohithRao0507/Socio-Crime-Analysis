function renderScatterChart(data, selectedMetrics = null, yMetric = 'violentCrimeRate') {
    // Clear previous chart
    d3.select("#scatter-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#scatter-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see relationships.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#scatter-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 50, right: 40, bottom: 60, left: 80 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#scatter-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Metric configuration
    const metricConfig = {
        'violentCrimeRate': {
            accessor: d => d.violentCrime || 0,
            label: 'Violent Crime Rate (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateYlOrRd)
        },
        'propertyCrimeRate': {
            accessor: d => d.propertyCrime || 0,
            label: 'Property Crime Rate (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateYlGnBu)
        },
        'murder': {
            accessor: d => d.murder || 0,
            label: 'Murder (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateReds)
        },
        'rape': {
            accessor: d => d.rape || 0,
            label: 'Rape (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateOranges)
        },
        'robbery': {
            accessor: d => d.robbery || 0,
            label: 'Robbery (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateReds)
        },
        'assault': {
            accessor: d => d.assault || 0,
            label: 'Assault (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateYlOrRd)
        },
        'burglary': {
            accessor: d => d.burglary || 0,
            label: 'Burglary (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateBlues)
        },
        'larceny': {
            accessor: d => d.larceny || 0,
            label: 'Larceny (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateGreens)
        },
        'motorTheft': {
            accessor: d => d.motorTheft || 0,
            label: 'Motor Theft (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolatePurples)
        }
    };
    
    const config = metricConfig[yMetric] || metricConfig['violentCrimeRate'];
    
    // Set scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.gdp))
        .nice()
        .range([0, chartWidth]);
    
    const yMax = d3.max(data, config.accessor);
    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .nice()
        .range([chartHeight, 0]);
    
    // Color scale based on selected metric
    const colorScale = config.colorScale.domain([0, yMax]);
    
    // Add grid lines
    g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-chartHeight)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#333")
        .attr("stroke-dasharray", "2,2")
        .attr("opacity", 0.5);
    
    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-chartWidth)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#333")
        .attr("stroke-dasharray", "2,2")
        .attr("opacity", 0.5);
    
    // Add axes with better styling
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `$${d3.format(".0s")(d)}`))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px");
    
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 45)
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("GDP Per Capita ($)");
    
    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d3.format(".0f")(d)))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px");
    
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -chartHeight / 2)
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text(config.label);
    
    // Add trend line (linear regression)
    const n = data.length;
    const sumX = d3.sum(data, d => d.gdp);
    const sumY = d3.sum(data, config.accessor);
    const sumXY = d3.sum(data, d => d.gdp * config.accessor(d));
    const sumXX = d3.sum(data, d => d.gdp * d.gdp);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const trendLine = [
        { x: d3.min(data, d => d.gdp), y: slope * d3.min(data, d => d.gdp) + intercept },
        { x: d3.max(data, d => d.gdp), y: slope * d3.max(data, d => d.gdp) + intercept }
    ];
    
    g.append("line")
        .datum(trendLine)
        .attr("x1", d => xScale(d.x))
        .attr("x2", d => xScale(trendLine[1].x))
        .attr("y1", d => yScale(d.y))
        .attr("y2", d => yScale(trendLine[1].y))
        .attr("stroke", "#667eea")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.7);
    
    // Calculate correlation
    const meanX = sumX / n;
    const meanY = sumY / n;
    const varianceX = d3.sum(data, d => Math.pow(d.gdp - meanX, 2)) / n;
    const varianceY = d3.sum(data, d => Math.pow(config.accessor(d) - meanY, 2)) / n;
    const covariance = d3.sum(data, d => (d.gdp - meanX) * (config.accessor(d) - meanY)) / n;
    const correlation = covariance / Math.sqrt(varianceX * varianceY);
    
    // Add correlation info
    g.append("text")
        .attr("x", chartWidth - 10)
        .attr("y", 20)
        .attr("text-anchor", "end")
        .attr("fill", "#999")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text(`Correlation: ${correlation.toFixed(3)}`);
    
    // Add dots with better styling
    g.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.gdp))
        .attr("cy", d => yScale(config.accessor(d)))
        .attr("r", 4)
        .attr("fill", d => colorScale(config.accessor(d)))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("r", 7)
                .attr("stroke-width", 2.5)
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
            
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            
            const metricValue = config.accessor(d);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">
                    ${d.county}, ${d.state}
                </div>
                <div style="margin-bottom: 3px;">GDP Per Capita: <strong>$${d.gdp.toLocaleString()}</strong></div>
                <div style="margin-bottom: 3px;">${config.label.split('(')[0].trim()}: <strong>${config.format(metricValue)}</strong></div>
                <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                    Violent Crime: ${(d.violentCrime || 0).toFixed(2)} | Property Crime: ${(d.propertyCrime || 0).toFixed(2)}
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("r", 4)
                .attr("stroke-width", 1)
                .attr("opacity", 1);
            
            d3.selectAll(".tooltip").remove();
        });
    
    // Add color legend
    const legendWidth = 20;
    const legendHeight = 100;
    const legend = g.append("g")
        .attr("transform", `translate(${chartWidth + 10}, ${chartHeight - legendHeight})`);
    
    const legendScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([legendHeight, 0]);
    
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "scatter-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");
    
    for (let i = 0; i <= 20; i++) {
        const value = (yMax * i) / 20;
        gradient.append("stop")
            .attr("offset", `${i * 5}%`)
            .attr("stop-color", colorScale(value));
    }
    
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#scatter-gradient)")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("rx", 3);
    
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => d3.format(".0f")(d));
    
    legend.append("g")
        .attr("transform", "translate(20, 0)")
        .call(legendAxis)
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "10px");
}
