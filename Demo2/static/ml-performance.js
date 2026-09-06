const metricWidth = (value) => `${Math.max(4, Math.min(100, Number(value) || 0))}%`;

const renderMetricBars = (metrics) => {
    document.getElementById("class-metrics").innerHTML = metrics.map((metric) => `
        <div class="metric-row"><strong>${metric.label}</strong><span>Precision ${metric.precision}%</span><i><b style="width:${metric.precision}%"></b></i><span>Recall ${metric.recall}%</span><i><b class="recall-bar" style="width:${metric.recall}%"></b></i><span>F1 ${metric.f1}%</span></div>
    `).join("");
};

const renderFeatureImportance = (features) => {
    document.getElementById("feature-importance").innerHTML = features.map((feature) => `
        <div class="importance-row"><div><strong>${feature.feature}</strong><b>${feature.importance}%</b></div><i><b style="width:${metricWidth(feature.importance)}"></b></i></div>
    `).join("");
};

const renderPredictionCounts = (counts) => {
    document.getElementById("prediction-counts").innerHTML = counts.map((item) => `
        <div class="prediction-row"><strong>${item.label}</strong><span>Actual ${item.actual} · Predicted ${item.predicted}</span><div><i style="width:${metricWidth(item.actual)}"></i><b style="width:${metricWidth(item.predicted)}"></b></div></div>
    `).join("");
};

const renderConfusionMatrix = (labels, matrix) => {
    const max = Math.max(...matrix.flat(), 1);
    const cells = matrix.flatMap((row, rowIndex) => row.map((value, columnIndex) => {
        const intensity = Math.round(12 + (value / max) * 50);
        return `<span style="background:rgb(${18 + intensity}, ${72 + intensity}, ${76 + intensity})" title="Actual ${labels[rowIndex]}, predicted ${labels[columnIndex]}">${value}</span>`;
    })).join("");
    document.getElementById("confusion-matrix").innerHTML = `<div class="matrix-labels"><b></b>${labels.map((label) => `<b>${label}</b>`).join("")}</div>${matrix.map((row, index) => `<div class="matrix-row"><b>${labels[index]}</b>${row.map((value, cellIndex) => `<span style="background:rgb(${18 + Math.round(12 + (value / max) * 50)}, ${72 + Math.round(12 + (value / max) * 50)}, ${76 + Math.round(12 + (value / max) * 50)})" title="Actual ${labels[index]}, predicted ${labels[cellIndex]}">${value}</span>`).join("")}</div>`).join("")}`;
};

const loadMlPerformance = async () => {
    try {
        const response = await fetch("/api/ml-performance");
        if (!response.ok) throw new Error("Unable to load model metrics");
        const data = await response.json();
        document.getElementById("ml-accuracy").textContent = `${data.accuracy}%`;
        document.getElementById("ml-model-meta").textContent = `${data.model} · ${data.parameters}`;
        document.getElementById("ml-algorithm").textContent = data.model;
        document.getElementById("ml-features").textContent = data.features.join(" + ");
        document.getElementById("ml-target").textContent = data.target;
        document.getElementById("ml-split").textContent = `${data.train_rows} train · ${data.test_rows} test`;
        renderMetricBars(data.class_metrics);
        renderFeatureImportance(data.feature_importance);
        renderPredictionCounts(data.prediction_counts);
    } catch (error) {
        document.getElementById("ml-model-meta").textContent = "Model metrics unavailable. Start the Flask server and refresh.";
    }
};

loadMlPerformance();
