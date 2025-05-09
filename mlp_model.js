// Simple MLP model for cognitive assessment
function assess(data) {
    // Validate input data
    const { behavioralProblems, memoryComplaints, functionalAssessment, adl, mmse } = data;
    
    // Calculate risk score (simplified version)
    const riskScore = calculateRiskScore(behavioralProblems, memoryComplaints, functionalAssessment, adl, mmse);
    
    // Determine risk level
    const { riskLevel, confidence } = determineRiskLevel(riskScore);
    
    // Generate recommendations
    const recommendations = generateRecommendations(riskLevel, data);
    
    return {
        riskLevel,
        confidence,
        recommendations,
        assessmentDate: new Date().toISOString()
    };
}

function calculateRiskScore(behavioral, memory, functional, adl, mmse) {
    // Normalize scores to 0-1 range
    const normalizedBehavioral = behavioral / 10;
    const normalizedMemory = memory / 10;
    const normalizedFunctional = 1 - (functional / 10); // Invert so higher means more risk
    const normalizedADL = 1 - (adl / 10); // Invert so higher means more risk
    const normalizedMMSE = 1 - (mmse / 30); // Invert so higher means more risk

    // Weighted sum (weights based on clinical importance)
    return (
        normalizedBehavioral * 0.2 +
        normalizedMemory * 0.25 +
        normalizedFunctional * 0.2 +
        normalizedADL * 0.15 +
        normalizedMMSE * 0.2
    );
}

function determineRiskLevel(riskScore) {
    if (riskScore < 0.3) {
        return {
            riskLevel: 'Low Risk',
            confidence: 0.9
        };
    } else if (riskScore < 0.6) {
        return {
            riskLevel: 'Moderate Risk',
            confidence: 0.85
        };
    } else {
        return {
            riskLevel: 'High Risk',
            confidence: 0.8
        };
    }
}

function generateRecommendations(riskLevel, data) {
    const recommendations = [];

    // Basic recommendations for all risk levels
    recommendations.push('Maintain a regular sleep schedule and get 7-9 hours of sleep per night.');
    recommendations.push('Stay physically active with at least 30 minutes of exercise daily.');
    recommendations.push('Engage in social activities and maintain strong social connections.');

    // Risk-specific recommendations
    if (riskLevel === 'Low Risk') {
        recommendations.push('Continue current lifestyle and cognitive activities.');
        recommendations.push('Schedule regular check-ups with your healthcare provider.');
        recommendations.push('Consider joining cognitive enhancement programs or brain training activities.');
    } else if (riskLevel === 'Moderate Risk') {
        recommendations.push('Schedule a comprehensive cognitive assessment with a specialist.');
        recommendations.push('Increase frequency of cognitive stimulation activities.');
        recommendations.push('Consider medication review with your healthcare provider.');
        recommendations.push('Monitor changes in daily functioning more closely.');
    } else { // High Risk
        recommendations.push('Immediate consultation with a neurologist or memory specialist is recommended.');
        recommendations.push('Implement daily routine tracking and safety measures.');
        recommendations.push('Consider caregiver support and resources.');
        recommendations.push('Evaluate current living situation and support needs.');
    }

    // Additional recommendations based on specific scores
    if (data.mmse < 24) {
        recommendations.push('Further detailed cognitive testing is recommended.');
    }
    if (data.functionalAssessment < 5) {
        recommendations.push('Consider occupational therapy assessment for daily activities support.');
    }
    if (data.behavioralProblems > 7) {
        recommendations.push('Psychological support or counseling may be beneficial.');
    }

    return recommendations;
}

module.exports = {
    assess
}; 