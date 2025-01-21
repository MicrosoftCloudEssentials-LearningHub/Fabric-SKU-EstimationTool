document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('change', () => {
            document.getElementById('result').innerHTML = `
                <p>A parameter for the estimations was changed. Please click on "Calculate SKU" again.</p>
            `;
        });
    });
});

function calculateSKU() {
    const dataSize = parseFloat(document.getElementById('dataSize').value);
    const batchCycles = parseInt(document.getElementById('batchCycles').value);
    const numTables = parseInt(document.getElementById('numTables').value);
    const copilotEnabled = document.getElementById('copilotEnabled').value === 'yes';
    const dataRefreshFrequency = document.getElementById('dataRefreshFrequency').value;
    const peakUsageTimes = document.getElementById('peakUsageTimes').value;
    const dataRetentionPeriod = document.getElementById('dataRetentionPeriod').value;
    const userCount = parseInt(document.getElementById('userCount').value);
    const dataComplexity = document.getElementById('dataComplexity').value;

    const workloads = [];
    document.querySelectorAll('#workloads input[type="checkbox"]:checked').forEach(checkbox => {
        workloads.push(checkbox.value);
    });

    let sku = calculateBaseSKU(dataSize, batchCycles, numTables);
    sku = adjustForWorkloads(sku, workloads);
    sku = adjustForCopilot(sku, copilotEnabled);
    sku = adjustForAdditionalFactors(sku, dataRefreshFrequency, dataRetentionPeriod, dataComplexity, userCount);

    const { recommendedSku, capacityUnits, cuUse30Sec } = determineSKU(sku);

    displayResult(recommendedSku, capacityUnits, cuUse30Sec);
}

function calculateBaseSKU(dataSize, batchCycles, numTables) {
    const baseSku = 2;  // Base SKU value for F2
    return baseSku + dataSize * 0.005 + batchCycles * 2.5 + numTables * 0.05;  // Reduced impact of numTables
}

function adjustForWorkloads(sku, workloads) {
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

    workloads.forEach(workload => {
        if (complexityFactor[workload]) {
            sku += baseAdjustment * complexityFactor[workload] * 0.8;  // Adjusting for overlapping CUs
        }
    });

    return sku;
}

function adjustForCopilot(sku, copilotEnabled) {
    if (copilotEnabled) {
        sku = Math.max(sku, 64) + 12.5;
    }
    return sku;
}

function adjustForAdditionalFactors(sku, dataRefreshFrequency, dataRetentionPeriod, dataComplexity, userCount) {
    const refreshFrequencyAdjustments = {
        'hourly': 10,
        'daily': 5,
        'weekly': 2
    };

    const retentionPeriodAdjustments = {
        '1 year': 2,
        '5 years': 5,
        '10 years': 10
    };

    const complexityAdjustments = {
        'simple': 2,
        'moderate': 5,
        'complex': 10
    };

    sku += refreshFrequencyAdjustments[dataRefreshFrequency] || 0;
    sku += retentionPeriodAdjustments[dataRetentionPeriod] || 0;
    sku += complexityAdjustments[dataComplexity] || 0;
    sku += userCount * 0.1;

    return sku;
}

function determineSKU(sku) {
    let recommendedSku, capacityUnits, cuUse30Sec;

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

    return { recommendedSku, capacityUnits, cuUse30Sec };
}

function displayResult(recommendedSku, capacityUnits, cuUse30Sec) {
    document.getElementById('result').innerHTML = `
        <h2>Recommended Fabric SKU: ${recommendedSku}</h2>
        <p>Capacity Units (CU): ${capacityUnits}</p>
        <p>30-second CU use: ${cuUse30Sec}</p>
    `;
}

function clearForm() {
    document.getElementById('skuForm').reset();
    document.getElementById('result').innerHTML = '';
}
