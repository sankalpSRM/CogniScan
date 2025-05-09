const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const cors = require('cors');
const bodyParser = require('body-parser');
const mlpModel = require('./mlp_model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Public routes - accessible without authentication
const publicRoutes = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/scan.html',
    '/scan',
    '/api/analyze-scan',  // Making the scan API public
    '/api/login',
    '/api/register',
    '/api/mlp_assess',  // Adding MLP assessment endpoint
    '/mlp_assessment.html',  // Adding MLP assessment page
    '/style.css',
    '/login.js',
    '/register.js',
    '/auth.js',
    '/images',  // Allow access to images
    '/uploads'  // Allow access to uploads
];

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // Change this in production

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept DICOM, NIfTI, and common image formats
        if (file.originalname.match(/\.(dcm|nii|nii\.gz|jpg|jpeg|png|tiff|tif)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only DICOM, NIfTI, and common image formats (JPEG, PNG, TIFF) are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

// In-memory user storage (replace with database in production)
const users = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
    // Skip authentication for public routes and paths
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Role-based access control middleware
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

// Apply authentication middleware
app.use(authenticateToken);

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, license, specialization, patientEmail } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            role,
            ...(role === 'doctor' && { license, specialization }),
            ...(role === 'caregiver' && { patientEmail })
        };

        users.push(user);
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Find user
        const user = users.find(u => u.email === email && u.role === role);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user info and token
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// File upload endpoint
app.post('/api/analyze-scan', upload.single('scan'), async (req, res) => {
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('Processing scan:', req.file.path);

        // Process the scan using Python script
        const options = {
            mode: 'text',
            pythonPath: path.join(__dirname, 'venv/bin/python'),
            pythonOptions: ['-u'],
            scriptPath: __dirname,
            args: [req.file.path]
        };

        PythonShell.run('analyze_scan.py', options, function (err, results) {
            console.log('Python script results:', results);
            console.log('Python script error:', err);

            if (err) {
                console.error('Error analyzing scan:', err);
                return res.status(500).json({ message: 'Error analyzing scan', error: err.message });
            }

            try {
                if (!results || results.length === 0) {
                    console.error('No results from Python script');
                    return res.status(500).json({ message: 'No results from analysis' });
                }

                const analysis = JSON.parse(results[0]);
                console.log('Parsed analysis:', analysis);
                
                if (analysis.error) {
                    return res.status(400).json({ message: analysis.error });
                }
                
                res.json(analysis);
            } catch (e) {
                console.error('Error parsing Python output:', e, results);
                res.status(500).json({ message: 'Error processing scan results', error: e.message });
            }
        });
    } catch (error) {
        console.error('Error processing scan:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// MLP Assessment endpoint
app.post('/api/mlp_assess', async (req, res) => {
    try {
        const { behavioralProblems, memoryComplaints, functionalAssessment, adl, mmse } = req.body;
        
        console.log('Processing MLP assessment:', req.body);
        
        // Validate inputs
        const inputs = [behavioralProblems, memoryComplaints, functionalAssessment, adl, mmse];
        if (inputs.some(input => input === undefined || input === null)) {
            console.log('Missing required inputs');
            return res.status(400).json({ message: 'All assessment values are required' });
        }

        // Process using Python script
        const options = {
            mode: 'text',
            pythonPath: path.join(__dirname, 'venv/bin/python'),
            pythonOptions: ['-u'],
            scriptPath: __dirname,
            args: inputs.map(String)
        };

        console.log('Running MLP prediction with args:', options.args);

        PythonShell.run('mlp_predict.py', options, function (err, results) {
            console.log('MLP Python results:', results);
            console.log('MLP Python error:', err);

            if (err) {
                console.error('Error in MLP assessment:', err);
                return res.status(500).json({ message: 'Error processing assessment', error: err.message });
            }

            try {
                if (!results || results.length === 0) {
                    console.error('No results from MLP Python script');
                    return res.status(500).json({ message: 'No results from assessment' });
                }

                const analysis = JSON.parse(results[0]);
                console.log('Parsed MLP analysis:', analysis);
                
                if (analysis.error) {
                    return res.status(400).json({ message: analysis.error });
                }
                
                res.json(analysis);
            } catch (e) {
                console.error('Error parsing MLP output:', e, results);
                res.status(500).json({ message: 'Error processing assessment results', error: e.message });
            }
        });
    } catch (error) {
        console.error('Error in MLP assessment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, 'scan.html'));
});

app.get('/assessment', (req, res) => {
    res.sendFile(path.join(__dirname, 'assessment.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 