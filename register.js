// Show/hide role-specific fields
document.getElementById('role').addEventListener('change', (e) => {
    const doctorFields = document.getElementById('doctorFields');
    const caregiverFields = document.getElementById('caregiverFields');
    
    doctorFields.style.display = e.target.value === 'doctor' ? 'block' : 'none';
    caregiverFields.style.display = e.target.value === 'caregiver' ? 'block' : 'none';
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    // Add role-specific fields
    if (formData.role === 'doctor') {
        formData.license = document.getElementById('license').value;
        formData.specialization = document.getElementById('specialization').value;
    } else if (formData.role === 'caregiver') {
        formData.patientEmail = document.getElementById('patientEmail').value;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = '/login.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
    }
}); 