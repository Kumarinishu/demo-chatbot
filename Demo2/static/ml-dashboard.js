const statusSymbol = {
    RECOVERED: "✅",
    CANCELLED: "❌",
    ABANDONED: "⏳"
};

const riskSymbol = { HIGH: "⚠", MEDIUM: "◐", LOW: "✓" };

const formatReportCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const productValues = { "Red Anarkali Kurti": 2499, "Blue Kurta Set": 1899, "Black Festive Set": 3200, "Lehenga Choli Festive": 4250, "Green Saree": 2800, "Red Kurta": 1999 };

const loadReportData = async () => {
    try {
        const response = await fetch("/api/report");
        if (response.ok) return response.json();
    } catch (error) {
        // Fall back to the CSV when the page is opened with Live Server.
    }
    const csvResponse = await fetch("/dataset.csv");
    const rows = (await csvResponse.text()).trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
    const statusIndex = 10;
    const revenueIndex = 11;
    const counts = rows.reduce((result, row) => {
        result[row[statusIndex]] = (result[row[statusIndex]] || 0) + 1;
        return result;
    }, {});
    const recoveredRows = rows.filter((row) => row[statusIndex] === "RECOVERED");
    const opportunityRevenue = rows.reduce((total, row) => total + (productValues[row[4]] || 0), 0);
    const recoveredRevenue = recoveredRows.reduce((total, row) => total + Number(row[revenueIndex] || 0), 0);
    return {
        total_carts: rows.length,
        recovered: counts.RECOVERED || 0,
        abandoned: counts.ABANDONED || 0,
        cancelled: counts.CANCELLED || 0,
        revenue: recoveredRevenue,
        total_revenue: opportunityRevenue,
        recovered_revenue: recoveredRevenue,
        lost_revenue: opportunityRevenue - recoveredRevenue
    };
};

const syncReportNumbers = async () => {
    const data = await loadReportData();
    const kpiGrid = document.querySelector(".report-shell .kpi-grid");
    if (kpiGrid && !kpiGrid.querySelector("[data-summary-currency='total-revenue']")) {
        const totalRevenueCard = document.createElement("div");
        totalRevenueCard.className = "kpi total-revenue-card";
        totalRevenueCard.innerHTML = `<label>💵 Total revenue</label><strong data-summary-currency="total-revenue">-</strong><em>Validated dataset value</em>`;
        kpiGrid.insertBefore(totalRevenueCard, kpiGrid.lastElementChild);
    }
    const donut = document.querySelector(".report-shell .donut");
    const total = data.total_carts || 1;
    const recoveredRate = Math.round(data.recovered / total * 100);
    document.querySelectorAll(".kpi").forEach((card) => {
        const label = card.querySelector("label")?.textContent.toLowerCase() || "";
        const value = card.querySelector("strong");
        if (!value) return;
        if (label.includes("recovered carts") || label === "recovered") {
            value.textContent = data.recovered;
        } else if (label.includes("revenue")) {
            const revenueKey = label.includes("lost") ? "lost_revenue" : label.includes("total") ? "total_revenue" : "revenue";
            value.textContent = formatReportCurrency(data[revenueKey]);
        } else if (label.includes("total carts") || label.includes("tracked carts")) {
            value.textContent = data.total_carts;
        } else if (label.includes("abandoned")) {
            value.textContent = data.abandoned;
        } else if (label.includes("cancelled")) {
            value.textContent = data.cancelled;
        }
    });
    ["recovered", "abandoned", "cancelled"].forEach((status) => {
        const percentage = Math.round(data[status] / total * 100);
        const target = document.querySelector(`[data-summary-percent="${status}"]`);
        if (target) target.textContent = `${percentage}% of total`;
    });
    if (donut) {
        const recoveredEnd = data.recovered / total * 100;
        const cancelledEnd = (data.recovered + data.cancelled) / total * 100;
        donut.style.background = `conic-gradient(#51d5bb 0 ${recoveredEnd}%, #ff9d5c ${recoveredEnd}% ${cancelledEnd}%, #557177 ${cancelledEnd}% 100%)`;
        donut.style.setProperty("--donut-center", `"${recoveredRate}%"`);
        donut.setAttribute("title", `✅ Recovered: ${data.recovered} (${recoveredRate}%) | ❌ Cancelled: ${data.cancelled} | ⏳ Abandoned: ${data.abandoned}`);
    }
    const legendItems = document.querySelectorAll(".report-shell .legend span");
    if (legendItems.length >= 3) {
        legendItems[0].textContent = `✅ Recovered ${data.recovered} (${recoveredRate}%)`;
        legendItems[1].textContent = `⏳ Abandoned ${Math.round(data.abandoned / total * 100)}%`;
        legendItems[2].textContent = `❌ Cancelled ${Math.round(data.cancelled / total * 100)}%`;
    }
    const outcomeRows = document.querySelectorAll(".report-shell .visual-grid .bar-row");
    outcomeRows.forEach((row) => {
        const label = row.querySelector("span")?.textContent.toLowerCase() || "";
        const count = label.includes("recovered") ? data.recovered : label.includes("abandoned") ? data.abandoned : label.includes("cancelled") ? data.cancelled : null;
        if (count === null) return;
        const percentage = Math.round(count / total * 100);
        row.querySelector(".bar i").style.width = `${percentage}%`;
        row.querySelector("b").textContent = `${percentage}%`;
    });
};

const createForecastPanel = () => {
    if (!document.querySelector(".report-shell") || document.querySelector(".forecast-panel")) return;
    document.querySelectorAll(".report-shell .panel").forEach((panel) => {
        const title = panel.querySelector("h2")?.textContent.trim();
        if (title === "Cart outcome mix" || title === "Recovery by cart attempts") panel.remove();
    });
    document.querySelector(".report-shell .trend-panel")?.remove();
    const panel = document.createElement("section");
    panel.className = "forecast-panel";
    panel.innerHTML = `
        <div class="forecast-heading"><div><span class="report-kicker">MODEL PERFORMANCE</span><h2>Prediction quality dashboard</h2><p id="forecast-validation">Checking dataset quality...</p></div><span class="validation-badge" id="validation-badge">CHECKING</span></div>
        <div class="forecast-kpis model-facts-row"><article><strong id="summary-accuracy">-</strong><span>🎯 Model accuracy</span></article><article><strong id="summary-trained">-</strong><span>🧠 Rows trained</span></article><article><strong id="summary-model">-</strong><span>⚙ Model</span></article><article><strong id="prediction-high">-</strong><span>⚠ HIGH predicted</span></article><article><strong id="prediction-medium">-</strong><span>◐ MEDIUM predicted</span></article><article><strong id="prediction-low">-</strong><span>✓ LOW predicted</span></article></div><div class="summary-overview"><article><strong id="overview-total">-</strong><span>🛒 Total carts</span></article><article><strong id="overview-recovered">-</strong><span>✅ Recovered</span></article><article><strong id="overview-abandoned">-</strong><span>⏳ Abandoned</span></article><article><strong id="overview-cancelled">-</strong><span>❌ Cancelled</span></article><article><strong id="overview-total-revenue">-</strong><span>💵 Total revenue</span></article><article><strong id="overview-recovered-revenue">-</strong><span>💰 Recovered revenue</span></article><article><strong id="overview-lost-revenue">-</strong><span>📉 Lost revenue</span></article></div>
        <div class="forecast-layout"><article><h3>📊 Recovery distribution / Cart outcome mix</h3><div class="recovery-chart-layout"><div class="recovery-pie" id="recovery-pie"><span>69%</span></div><div id="recovery-legend" class="recovery-legend"></div></div></article><article><h3>📈 Recovery % vs times added</h3><div id="attempt-chart" class="attempt-chart"></div></article></div><div class="predicted-section"><h3>👥 Top predicted customers <span id="top-customer-count" class="customer-count">0 validated</span></h3><div class="predicted-table-wrap"><table class="predicted-table"><thead><tr><th>Customer</th><th>Cart attempts</th><th>Loss risk</th><th>Conversion</th><th>Coupon</th><th>Status</th></tr></thead><tbody id="top-customers"></tbody></table></div></div>`;
    document.querySelector(".report-shell > .report-top").after(panel);
};

const loadForecast = async () => {
    createForecastPanel();
    try {
        const response = await fetch("/api/ml-dashboard");
        if (!response.ok) throw new Error("Forecast unavailable");
        const data = await response.json();
        const validation = data.validation;
        const validationBadge = document.getElementById("validation-badge");
        validationBadge.textContent = validation.valid ? "✓ DATA VALID" : "⚠ REVIEW DATA";
        validationBadge.classList.toggle("invalid", !validation.valid);
        document.getElementById("forecast-validation").textContent = validation.valid
            ? `${validation.rows} rows checked · no missing values, duplicate IDs, or invalid statuses`
            : `${validation.rows} rows checked · ${validation.missing_values} missing values · ${validation.duplicate_customer_ids} duplicate IDs`;
        const summary = data.summary;
        document.getElementById("overview-total").textContent = summary.total_carts;
        document.getElementById("overview-recovered").textContent = summary.recovered;
        document.getElementById("overview-abandoned").textContent = summary.abandoned;
        document.getElementById("overview-cancelled").textContent = summary.cancelled;
        document.getElementById("overview-total-revenue").textContent = formatReportCurrency(summary.total_revenue);
        document.getElementById("overview-recovered-revenue").textContent = formatReportCurrency(summary.recovered_revenue);
        document.getElementById("overview-lost-revenue").textContent = formatReportCurrency(summary.lost_revenue);
        document.getElementById("summary-accuracy").textContent = `${summary.accuracy}%`;
        document.getElementById("summary-trained").textContent = summary.trained_rows;
        document.getElementById("summary-model").textContent = summary.model_name.replace(" Classifier", "");
        document.getElementById("prediction-high").textContent = data.forecast.high_risk;
        document.getElementById("prediction-medium").textContent = data.forecast.medium_risk;
        document.getElementById("prediction-low").textContent = data.forecast.low_risk;
        const distribution = summary.distribution;
        const recoveredEnd = distribution[0].percentage;
        const abandonedEnd = recoveredEnd + distribution[1].percentage;
        document.getElementById("recovery-pie").style.background = `conic-gradient(#61d9b1 0 ${recoveredEnd}%, #f0b85d ${recoveredEnd}% ${abandonedEnd}%, #ed7667 ${abandonedEnd}% 100%)`;
        document.getElementById("recovery-pie").querySelector("span").textContent = `${recoveredEnd}%`;
        document.getElementById("recovery-legend").innerHTML = distribution.map((item) => `<div><i class="legend-${item.label.toLowerCase()}"></i><strong>${statusSymbol[item.label] || "•"} ${item.label}</strong><span>${item.count} carts · ${item.percentage}%</span></div>`).join("");
        const maxAttemptRate = Math.max(...summary.attempts.map((item) => item.percentage), 1);
        document.getElementById("attempt-chart").innerHTML = summary.attempts.map((item) => `<div class="attempt-column"><div class="attempt-value">${item.percentage}%</div><i style="height:${Math.max(8, item.percentage / maxAttemptRate * 100)}%"></i><strong>${item.attempt} baar</strong><small>${item.recovered}/${item.customers} recovered</small></div>`).join("");
        document.getElementById("top-customer-count").textContent = `${data.top_customer_count} validated`;
        document.getElementById("top-customers").innerHTML = data.top_customers.map((customer, index) => `<tr><td><strong>${index + 1}. ${customer.customer_name}</strong><small>📍 ${customer.place} · 🕒 ${customer.time_ago}</small></td><td>🛒 ${customer.times_added} baar</td><td><b class="risk-pill risk-${customer.predicted_risk.toLowerCase()}">⚠ ${customer.loss_risk}%</b></td><td><strong>${customer.recovery_chance}%</strong><small>${customer.confidence}% model confidence</small></td><td><span class="coupon-pill">🎟 ${customer.coupon_percent}%</span></td><td><b class="status-pill status-${customer.forecast_status.toLowerCase()}">${statusSymbol[customer.forecast_status] || "•"} ${customer.forecast_status}</b></td></tr>`).join("");
    } catch (error) {
        document.getElementById("forecast-validation").textContent = "Forecast unavailable. Start the Flask server and refresh.";
    }
};

syncReportNumbers().catch(() => {});
loadForecast();
