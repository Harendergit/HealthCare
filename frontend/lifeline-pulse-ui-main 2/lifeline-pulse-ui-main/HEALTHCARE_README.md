# LifeLine360 - Healthcare Emergency App

A modern, responsive healthcare emergency application with real-time vitals monitoring, Bluetooth device integration, and role-based dashboards for Patients, Family members, and Emergency Responders.

## 🚀 Features

### Core Features
- **Firebase Authentication** - Secure login/signup for all user roles
- **Firestore Database** - Real-time data storage and synchronization
- **Role-Based Access** - Separate dashboards for Patient, Family, and Responder roles
- **Unique Patient IDs** - Auto-generated IDs for patient identification
- **Family Connections** - Family members can connect to patients using Patient IDs

### Bluetooth & Vitals Monitoring
- **Bluetooth Low Energy (BLE)** support for medical devices
- **Real-time vitals monitoring** (heart rate, oxygen saturation, temperature)
- **Automatic data streaming** to Firestore
- **Live charts and graphs** for vitals visualization
- **Emergency alerts** when vitals cross dangerous thresholds

### User Interfaces
- **Patient Dashboard** - View live vitals, connect devices, emergency SOS
- **Family Dashboard** - Monitor connected patients, view alerts
- **Responder Dashboard** - Receive emergency alerts, patient information
- **Modern UI/UX** - Clean, professional, responsive design

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS with custom medical theme
- **Backend**: Firebase (Authentication + Firestore)
- **Charts**: Recharts
- **Bluetooth**: Web Bluetooth API
- **State Management**: React Context + Hooks

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (for authentication and database)
- Modern browser with Web Bluetooth support (Chrome, Edge)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd lifeline-pulse-ui
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your Firebase configuration

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 👥 User Roles & Features

### Patient Role
- **Sign Up**: Creates account with auto-generated Patient ID
- **Dashboard**: View live vitals, health status, emergency SOS
- **Device Connection**: Pair Bluetooth medical devices
- **Profile**: QR code with medical information

### Family Role
- **Connect to Patient**: Enter Patient ID to monitor family member
- **Dashboard**: View connected patient's vitals and alerts
- **Real-time Monitoring**: Live updates on patient health status
- **Emergency Notifications**: Instant alerts for critical situations

### Responder Role
- **Emergency Alerts**: Receive real-time emergency notifications
- **Patient Information**: Access vital signs and medical data
- **Response Management**: Accept/decline emergency calls
- **Location Services**: Navigation to emergency location

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboards/     # Role-based dashboards
│   ├── vitals/         # Vitals monitoring components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (Auth, Vitals)
├── integrations/
│   ├── firebase/       # Firebase services
│   └── bluetooth/      # Bluetooth integration
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

### Key Technologies

- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore for real-time data
- **Bluetooth**: Web Bluetooth API for device connectivity
- **UI**: Shadcn/ui components with Tailwind CSS
- **Charts**: Recharts for vitals visualization

## 🏥 Medical Device Integration

### Supported Devices
- Heart Rate Monitors (Bluetooth HRM)
- Pulse Oximeters (SpO2 sensors)
- Digital Thermometers
- Blood Pressure Monitors

### Bluetooth Implementation
- Uses Web Bluetooth API
- Supports standard GATT services
- Real-time data streaming
- Automatic reconnection

## 🚨 Emergency System

### Alert Triggers
- Heart Rate: < 60 or > 100 BPM
- Oxygen Saturation: < 90%
- Temperature: < 96.8°F or > 100.4°F
- Manual SOS button

### Response Flow
1. Vital threshold exceeded
2. Emergency alert created in Firestore
3. Responders receive real-time notification
4. Responder can accept/decline emergency
5. Navigation and patient info provided

## 🔒 Security & Privacy

- Firebase Authentication for secure access
- Role-based permissions
- Encrypted data transmission
- HIPAA-compliant data handling
- Secure Bluetooth pairing

## 📱 Browser Compatibility

- Chrome 56+ (Web Bluetooth support)
- Edge 79+
- Opera 43+
- Safari (limited Bluetooth support)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This application is for demonstration purposes. For production medical use, ensure compliance with relevant healthcare regulations and standards.
