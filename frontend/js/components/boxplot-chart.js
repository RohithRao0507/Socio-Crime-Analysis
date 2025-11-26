function renderBoxplotChart(data) {
    d3.select("#boxplot-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#boxplot-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see distribution.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#boxplot-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 50, right: 40, bottom: 120, left: 80 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#boxplot-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Calculate quartiles for each state
    const boxplotData = data.map(d => {
        const sorted = d.violentCrime.sort((a, b) => a - b);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(sorted[0], q1 - 1.5 * iqr);
        const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr);
        
        return {
            state: d.state,
            min: min,
            q1: q1,
            median: median,
            q3: q3,
            max: max,
            iqr: iqr,
            outliers: sorted.filter(v => v < min || v > max)
        };
    });
    
    // Calculate overall median for reference line
    const allMedians = boxplotData.map(d => d.median);
    const overallMedian = d3.median(allMedians);
    
    const xScale = d3.scaleBand()
        .domain(boxplotData.map(d => d.state))
        .range([0, chartWidth])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(boxplotData, d => d.max) * 1.1])
        .nice()
        .range([chartHeight, 0]);
    
    // Add grid lines
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
    
    // Add overall median reference line
    g.append("line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", yScale(overallMedian))
        .attr("y2", yScale(overallMedian))
        .attr("stroke", "#667eea")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.6);
    
    g.append("text")
        .attr("x", chartWidth - 5)
        .attr("y", yScale(overallMedian) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "#667eea")
        .style("font-size", "10px")
        .style("font-weight", "500")
        .text(`Overall Median: ${overallMedian.toFixed(1)}`);
    
    // Draw axes
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .attr("fill", "#e0e0e0");
    
    g.append("g")
        .call(d3.axisLeft(yScale))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0");
    
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -chartHeight / 2)
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Violent Crime Rate (per 100,000)");
    
    // Draw boxplots with better styling
    boxplotData.forEach((d, idx) => {
        const x = xScale(d.state);
        const boxWidth = xScale.bandwidth();
        const boxColor = d3.schemeCategory10[idx % 10];
        
        // Draw whiskers first (behind box)
        g.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(d.min))
            .attr("y2", yScale(d.q1))
            .attr("stroke", "#888")
            .attr("stroke-width", 1.5);
        
        g.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(d.q3))
            .attr("y2", yScale(d.max))
            .attr("stroke", "#888")
            .attr("stroke-width", 1.5);
        
        // Draw box with gradient effect
        const box = g.append("rect")
            .attr("x", x)
            .attr("y", yScale(d.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(d.q1) - yScale(d.q3))
            .attr("fill", boxColor)
            .attr("fill-opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");
        
        // Draw median line
        g.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(d.median))
            .attr("y2", yScale(d.median))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2.5);
        
        // Add median value label on box if there's space
        if (yScale(d.q1) - yScale(d.q3) > 20) {
            g.append("text")
                .attr("x", x + boxWidth / 2)
                .attr("y", yScale(d.median))
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .style("font-size", "9px")
                .style("font-weight", "bold")
                .text(d.median.toFixed(0));
        }
        
        // Draw min/max caps
        g.append("line")
            .attr("x1", x + boxWidth / 4)
            .attr("x2", x + boxWidth * 3 / 4)
            .attr("y1", yScale(d.min))
            .attr("y2", yScale(d.min))
            .attr("stroke", "#888")
            .attr("stroke-width", 2);
        
        g.append("line")
            .attr("x1", x + boxWidth / 4)
            .attr("x2", x + boxWidth * 3 / 4)
            .attr("y1", yScale(d.max))
            .attr("y2", yScale(d.max))
            .attr("stroke", "#888")
            .attr("stroke-width", 2);
        
        // Add tooltip to box
        box.on("mouseover", function(event) {
            d3.select(this)
                .attr("fill-opacity", 1)
                .attr("stroke-width", 2.5);
            
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
                .style("border", `2px solid ${boxColor}`);
            
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 6px; color: ${boxColor}; font-size: 14px;">
                    ${d.state}
                </div>
                <div style="margin-bottom: 3px;">Min: ${d.min.toFixed(2)}</div>
                <div style="margin-bottom: 3px;">Q1: ${d.q1.toFixed(2)}</div>
                <div style="margin-bottom: 3px;"><strong>Median: ${d.median.toFixed(2)}</strong></div>
                <div style="margin-bottom: 3px;">Q3: ${d.q3.toFixed(2)}</div>
                <div style="margin-bottom: 3px;">Max: ${d.max.toFixed(2)}</div>
                <div style="font-size: 10px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                    IQR: ${d.iqr.toFixed(2)} | Outliers: ${d.outliers.length}
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("fill-opacity", 0.7)
                .attr("stroke-width", 1.5);
            d3.selectAll(".tooltip").remove();
        });
        
        // Draw outliers with better styling
        if (d.outliers.length > 0) {
            g.selectAll(`.outlier-${d.state}`)
                .data(d.outliers)
                .enter()
                .append("circle")
                .attr("class", `outlier-${d.state}`)
                .attr("cx", x + boxWidth / 2)
                .attr("cy", d => yScale(d))
                .attr("r", 4)
                .attr("fill", "#ff4444")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .attr("opacity", 0.8)
                .style("cursor", "pointer")
                .on("mouseover", function(event, outlierValue) {
                    d3.select(this).attr("r", 6).attr("opacity", 1);
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0)
                        .style("position", "absolute")
                        .style("background", "rgba(0,0,0,0.95)")
                        .style("color", "white")
                        .style("padding", "8px")
                        .style("border-radius", "5px")
                        .style("font-size", "11px")
                        .style("z-index", "1000");
                    
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>${d.state}</strong><br/>Outlier: ${outlierValue.toFixed(2)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", 4).attr("opacity", 0.8);
                    d3.selectAll(".tooltip").remove();
                });
        }
    });
}
