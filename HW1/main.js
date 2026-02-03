document.addEventListener('DOMContentLoaded', () => {
    loadReadings();
    loadAssignments();
    // Use requestAnimationFrame to ensure DOM is fully ready for SVG calculations
    requestAnimationFrame(renderGradeDistribution);
});

async function loadAssignments() {
    const container = document.getElementById('assignments-list');
    
    try {
        const response = await fetch('assignments.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const assignments = await response.json();
        
        container.innerHTML = ''; // clear loading message

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

    // svg config
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.6; 

    let svgContent = '';
    let startAngle = 0;

    // calculate total value
    const total = data.reduce((sum, item) => sum + item.value, 0);

    data.forEach(item => {
        // calculate arc angles
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // calculate coordinates
        const x1 = width / 2 + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = height / 2 + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = width / 2 + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = height / 2 + radius * Math.sin(endAngle - Math.PI / 2);
        
        // inner arc coordinates (for donut hole)
        const x3 = width / 2 + innerRadius * Math.cos(endAngle - Math.PI / 2);
        const y3 = height / 2 + innerRadius * Math.sin(endAngle - Math.PI / 2);
        const x4 = width / 2 + innerRadius * Math.cos(startAngle - Math.PI / 2);
        const y4 = height / 2 + innerRadius * Math.sin(startAngle - Math.PI / 2);

        // svg path command
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        
        // path definition for a donut slice
        const pathData = [
            `M ${x1} ${y1}`, // Move to outer start
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Outer arc
            `L ${x3} ${y3}`, // Line to inner end
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Inner arc (reverse)
            'Z' // Close path
        ].join(' ');

        svgContent += `<path d="${pathData}" fill="${item.color}" stroke="white" stroke-width="2">
            <title>${item.label}: ${item.value}%</title>
        </path>`;

        // Add legend item
        const legendItem = document.createElement('div');
        legendItem.innerHTML = `
            <div style="display: flex; align-items: center; font-size: 0.9rem;">
                <span style="width: 12px; height: 12px; background-color: ${item.color}; border-radius: 2px; margin-right: 8px; display: inline-block;"></span>
                <span>${item.label} (<strong>${item.value}%</strong>)</span>
            </div>
        `;
        legendContainer.appendChild(legendItem);

        startAngle = endAngle;
    });

    // create SVG element
    container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">
            ${svgContent}
            <div class="donut-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            </div>
             <!-- Text in center -->
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20" font-weight="bold" fill="#374151">Grades</text>
        </svg>
    `;
}
