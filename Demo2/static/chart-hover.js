const addChartTooltips = () => {
    document.querySelectorAll(".bar-row").forEach((row) => {
        const label = row.querySelector("span")?.textContent.trim();
        const value = row.querySelector("b")?.textContent.trim();
        if (label && value) {
            const percentage = value.includes("%") ? Number.parseFloat(value) : Number.NaN;
            const count = Number.isNaN(percentage) ? "" : ` · ${Math.round(percentage * 5)} carts`;
            row.title = `${label}: ${value}${count}`;
        }
    });

    document.querySelectorAll(".trend-bars i").forEach((bar) => {
        const label = bar.querySelector("small")?.textContent.trim();
        const value = bar.querySelector("b")?.textContent.trim();
        if (label && value) {
            const percentage = value.includes("%") ? Number.parseFloat(value) : Number.NaN;
            const count = Number.isNaN(percentage) ? "" : ` · ${Math.round(percentage * 5)} carts`;
            bar.title = `${label}: ${value}${count}`;
        }
    });

    document.querySelectorAll(".legend span").forEach((item) => {
        const text = item.textContent.trim();
        const percentage = Number.parseFloat(text.match(/[0-9.]+/)?.[0] || "");
        const count = Number.isNaN(percentage) ? "" : ` · ${Math.round(percentage * 5)} carts`;
        item.title = `${text}${count}`;
    });

    document.querySelectorAll(".donut").forEach((chart) => {
        chart.title = "Recovered: 420 (84%) | Abandoned: 50 (10%) | Cancelled: 30 (6%)";
    });
};

addChartTooltips();

if (document.querySelector(".report-shell")) {
    const forecastScript = document.createElement("script");
    forecastScript.src = "/static/ml-dashboard.js";
    forecastScript.defer = true;
    document.body.appendChild(forecastScript);
}
