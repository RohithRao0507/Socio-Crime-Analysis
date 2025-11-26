function renderTimelineChart(data, selectedMetrics = null, metric = 'violentCrimeRate') {
    // Clear previous chart
    d3.select("#timeline-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#timeline-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see trends.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#timeline-chart").node();
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
    
    const svg = d3.select("#timeline-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Define all available metrics with better colors
    const allMetrics = [
        { key: 'violentCrimeRate', label: 'Violent Crime Rate', color: '#e74c3c', dataKey: 'Violent_Crime_Rate', format: d => d.toFixed(2) },
        { key: 'propertyCrimeRate', label: 'Property Crime Rate', color: '#3498db', dataKey: 'Property_Crime_Rate', format: d => d.toFixed(2) },
        { key: 'murder', label: 'Murder', color: '#8e44ad', dataKey: 'Murder and nonnegligent manslaughter', format: d => d.toFixed(2) },
        { key: 'rape', label: 'Forcible Rape', color: '#e67e22', dataKey: 'Forcible rape', format: d => d.toFixed(2) },
        { key: 'robbery', label: 'Robbery', color: '#c0392b', dataKey: 'Robbery', format: d => d.toFixed(2) },
        { key: 'assault', label: 'Aggravated Assault', color: '#d35400', dataKey: 'Aggravated assault', format: d => d.toFixed(2) },
        { key: 'burglary', label: 'Burglary', color: '#16a085', dataKey: 'Burglary', format: d => d.toFixed(2) },
        { key: 'larceny', label: 'Larceny-Theft', color: '#27ae60', dataKey: 'Larceny-theft', format: d => d.toFixed(2) },
        { key: 'motorTheft', label: 'Motor Vehicle Theft', color: '#2980b9', dataKey: 'Motor vehicle theft', format: d => d.toFixed(2) },
        { key: 'gdpPerCapita', label: 'GDP Per Capita', color: '#f39c12', dataKey: 'GDP_Per_Capita', transform: d => d / 1000, format: d => `$${d.toFixed(0)}K` }
    ];
    
    // Get the selected metric
    const selectedMetric = allMetrics.find(m => m.key === metric) || allMetrics[0];
    
    // Prepare data for selected metric
    const metricData = data.map(d => ({
        year: d.year,
        value: selectedMetric.transform ? selectedMetric.transform(d[selectedMetric.key]) : (d[selectedMetric.key] || 0)
    }));
    
    // Set scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .nice()
        .range([0, chartWidth]);
    
    const yMax = d3.max(metricData, d => d.value);
    const yScale = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .nice()
        .range([chartHeight, 0]);
    
    // Add grid lines with better styling
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
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px")
        .style("font-weight", "500");
    
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 45)
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Year");
    
    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => selectedMetric.key === 'gdpPerCapita' ? `$${d3.format(".0s")(d)}` : d3.format(".0f")(d)))
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
        .text(selectedMetric.label);
    
    // Define line generator with smooth curves
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    // Add gradient for line
    const defs = svg.append("defs");
    const gradientId = `line-gradient-${selectedMetric.key}`;
    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "100%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", selectedMetric.color)
        .attr("stop-opacity", 0.8);
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", selectedMetric.color)
        .attr("stop-opacity", 0.4);
    
    // Draw area under line with gradient
    const area = d3.area()
        .x(d => xScale(d.year))
        .y0(chartHeight)
        .y1(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    g.append("path")
        .datum(metricData)
        .attr("fill", `url(#${gradientId})`)
        .attr("fill-opacity", 0.3)
        .attr("d", area);
    
    // Draw main line with enhanced styling
    const linePath = g.append("path")
        .datum(metricData)
        .attr("fill", "none")
        .attr("stroke", selectedMetric.color)
        .attr("stroke-width", 4)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseover", function() {
            d3.select(this)
                .attr("stroke-width", 5)
                .style("opacity", 0.9);
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 4)
                .style("opacity", 1);
        });
    
    // Add circles for data points with better styling
    g.selectAll(".dot")
        .data(metricData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 6)
        .attr("fill", selectedMetric.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("r", 9)
                .attr("stroke-width", 3);
            
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
                .style("border", `2px solid ${selectedMetric.color}`);
            
            tooltip.transition().duration(200).style("opacity", 1);
            
            const formattedValue = selectedMetric.format(d.value);
            const change = metricData.length > 1 ? {
                value: d.value - metricData[0].value,
                percent: ((d.value - metricData[0].value) / metricData[0].value * 100).toFixed(1)
            } : null;
            
            let tooltipContent = `
                <div style="font-weight: bold; margin-bottom: 6px; color: ${selectedMetric.color}; font-size: 14px;">
                    ${selectedMetric.label}
                </div>
                <div style="margin-bottom: 3px;">Year: <strong>${d.year}</strong></div>
                <div style="margin-bottom: 3px;">Value: <strong>${formattedValue}</strong></div>
            `;
            
            if (change) {
                const changeColor = change.value >= 0 ? '#e74c3c' : '#27ae60';
                const changeIcon = change.value >= 0 ? '↑' : '↓';
                tooltipContent += `
                    <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                        Change since ${metricData[0].year}: <span style="color: ${changeColor};">${changeIcon} ${Math.abs(change.percent)}%</span>
                    </div>
                `;
            }
            
            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", 2.5);
            d3.selectAll(".tooltip").remove();
        });
    
    // Add value labels on points (optional, for better readability)
    g.selectAll(".value-label")
        .data(metricData)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.value) - 12)
        .attr("text-anchor", "middle")
        .attr("fill", selectedMetric.color)
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("opacity", 0.8)
        .text(d => selectedMetric.format(d.value));
    
    // Add summary statistics
    const minValue = d3.min(metricData, d => d.value);
    const maxValue = d3.max(metricData, d => d.value);
    const avgValue = d3.mean(metricData, d => d.value);
    const trend = metricData[metricData.length - 1].value - metricData[0].value;
    const trendPercent = ((trend / metricData[0].value) * 100).toFixed(1);
    const trendIcon = trend >= 0 ? '↑' : '↓';
    const trendColor = trend >= 0 ? '#e74c3c' : '#27ae60';
    
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text(`Min: ${selectedMetric.format(minValue)} | Avg: ${selectedMetric.format(avgValue)} | Max: ${selectedMetric.format(maxValue)} | Trend: <span style="color: ${trendColor};">${trendIcon} ${Math.abs(trendPercent)}%</span>`);
}
