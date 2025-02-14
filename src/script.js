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
    const url = 'https://jsonplaceholder.typicode.com/posts/1'; // Example API endpoint

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Simulate adjustments based on fetched data
        return {
            baseAdjustment: data.userId,
            workloadAdjustment: data.id,
            copilotAdjustment: data.userId * 0.1,
            additionalFactorsAdjustment: data.id * 0.2,
            storageAdjustment: data.userId * 0.05,
            demandAdjustment: data.id * 0.01
        };
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return { baseAdjustment: 0, workloadAdjustment: 0, copilotAdjustment: 0, additionalFactorsAdjustment: 0, storageAdjustment: 0, demandAdjustment: 0 };
    }
}

async function calculateSKU() {
    // Get values from input fields
    const dataSize = parseFloat(document.getElementById('dataSize').value);
    const batchCycles = parseInt(document.getElementById('batchCycles').value);
    const numTables = parseInt(document.getElementById('numTables').value);
    const copilotEnabled = document.getElementById('copilotEnabled').value === 'yes';
    const dataRefreshFrequency = document.getElementById('dataRefreshFrequency').value;
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
    sku = adjustForWorkloads(sku, workloads);
    sku = adjustForCopilot(sku, copilotEnabled);
    sku = adjustForAdditionalFactors(sku, dataRefreshFrequency, dataComplexity);
    sku = adjustForStorage(sku, dataSize);
    sku = adjustForDemandForecasting(sku);

    // Determine the recommended SKU and capacity units
    const { recommendedSku, capacityUnits, cuUse30Sec } = determineSKU(sku);

    // Display the result
    displayResult(recommendedSku, capacityUnits, cuUse30Sec);
}

function calculateBaseSKU(dataSize, batchCycles, numTables, externalData) {
    const baseSku = 2;  // Base SKU value for F2
    // Calculate base SKU based on data size, batch cycles, number of tables, and external data
    return baseSku + dataSize * 0.01 + batchCycles * 1.5 + numTables * 0.001 + externalData.baseAdjustment;
}

function adjustForWorkloads(sku, workloads) {
    const baseAdjustment = 2;  // Base adjustment value
    const complexityFactor = {
        'Data Factory': 0.2,  // Data extraction and ETL processes
        'Spark Jobs': 0.175,   // Data processing and transformation
        'Data Science': 0.15,  // Data analysis and machine learning
        'Ad-Hoc SQL Analytics': 0.125,  // SQL queries and reporting
        'Power BI': 0.1,        // Data visualization and reporting
        'Power BI Embedded': 0.1,  // Embedded analytics
        'Real-Time Intelligence': 0.2,  // Real-time data processing
        'Eventstream': 0.5,     // Event-driven data processing
        'Microsoft Fabric Databases': 0.25  // Database management and storage
    };

    // Adjust SKU based on selected workloads
    workloads.forEach(workload => {
        if (complexityFactor[workload]) {
            sku += baseAdjustment * complexityFactor[workload];
        }
    });

    return sku;
}

function adjustForCopilot(sku, copilotEnabled) {
    // Check if Copilot is enabled
    if (copilotEnabled) {
        // Ensure the SKU is at least 64 if Copilot is enabled
        if (sku < 64) {
            sku = 64;
        } else {
            // Calculate a dynamic increment based on 2% of the current SKU
            const increment = Math.ceil(sku * 0.02);
            // Add the increment to the current SKU
            sku += increment;
        }
    }
    // Return the adjusted SKU value
    return sku;
}

function adjustForAdditionalFactors(sku, dataRefreshFrequency, dataComplexity) {
    const refreshFrequencyAdjustments = {
        'hourly': 0.7,  // Higher adjustment for more frequent data refreshes
        'daily': 0.5,
        'weekly': 0.1
    };

    const complexityAdjustments = {
        'simple': 0.5,  // Lower adjustment for simpler data
        'moderate': 1.5,
        'complex': 2  // Higher adjustment for more complex data
    };

    // Adjust SKU based on additional factors
    sku += refreshFrequencyAdjustments[dataRefreshFrequency] || 0;
    sku += complexityAdjustments[dataComplexity] || 0;

    return sku;
}

function adjustForStorage(sku, dataSize) {
    // Adjust SKU by 0.5% of the data size
    const storageAdjustment = dataSize * 0.005;
    return sku + storageAdjustment;
}

function adjustForDemandForecasting(sku) {
    // Simple adjustment for demand forecasting
    const demandAdjustment = sku * 0.01;  // Adjust based on SKU value
    return sku + demandAdjustment;
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

    return { recommendedSku, capacityUnits, cuUse30Sec };
}

function displayResult(recommendedSku, capacityUnits, cuUse30Sec) {
    // Display the recommended SKU and capacity units
    document.getElementById('result').innerHTML = `
        <h2>Recommended Fabric SKU: ${recommendedSku}</h2>
        <p>Capacity Units (CU): ${capacityUnits}</p>
        <p>30-second CU use: ${cuUse30Sec}</p>
        <p>${getSkuContext(recommendedSku)}</p>
    `;
}

function getSkuContext(sku) {
    const context = {
        "F2": "Suitable for small-scale development and testing environments.",
        "F4": "Ideal for moderate development workloads and small production environments.",
        "F8": "Good for larger development environments and moderate production workloads.",
        "F16": "Suitable for high-demand development and moderate production environments.",
        "F32": "Ideal for large-scale development and high-demand production workloads.",
        "F64": "Best for very large development environments and high-demand production workloads.",
        "F128": "Suitable for enterprise-level development and large-scale production environments.",
        "F256": "Ideal for very large enterprise environments with high compute requirements.",
        "F512": "Best for extremely large enterprise environments with very high compute needs.",
        "F1024": "Suitable for massive enterprise environments with extensive compute requirements.",
        "F2048": "Ideal for the largest enterprise environments with the highest compute demands."
    };
    return context[sku] || "Recommended for specific high-demand use cases.";
}

function clearForm() {
    // Clear the form and result display
    document.getElementById('skuForm').reset();
    document.getElementById('result').innerHTML = '';
}
