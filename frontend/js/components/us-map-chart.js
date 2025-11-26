let mapSvg = null;
let mapData = null;
let countyData = null;
let projection = null;
let path = null;
let currentZoomState = null;
let currentZoomCounty = null;

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

async function renderUSMap(selectedStates = [], selectedCounties = [], onStateClick = null, onCountyClick = null, onStateDoubleClick = null) {
    d3.select("#us-map-chart").selectAll("*").remove();
    
    const container = d3.select("#us-map-chart");
    const containerWidth = container.node() ? container.node().getBoundingClientRect().width : 900;
    const width = Math.min(containerWidth - 20, 900);
    const height = 500;
    
    mapSvg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#0f0f0f")
        .style("display", "block")
        .style("margin", "0 auto");
    
    // Set up projection
    projection = d3.geoAlbersUsa()
        .scale(1000)
        .translate([width / 2, height / 2]);
    
    path = d3.geoPath().projection(projection);
    
    // Load US states GeoJSON from a CDN
    try {
        console.log('Loading US map data...');
        const statesResponse = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        if (!statesResponse.ok) {
            throw new Error('Failed to load map data');
        }
        const statesTopology = await statesResponse.json();
        
        // Check if topojson is available
        if (typeof topojson === 'undefined') {
            console.warn('TopoJSON not available, using fallback');
            createSimpleStateGrid(selectedStates, onStateClick);
            return;
        }
        
        mapData = topojson.feature(statesTopology, statesTopology.objects.states);
        console.log('Map data loaded successfully');
        
        // Draw states
        mapSvg.selectAll(".state")
            .data(mapData.features)
            .enter()
            .append("path")
            .attr("class", d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "state-boundary selected-state" : "state-boundary";
            })
            .attr("d", path)
            .attr("data-state", d => {
                // Match state name from GeoJSON properties - try different property names
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                return stateName;
            })
            .attr("fill", d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "#667eea" : "#2a2a2a";
            })
            .attr("stroke", d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "#fff" : "#444";
            })
            .attr("stroke-width", d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? 3 : 1;
            })
            .style("opacity", d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? 1 : 0.7;
            })
            .on("click", function(event, d) {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                if (onStateClick && stateName) {
                    onStateClick(stateName);
                }
            })
            .on("dblclick", async function(event, d) {
                event.stopPropagation();
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                if (stateName) {
                    // First select the state if not already selected
                    const isSelected = selectedStates.includes(stateName);
                    if (!isSelected && onStateClick) {
                        onStateClick(stateName);
                    }
                    // Then load counties
                    if (onStateDoubleClick) {
                        onStateDoubleClick(stateName);
                    } else {
                        await loadCountiesForState(stateName, selectedCounties, onCountyClick);
                    }
                }
            })
            .on("mouseover", function(event, d) {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                d3.select(this)
                    .attr("stroke", "#667eea")
                    .attr("stroke-width", isSelected ? 4 : 3);
                
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
                    .style("position", "absolute")
                    .style("background", "rgba(0,0,0,0.9)")
                    .style("color", "white")
                    .style("padding", "8px")
                    .style("border-radius", "5px")
                    .style("font-size", "12px")
                    .style("z-index", "1000");
                
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>${d.properties.name}</strong><br/>${isSelected ? '✓ Selected - Click to deselect' : 'Click to select'}<br/>Double-click to view counties`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                const stateName = d3.select(this).attr("data-state");
                const isSelected = selectedStates.includes(stateName);
                d3.select(this)
                    .attr("stroke", isSelected ? "#fff" : "#444")
                    .attr("stroke-width", isSelected ? 3 : 1)
                    .style("opacity", isSelected ? 1 : 0.7);
                d3.selectAll(".tooltip").remove();
            });
        
        // Add state labels
        mapSvg.selectAll(".state-label")
            .data(mapData.features)
            .enter()
            .append("text")
            .attr("class", "state-label")
            .attr("transform", d => {
                const centroid = path.centroid(d);
                return `translate(${centroid})`;
            })
            .attr("text-anchor", "middle")
            .attr("fill", "#999")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .text(d => {
                const stateName = (d.properties.name || d.properties.NAME || d.properties.NAME_1)?.toUpperCase();
                const abbr = stateName ? (stateNameToAbbr[stateName] || stateName.substring(0, 2)) : '';
                return abbr;
            });
        
        // Load counties if exactly one state is selected (for double-click behavior)
        // Don't auto-load on initial render - wait for double-click
        
    } catch (error) {
        console.error("Error loading map data:", error);
        d3.select("#us-map-chart")
            .append("p")
            .style("color", "#e0e0e0")
            .style("padding", "20px")
            .style("text-align", "center")
            .html("Error loading map. Using simplified view.<br/>" + error.message);
        
        // Fallback: Create a simple state grid representation
        createSimpleStateGrid(selectedStates, onStateClick);
    }
}

async function loadCountiesForState(stateName, selectedCounties = [], onCountyClick = null) {
    if (!mapSvg) return;
    
    // Clear existing counties
    mapSvg.selectAll(".county-boundary").remove();
    mapSvg.selectAll(".county-label").remove();
    
    try {
        // Try to load counties for the selected state
        const stateAbbr = stateNameToAbbr[stateName];
        if (!stateAbbr) return;
        
        // Load counties from us-atlas
        const countiesResponse = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
        if (!countiesResponse.ok) {
            throw new Error('Failed to load county data');
        }
        
        const countiesTopology = await countiesResponse.json();
        const allCounties = topojson.feature(countiesTopology, countiesTopology.objects.counties);
        
        // Filter counties for the selected state
        // Match by state FIPS code (first 2 digits of county FIPS)
        const stateFIPS = getStateFIPS(stateAbbr);
        if (!stateFIPS) return;
        
        const stateCounties = allCounties.features.filter(d => {
            const countyFIPS = d.id.toString().padStart(5, '0');
            return countyFIPS.startsWith(stateFIPS);
        });
        
        // Draw counties
        mapSvg.selectAll(".county")
            .data(stateCounties)
            .enter()
            .append("path")
            .attr("class", "county-boundary")
            .attr("d", path)
            .attr("data-county", d => {
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                return countyName;
            })
            .attr("fill", d => {
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? "#764ba2" : "#1a1a1a";
            })
            .attr("stroke", d => {
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? "#fff" : "#333";
            })
            .attr("stroke-width", d => {
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? 1.5 : 0.5;
            })
            .on("click", function(event, d) {
                event.stopPropagation(); // Prevent state click
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                if (onCountyClick && countyName) {
                    onCountyClick(countyName);
                }
            })
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#667eea").attr("stroke-width", 1.5);
                
                const countyName = d.properties.name || d.properties.NAME || d.properties.NAME_2;
                if (countyName) {
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0)
                        .style("position", "absolute")
                        .style("background", "rgba(0,0,0,0.9)")
                        .style("color", "white")
                        .style("padding", "8px")
                        .style("border-radius", "5px")
                        .style("font-size", "12px")
                        .style("pointer-events", "none")
                        .style("z-index", "1000");
                    
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`<strong>${countyName}</strong><br/>Click to select`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                }
            })
            .on("mouseout", function() {
                const countyName = d3.select(this).attr("data-county");
                const isSelected = selectedCounties.includes(countyName);
                d3.select(this)
                    .attr("stroke", isSelected ? "#fff" : "#333")
                    .attr("stroke-width", isSelected ? 1.5 : 0.5);
                d3.selectAll(".tooltip").remove();
            });
        
    } catch (error) {
        console.error("Error loading counties:", error);
        // Fallback: show message that counties are available but need proper matching
    }
}

// Helper function to get state FIPS code
function getStateFIPS(stateAbbr) {
    const fipsMap = {
        'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08',
        'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16',
        'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22',
        'ME': '23', 'MD': '24', 'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28',
        'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
        'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40',
        'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
        'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54',
        'WI': '55', 'WY': '56', 'DC': '11'
    };
    return fipsMap[stateAbbr];
}

function createSimpleStateGrid(selectedStates = [], onStateClick = null) {
    // Create a simple grid representation of states
    const states = [
        'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
        'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
        'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
        'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA', 'MISSISSIPPI',
        'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE', 'NEW JERSEY',
        'NEW MEXICO', 'NEW YORK', 'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA',
        'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
        'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
        'WEST VIRGINIA', 'WISCONSIN', 'WYOMING'
    ];
    
    const cols = 7;
    const cellWidth = 120;
    const cellHeight = 60;
    const startX = 50;
    const startY = 50;
    
    mapSvg.selectAll(".state-box")
        .data(states)
        .enter()
        .append("rect")
        .attr("class", "state-boundary")
        .attr("x", (d, i) => startX + (i % cols) * cellWidth)
        .attr("y", (d, i) => startY + Math.floor(i / cols) * cellHeight)
        .attr("width", cellWidth - 5)
        .attr("height", cellHeight - 5)
        .attr("rx", 5)
        .attr("fill", d => selectedStates.includes(d) ? "#667eea" : "#2a2a2a")
        .attr("stroke", d => selectedStates.includes(d) ? "#fff" : "#444")
        .attr("stroke-width", d => selectedStates.includes(d) ? 2 : 1)
        .on("click", function(event, d) {
            if (onStateClick) {
                onStateClick(d);
            }
        })
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#667eea").attr("stroke-width", 2);
        })
        .on("mouseout", function(event, d) {
            const isSelected = selectedStates.includes(d);
            d3.select(this)
                .attr("stroke", isSelected ? "#fff" : "#444")
                .attr("stroke-width", isSelected ? 2 : 1);
        });
    
    mapSvg.selectAll(".state-label")
        .data(states)
        .enter()
        .append("text")
        .attr("class", "state-label")
        .attr("x", (d, i) => startX + (i % cols) * cellWidth + (cellWidth - 5) / 2)
        .attr("y", (d, i) => startY + Math.floor(i / cols) * cellHeight + (cellHeight - 5) / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#e0e0e0")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .text(d => {
            const abbr = stateNameToAbbr[d] || d.substring(0, 2);
            return abbr;
        });
}

// Export function to be called from Vue
window.renderUSMap = renderUSMap;
window.loadCountiesForState = loadCountiesForState;
window.updateMapSelection = function(selectedStates, selectedCounties) {
    if (mapSvg && mapData) {
        // Update states - update both class and attributes
        mapSvg.selectAll(".state-boundary")
            .attr("class", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "state-boundary selected-state" : "state-boundary";
            })
            .attr("fill", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "#667eea" : "#2a2a2a";
            })
            .attr("stroke", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "#fff" : "#444";
            })
            .attr("stroke-width", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? 3 : 1;
            })
            .style("opacity", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? 1 : 0.7;
            })
            .style("filter", d => {
                const stateName = (d.properties?.name || d.properties?.NAME || d.properties?.NAME_1 || d)?.toUpperCase();
                const isSelected = selectedStates.includes(stateName);
                return isSelected ? "drop-shadow(0 0 5px rgba(102, 126, 234, 0.8))" : "none";
            });
        
        // Update counties if they exist
        mapSvg.selectAll(".county-boundary")
            .attr("fill", d => {
                const countyName = d.properties?.name || d.properties?.NAME || d.properties?.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? "#764ba2" : "#1a1a1a";
            })
            .attr("stroke", d => {
                const countyName = d.properties?.name || d.properties?.NAME || d.properties?.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? "#fff" : "#333";
            })
            .attr("stroke-width", d => {
                const countyName = d.properties?.name || d.properties?.NAME || d.properties?.NAME_2;
                const isSelected = selectedCounties.includes(countyName);
                return isSelected ? 1.5 : 0.5;
            });
    }
};

