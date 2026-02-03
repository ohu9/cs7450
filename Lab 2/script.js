function getCategoryTotals() {
    const categories = ["FAANG", "Finance", "Aerospace", "AI Startups", "Enterprise"];
    const totals = categories.map(category => {
        const companies = rejectionData.filter(d => d.Category === category);
        const totalRejections = companies.reduce((sum, company) => sum + company.Rejections, 0);
        return { Category: category, Company: category, Rejections: totalRejections };
    })
    return totals;
}
const categorySelector = document.getElementById('category-select');

function updateChart(data) {
    for (let i = 0; i < 5; i++) {
        const bar = document.getElementById(`bar-${i+1}`);
        console.log(bar)

        const rect = bar.getElementsByTagName('rect')[0]; // we know there is only one rect for each bar
        const label = bar.getElementsByTagName('text')[0]; // we know there is only one label for each bar

        label.textContent = data[i].Company;
        console.log(data[i].Rejections)

        const barHeight = data[i].Rejections;
        rect.setAttribute('height', barHeight);
        rect.setAttribute('transform', `translate(0, ${-barHeight})`);
    }
}
categorySelector.addEventListener('change', (e) => {
    const category = e.target.value;

    if (category === 'all') {
        const totals = getCategoryTotals();
        updateChart(totals);
    } else {
        const values = rejectionData.filter(d => d.Category === category);
        updateChart(values);
    }
});