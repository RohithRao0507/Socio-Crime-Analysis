function renderStateChart(data, selectedMetrics = null, metric = 'violentCrimeRate') {
    // Clear previous chart
    d3.select("#state-chart").selectAll("*").remove();
    
    if (!data || data.length === 0) {
        d3.select("#state-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .text("No data available. Apply filters to see state comparison.");
        return;
    }
    
    // State name to abbreviation mapping
    const stateNameToAbbr = {
        'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
        'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
        'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
        'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
        'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
        'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
        'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
        'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
        'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
        'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
        'DISTRICT OF COLUMBIA': 'DC'
    };
    
    // Helper function to get state abbreviation
    function getStateAbbr(stateName) {
        const upperName = stateName.toUpperCase();
        return stateNameToAbbr[upperName] || stateName.substring(0, 2).toUpperCase();
    }
    
    // Metric configuration
    const metricConfig = {
        'violentCrimeRate': {
            accessor: d => d.violentCrimeRate || 0,
            label: 'Violent Crime Rate (per 100,000)',
            format: d => d.toFixed(2),
            colorScale: d3.scaleSequential(d3.interpolateYlOrRd)
        },
        'propertyCrimeRate': {
            accessor: d => d.propertyCrimeRate || 0,
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
        },
        'gdpPerCapita': {
            accessor: d => d.gdpPerCapita || 0,
            label: 'GDP Per Capita ($)',
            format: d => `$${d.toLocaleString()}`,
            colorScale: d3.scaleSequential(d3.interpolateGreens)
        }
    };
    
    const config = metricConfig[metric] || metricConfig['violentCrimeRate'];
    
    // Get container dimensions
    const container = d3.select("#state-chart").node();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Balanced margins for centering
    const margin = { top: 50, right: 40, bottom: 80, left: 80 };
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);
    const chartHeight = Math.max(0, containerHeight - margin.top - margin.bottom);
    
    // Center the chart within the container
    const svgWidth = containerWidth;
    const svgHeight = containerHeight;
    const chartX = (svgWidth - (chartWidth + margin.left + margin.right)) / 2 + margin.left;
    const chartY = margin.top;
    
    const svg = d3.select("#state-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "100%");
    
    const g = svg.append("g")
        .attr("transform", `translate(${chartX},${chartY})`);
    
    // Sort data by selected metric (descending)
    const sortedData = [...data].sort((a, b) => config.accessor(b) - config.accessor(a));
    
    // Set scales
    const xScale = d3.scaleBand()
        .domain(sortedData.map(d => getStateAbbr(d.state)))
        .range([0, chartWidth])
        .padding(0.2);
    
    const maxValue = d3.max(sortedData, config.accessor);
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
        .style("font-weight", "500");
    
    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => metric === 'gdpPerCapita' ? `$${d3.format(".0s")(d)}` : d3.format(".0f")(d)))
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
    
    // Color scale based on selected metric
    const colorScale = config.colorScale.domain([0, maxValue]);
    
    // Add bars with gradient and better styling
    sortedData.forEach((d, idx) => {
        const value = config.accessor(d);
        const bar = g.append("rect")
            .attr("class", "bar")
            .attr("x", xScale(getStateAbbr(d.state)))
            .attr("width", xScale.bandwidth())
            .attr("y", yScale(value))
            .attr("height", chartHeight - yScale(value))
            .attr("fill", colorScale(value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("rx", 3)
            .style("cursor", "pointer")
            .style("transition", "all 0.2s");
        
        // Add gradient for depth
        const defs = svg.append("defs");
        const gradientId = `gradient-${metric}-${idx}`;
        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");
        
        const baseColor = colorScale(value);
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", baseColor)
            .attr("stop-opacity", 1);
        
        // Darker shade for bottom
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.rgb(baseColor).darker(0.5))
            .attr("stop-opacity", 1);
        
        bar.attr("fill", `url(#${gradientId})`);
        
        // Add hover effects
        bar.on("mouseover", function(event) {
            d3.select(this)
                .attr("stroke-width", 3)
                .attr("stroke", "#667eea")
                .attr("opacity", 0.9)
                .attr("transform", "scale(1.05)")
                .attr("transform-origin", "center bottom");
            
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
            
            let tooltipContent = `<div style="font-weight: bold; margin-bottom: 6px; color: #667eea; font-size: 14px;">${d.state} (${getStateAbbr(d.state)})</div>`;
            tooltipContent += `<div style="margin-bottom: 3px;"><strong>Rank:</strong> #${idx + 1}</div>`;
            tooltipContent += `<div style="margin-bottom: 3px;"><strong>${config.label.split('(')[0].trim()}:</strong> ${config.format(value)}</div>`;
            
            // Add other metrics
            if (metric !== 'violentCrimeRate') {
                tooltipContent += `<div style="margin-bottom: 3px;">Violent Crime: ${(d.violentCrimeRate || 0).toFixed(2)}</div>`;
            }
            if (metric !== 'propertyCrimeRate') {
                tooltipContent += `<div style="margin-bottom: 3px;">Property Crime: ${(d.propertyCrimeRate || 0).toFixed(2)}</div>`;
            }
            if (metric !== 'gdpPerCapita') {
                tooltipContent += `<div style="font-size: 11px; color: #ccc; margin-top: 4px; padding-top: 4px; border-top: 1px solid #444;">GDP per Capita: $${(d.gdpPerCapita || 0).toFixed(2)}</div>`;
            }
            
            tooltip.html(tooltipContent)
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
    
    // Add summary statistics at top
    const maxRate = maxValue;
    const minRate = d3.min(sortedData, config.accessor);
    const avgRate = d3.mean(sortedData, config.accessor);
    
    g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "11px")
        .style("font-weight", "500")
        .text(`Max: ${config.format(maxRate)} | Avg: ${config.format(avgRate)} | Min: ${config.format(minRate)}`);
}
