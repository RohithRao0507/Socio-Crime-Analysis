function renderCrimeBreakdownChart(data) {
    d3.select("#crime-breakdown-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#crime-breakdown-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see crime breakdown.");
        return;
    }
    
    // Get container dimensions
    const container = d3.select("#crime-breakdown-chart").node();
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
    
    const svg = d3.select("#crime-breakdown-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Define crime types with better colors
    const crimeTypes = [
        { key: 'murder', label: 'Murder', color: '#8e44ad', gradient: ['#8e44ad', '#6c3483'] },
        { key: 'rape', label: 'Rape', color: '#e67e22', gradient: ['#e67e22', '#d35400'] },
        { key: 'robbery', label: 'Robbery', color: '#c0392b', gradient: ['#c0392b', '#a93226'] },
        { key: 'assault', label: 'Assault', color: '#d35400', gradient: ['#d35400', '#ba4a00'] },
        { key: 'burglary', label: 'Burglary', color: '#16a085', gradient: ['#16a085', '#138d75'] },
        { key: 'larceny', label: 'Larceny', color: '#27ae60', gradient: ['#27ae60', '#229954'] },
        { key: 'motorTheft', label: 'Motor Theft', color: '#2980b9', gradient: ['#2980b9', '#2471a3'] }
    ];
    
    // Calculate totals for each crime type
    const totals = {};
    crimeTypes.forEach(crime => {
        totals[crime.key] = data.reduce((sum, d) => sum + (d[crime.key] || 0), 0);
    });
    
    // Calculate total crimes
    const totalCrimes = Object.values(totals).reduce((a, b) => a + b, 0);
    
    // Sort by value
    const sortedCrimes = crimeTypes.sort((a, b) => totals[b.key] - totals[a.key]);
    
    const xScale = d3.scaleBand()
        .domain(sortedCrimes.map(c => c.label))
        .range([0, chartWidth])
        .padding(0.25);
    
    const maxValue = d3.max(Object.values(totals));
    const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
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
    
    // Add axes
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    // Format Y-axis with M for millions, K for thousands
    const formatYAxis = (d) => {
        if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
        if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
        return d;
    };
    
    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(formatYAxis))
        .attr("stroke", "#666")
        .selectAll("text")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px");
    
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -chartHeight / 2)
        .attr("dy", "1em")
        .attr("fill", "#e0e0e0")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text("Total Incidents");
    
    // Add total crimes summary at top
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text(`Total Crimes: ${totalCrimes.toLocaleString()}`);
    
    // Draw bars with gradient and better styling
    sortedCrimes.forEach((crime, idx) => {
        const bar = g.append("rect")
            .attr("class", "bar")
            .attr("x", xScale(crime.label))
            .attr("y", yScale(totals[crime.key]))
            .attr("width", xScale.bandwidth())
            .attr("height", chartHeight - yScale(totals[crime.key]))
            .attr("fill", crime.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("rx", 3)
            .style("cursor", "pointer")
            .style("transition", "all 0.2s");
        
        // Add gradient for depth
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", `gradient-${crime.key}`)
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");
        
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", crime.gradient[0])
            .attr("stop-opacity", 1);
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", crime.gradient[1])
            .attr("stop-opacity", 1);
        
        bar.attr("fill", `url(#gradient-${crime.key})`);
        
        // Add hover effects
        bar.on("mouseover", function(event) {
            d3.select(this)
                .attr("stroke-width", 3)
                .attr("stroke", "#667eea")
                .attr("opacity", 0.9)
                .attr("transform", "scale(1.05)")
                .attr("transform-origin", "center bottom");
            
            const percentage = ((totals[crime.key] / totalCrimes) * 100).toFixed(1);
            const formattedValue = totals[crime.key] >= 1000000 
                ? (totals[crime.key] / 1000000).toFixed(2) + 'M'
                : totals[crime.key] >= 1000
                ? (totals[crime.key] / 1000).toFixed(1) + 'K'
                : totals[crime.key].toLocaleString();
            
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
                .style("border", `2px solid ${crime.color}`);
            
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 6px; color: ${crime.color}; font-size: 14px;">
                    ${crime.label}
                </div>
                <div style="margin-bottom: 4px;">Total: <strong>${totals[crime.key].toLocaleString()}</strong></div>
                <div style="margin-bottom: 4px;">Formatted: <strong>${formattedValue}</strong></div>
                <div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">
                    ${percentage}% of all crimes
                </div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 1.5)
                .attr("stroke", "#fff")
                .attr("opacity", 1)
                .attr("transform", "scale(1)");
            d3.selectAll(".tooltip").remove();
        });
    });
    
    // Add legend at the bottom - centered
    const legendItemWidth = 100;
    const legendStartX = (chartWidth - (sortedCrimes.length * legendItemWidth)) / 2;
    const legendY = chartHeight + 50;
    
    sortedCrimes.forEach((crime, idx) => {
        const legendX = legendStartX + idx * legendItemWidth;
        
        // Legend color box
        g.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", crime.color)
            .attr("rx", 2);
        
        // Legend label
        g.append("text")
            .attr("x", legendX + 16)
            .attr("y", legendY + 9)
            .attr("fill", "#e0e0e0")
            .style("font-size", "10px")
            .style("font-weight", "500")
            .text(crime.label);
    });
}
