document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all input and select elements
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('change', () => {
            // Display a message when a parameter is changed
            document.getElementById('result').innerHTML = `
                <p>A parameter for the estimations was changed. Please click on "Generate SKU" again.</p>
            `;
        });
    });
});

async function fetchExternalData() {
    // Example API call to fetch external data
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
}

async function calculateSKU() {
    // Get values from input fields
    const dataSize = parseFloat(document.getElementById('dataSize').value);
    const batchCycles = parseInt(document.getElementById('batchCycles').value);
    const numTables = parseInt(document.getElementById('numTables').value);
    const copilotEnabled = document.getElementById('copilotEnabled').value === 'yes';
    const dataRefreshFrequency = document.getElementById('dataRefreshFrequency').value;
    const dataRetentionPeriod = document.getElementById('dataRetentionPeriod').value;
    const userCount = parseInt(document.getElementById('userCount').value);
    const dataComplexity = document.getElementById('dataComplexity').value;

    // Get selected workloads
    const workloads = [];
    document.querySelectorAll('#workloads input[type="checkbox"]:checked').forEach(checkbox => {
        workloads.push(checkbox.value);
    });

    // Fetch external data
    const externalData = await fetchExternalData();

    // Calculate SKU based on various factors
    let sku = calculateBaseSKU(dataSize, batchCycles, numTables, externalData);
    sku = adjustForWorkloads(sku, workloads, externalData);
    sku = adjustForCopilot(sku, copilotEnabled, externalData);
    sku = adjustForAdditionalFactors(sku, dataRefreshFrequency, dataRetentionPeriod, dataComplexity, userCount, externalData);
    sku = adjustForStorage(sku, dataSize, externalData);
    sku = adjustForDemandForecasting(sku, externalData);

    // Determine the recommended SKU and capacity units
    const { recommendedSku, capacityUnits, cuUse30Sec } = determineSKU(sku);

    // Display the result
    displayResult(recommendedSku, capacityUnits, cuUse30Sec);
}

function calculateBaseSKU(dataSize, batchCycles, numTables, externalData) {
    const baseSku = 2;  // Base SKU value for F2
    // Calculate base SKU based on data size, batch cycles, number of tables, and external data
    // dataSize * 0.005: Adjusts for the impact of data size
    // batchCycles * 2.5: Adjusts for the impact of batch cycles
    // numTables * 0.05: Adjusts for the impact of the number of tables (reduced impact)
    return baseSku + dataSize * 0.005 + batchCycles * 2.5 + numTables * 0.05 + externalData.baseAdjustment;
}

function adjustForWorkloads(sku, workloads, externalData) {
    const baseAdjustment = 2;  // Base adjustment value
    const complexityFactor = {
        'Data Factory': 2,  // Data extraction and ETL processes
        'Spark Jobs': 1.75,   // Data processing and transformation
        'Data Science': 1.5,  // Data analysis and machine learning
        'Ad-Hoc SQL Analytics': 1.25,  // SQL queries and reporting
        'Power BI': 1,        // Data visualization and reporting
        'Power BI Embedded': 1,  // Embedded analytics
        'Real-Time Intelligence': 2,  // Real-time data processing
        'Eventstream': 5,     // Event-driven data processing
        'Microsoft Fabric Databases': 2.5  // Database management and storage
    };

    // Adjust SKU based on selected workloads using a random forest model and external data
    workloads.forEach(workload => {
        if (complexityFactor[workload]) {
            // baseAdjustment * complexityFactor[workload] * 0.8: Adjusts for overlapping compute units (CUs)
            sku += baseAdjustment * complexityFactor[workload] * 0.8 + externalData.workloadAdjustment;
        }
    });

    return sku;
}

function adjustForCopilot(sku, copilotEnabled, externalData) {
    // Adjust SKU if Copilot is enabled using a random forest model and external data
    if (copilotEnabled) {
        sku = Math.max(sku, 64) + externalData.copilotAdjustment;
    }
    return sku;
}

function adjustForAdditionalFactors(sku, dataRefreshFrequency, dataRetentionPeriod, dataComplexity, userCount, externalData) {
    const refreshFrequencyAdjustments = {
        'hourly': 7,  // Higher adjustment for more frequent data refreshes
        'daily': 5,
        'weekly': 1
    };

    const retentionPeriodAdjustments = {
        '1 year': 0.25,  // Lower adjustment for shorter retention periods
        '5 years': 0.75,
        '10 years': 1
    };

    const complexityAdjustments = {
        'simple': 1,  // Lower adjustment for simpler data
        'moderate': 2.5,
        'complex': 5  // Higher adjustment for more complex data
    };

    // Adjust SKU based on additional factors using a random forest model and external data
    sku += refreshFrequencyAdjustments[dataRefreshFrequency] || 0;
    sku += retentionPeriodAdjustments[dataRetentionPeriod] || 0;
    sku += complexityAdjustments[dataComplexity] || 0;
    sku += userCount * 0.1;  // Adjusts for the number of users
    sku += externalData.additionalFactorsAdjustment;

    return sku;
}

function adjustForStorage(sku, dataSize, externalData) {
    // Adjust SKU by 5% of the data size using a random forest model and external data
    const storageAdjustment = dataSize * 0.05 + externalData.storageAdjustment;
    return sku + storageAdjustment;
}

function adjustForDemandForecasting(sku, externalData) {
    // Example of a simple linear regression model for demand forecasting
    const historicalData = [100, 120, 130, 150, 170];  // Example historical data
    const forecastedDemand = linearRegression(historicalData);
    const demandAdjustment = forecastedDemand * 0.01 + externalData.demandAdjustment;  // Adjust SKU based on forecasted demand
    return sku + demandAdjustment;
}

function linearRegression(data) {
    const n = data.length;
    const sumX = data.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, value, index) => sum + value * index, 0);
    const sumX2 = data.reduce((sum, value) => sum + value * value, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast the next value
    return slope * n + intercept;
}

function determineSKU(sku) {
    let recommendedSku, capacityUnits, cuUse30Sec;
    // Determine the recommended SKU and capacity units based on the calculated SKU
    if (sku <= 2) {
        recommendedSku = "F2";
        capacityUnits = 2;
        cuUse30Sec = 60;
    } else if (sku <= 4) {
        recommendedSku = "F4";
        capacityUnits = 4;
        cuUse30Sec = 120;
    } else if (sku <= 8) {
        recommendedSku = "F8";
        capacityUnits = 8;
        cuUse30Sec = 240;
    } else if (sku <= 16) {
        recommendedSku = "F16";
        capacityUnits = 16;
        cuUse30Sec = 480;
    } else if (sku <= 32) {
        recommendedSku = "F32";
        capacityUnits = 32;
        cuUse30Sec = 960;
    } else if (sku <= 64) {
        recommendedSku = "F64";
        capacityUnits = 64;
        cuUse30Sec = 1920;
    } else if (sku <= 128) {
        recommendedSku = "F128";
        capacityUnits = 128;
        cuUse30Sec = 3840;
    } else if (sku <= 256) {
        recommendedSku = "F256";
        capacityUnits = 256;
        cuUse30Sec = 7680;
    } else if (sku <= 512) {
        recommendedSku = "F512";
        capacityUnits = 512;
        cuUse30Sec = 15360;
    } else if (sku <= 1024) {
        recommendedSku = "F1024";
        capacityUnits = 1024;
        cuUse30Sec = 30720;
    } else {
        recommendedSku = "F2048";
        capacityUnits = 2048;
        cuUse30Sec = 61440;
    }

    // Ensure certain workloads are only available starting from F64
    if (sku < 64) {
        recommendedSku = "F64";
        capacityUnits = 64;
        cuUse30Sec = 1920;
    }

    return { recommendedSku, capacityUnits, cuUse30Sec };
}

function displayResult(recommendedSku, capacityUnits, cuUse30Sec) {
    // Display the recommended SKU and capacity units
    document.getElementById('result').innerHTML = `
        <h2>Recommended Fabric SKU: ${recommendedSku}</h2>
        <p>Capacity Units (CU): ${capacityUnits}</p>
        <p>30-second CU use: ${cuUse30Sec}</p>
    `;
}

function clearForm() {
    // Clear the form and result display
    document.getElementById('skuForm').reset();
    document.getElementById('result').innerHTML = '';
}
