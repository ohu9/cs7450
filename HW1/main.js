async function loadAssignments() {
    const container = document.getElementById('assignments-list');
    
    try {
        // read from assignments.json created for this hw
        const response = await fetch('assignments.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const assignments = await response.json();
        
        // clear loading message
        container.innerHTML = ''; 

        assignments.forEach(assignment => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items: center;">
                <h3>${assignment.title}</h3>
                    <span style="display:flex; flex-direction: row; align-items: center; gap: 10px; color:#4b5563; font-size:0.9rem;">
                        <p style="margin-left: 10px; font-weight:bold; font-size:0.9rem;">Due: ${assignment.due}</p>
                        ${assignment.link ? 
                            `<a href="${assignment.link}" target="_blank">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="blue" style="width: 1.25rem; height: 1.25rem;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                </svg>
                            </a>` 
                            : ''}
                    </span>
                </div>
                <details>
                    <summary><strong>Assignment Details</strong></summary>
                    <p style="white-space: pre-wrap;">${assignment.details}</p>
                </details>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading assignments:', error);
        container.innerHTML = '<div class="error">Failed to load assignments. Please try again later.</div>';
    }
}

async function loadReadings() {
    const readingsContainer = document.getElementById('readings-list');
    
    try {
        // read from given hw2-papers.csv file
        const response = await fetch('hw2-papers.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const papers = parseCSV(csvText);
        
        // clear loading message
        readingsContainer.innerHTML = '';

        papers.forEach(paper => {
            // check for data, skip empty rows
            if (!paper.Paper || !paper.Link) return;

            const card = document.createElement('div');
            card.className = 'paper-card';
            
            // clean up titles
            const titleText = paper.Paper.replace(/^"|"$/g, '').trim();

            // create card for reading 
            card.innerHTML = `
                <div class="paper-topic">${paper.Topic || 'General'}</div>
                <h3 class="paper-title">
                    <a href="${paper.Link}" target="_blank">${titleText}</a>
                </h3>
                <div class="paper-meta">
                    Week ${paper.Week} – ${paper.Date}
                </div>
            `;
            // add card to list
            readingsContainer.appendChild(card);
        });

    // error handling
    } catch (error) {
        console.error('Error loading readings:', error);
        readingsContainer.innerHTML = '<div class="error">Failed to load readings. Please try again later.</div>';
    }
}

// helper function to parse csv
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const obj = {};
        const currentline = parseCSVLine(lines[i]);
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    
    return result;
}

function parseCSVLine(text) {
    const result = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(currentCell.trim());
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    result.push(currentCell.trim());
    return result;
}

// function to render the grade bar chart
function renderGradeDistribution() {
    const data = [
        { label: 'HW Assignments', value: 30, color: '#3b82f6' },
        { label: 'Reading Presentation', value: 15, color: '#10b981' },
        { label: 'Reading Reflection', value: 10, color: '#f59e0b' },
        { label: 'Research Prototype', value: 35, color: '#8b5cf6' },
        { label: 'Class Engagement', value: 10, color: '#ef4444' }
    ];

    const container = document.getElementById('grade-viz-container');
    const legendContainer = document.getElementById('grade-legend');
    
    if (!container || !legendContainer) return;

    container.innerHTML = '';
    legendContainer.innerHTML = '';

    const width = 600;
    const height = 300;
    const barHeight = 35;
    const gap = 15;
    const maxVal = 40; 
    const labelWidth = 160; 
    const barWidthArea = width - labelWidth - 50;

    let svgInnerHtml = '';

    data.forEach((d, i) => {
        const y = i * (barHeight + gap);
        const barW = (d.value / maxVal) * barWidthArea;

        svgInnerHtml += `
            <g>
                <text x="${labelWidth - 10}" y="${y + barHeight / 2}" dy="0.35em" text-anchor="end" fill="#374151" style="font-weight: 500; font-size: 14px;">${d.label}</text>
                <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" fill="${d.color}" rx="4" class="bar">
                    <title>${d.label}: ${d.value}%</title>
                </rect>
                <text x="${labelWidth + barW + 8}" y="${y + barHeight / 2}" dy="0.35em" fill="#4b5563" style="font-size: 13px;">${d.value}%</text>
            </g>
        `;
    });

    container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto; font-family: sans-serif;">
            ${svgInnerHtml}
        </svg>
    `;
}
