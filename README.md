# Cogniscan - Early Alzheimer's Detection Platform

Cogniscan is a cutting-edge medical web platform for Alzheimer's detection that balances clinical professionalism with approachable design. The interface conveys medical authority while remaining welcoming and intuitive for potentially anxious users who may be concerned about cognitive health.

## Features

- Modern, accessible UI design
- Responsive layout for all devices
- Smooth animations and transitions
- Professional medical styling
- Early detection assessment tools
- Resource library for cognitive health

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Heroicons

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cogniscan.git
cd cogniscan
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

### File Structure

```
cogniscan/
├── app/
│   ├── components/    # Reusable UI components
│   ├── lib/          # Utility functions and helpers
│   ├── pages/        # Application pages
│   └── styles/       # Global styles and Tailwind config
├── public/           # Static assets
└── package.json      # Project dependencies and scripts
```

### Design System

The project uses a consistent design system with:

- Color Palette:
  - Primary: #3A7CA5 (Medical Blue)
  - Secondary: #81C3BE (Mint Green)
  - Accent: #F49097 (Coral)
  - Base: #FFFFFF, #F8F9FA (Whites)
  - Text: #2A3D45 (Slate)

- Typography:
  - Headings: Montserrat
  - Body: Inter
  - Medical Data: Roboto Mono

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Medical institutions and professionals who provided guidance
- Open source community for various tools and libraries
- Users who provided valuable feedback during development

# Alzheimer's Prediction App: Quick Start

## 🚀 How to Run the MLP Model API

1. **Install requirements:**
   ```bash
   pip install flask tensorflow numpy
   ```
2. **Run the API server:**
   ```bash
   python ml/serve_mlp_api.py
   ```
   This will start a server at `http://127.0.0.1:5000`.

3. **Send a prediction request:**
   - POST to `/predict` with JSON like:
     ```json
     {
       "behavioral_problems": 1,
       "memory_complaints": 1,
       "functional_assessment": 12.5,
       "adl": 8.0,
       "mmse": 27
     }
     ```
   - The response will be a prediction array.

4. **Connect your frontend:**
   - Make your web form send a POST request to `/predict` with the above JSON structure.
   - Display the result to the user.

--- 