# Full Stack Development Assignment

### Contributors

- Yeo Jin Rong
- An Yong Shyan
- Ng Kai Huat Jason
- Liang Ding Xuan
- Tan Guo Zhi Kelvin

---

# BannerBites

### Introduction
BannerBites is a web application for managing advertisements dynamically with real-time updates. The project utilizes a React.js frontend, a Node.js backend, and AWS DynamoDB/S3 Bucket for data storage with WebSocket support.

### Objective
In recent years, the advertising industry has undergone significant
 transformation driven by advancements in technology and shifts in
 consumer behavior. The rise of smart TVs and streaming platforms
 has changed how audiences consume content, leading to a surge in
 over-the-top (OTT) media services. This has opened new avenues for
 advertisers to reach audiences through interactive and targeted ads.

 ### Features
  -1. Customizable layout
  -2. Real time communication
  -3. Improved UI/UX for Operators

## Project Structure

- **Frontend**: React.js for the user interface, incorporating libraries for AWS integration, WebSocket, and UI styling.
- **Backend**: Node.js server for API requests, AWS interactions, and WebSocket functionality.

## Project Screenshots
### 1. User Home
**File Name:** `BannerBites_UserHome.png`  
**Description:** Landing page for operators and admins

## NPM Modules Used

### Back-End Dependencies

- **`@aws-sdk/client-dynamodb`**, **`@aws-sdk/client-dynamodb-streams`**, **`@aws-sdk/client-s3`**, **`@aws-sdk/lib-dynamodb`**, **`@aws-sdk/s3-request-presigner`**: AWS SDK modules for accessing and interacting with DynamoDB and S3 services.
- **`aws-sdk`**: A comprehensive AWS SDK for Node.js, used to interact with various AWS services.
- **`body-parser`**: Middleware for parsing incoming request bodies.
- **`cors`**: Middleware to allow Cross-Origin Resource Sharing.
- **`dotenv`**: Loads environment variables from a `.env` file.
- **`express`**: A web framework for building server-side applications.
- **`lodash.debounce`**: A utility function to delay execution of a function call.
- **`socket.io`**: Adds real-time, bi-directional communication between client and server.
- **`uuid`**: Generates unique identifiers, useful for tracking sessions or items.
- **`ws`**: A WebSocket library to provide real-time functionalities.

#### Dev Dependencies

- **`nodemon`**: Automatically restarts the server when code changes, used for development.
- **`webpack`**, **`webpack-cli`**: Bundles and compiles code for server-side applications.

---

### Front-End Dependencies

- **`@aws-amplify/storage`**, **`aws-amplify`**: Enables AWS Amplify storage and services, used for handling cloud operations and data storage.
- **`amazon-cognito-identity-js`**: Provides Cognito identity management for user authentication.
- **`@aws-amplify/ui-react`**: AWS Amplify’s UI components for React.
- **`@emotion/react`**, **`@emotion/styled`**: CSS-in-JS libraries used with Material UI.
- **`@mui/material`**, **`@mui/icons-material`**: Material UI components and icons for React.
- **`axios`**: A promise-based HTTP client for making API requests.
- **`react`**, **`react-dom`**: Core libraries for building and rendering React applications.
- **`react-router-dom`**: Provides client-side routing for React.
- **`socket.io-client`**: Client-side Socket.IO library for real-time communication.
- **`uuid`**: Generates unique identifiers, consistent with back-end use.
- **`web-vitals`**: Collects performance metrics.
- **`webgazer`**: Gaze-tracking library for capturing user interactions.

---

### UI/UX Enhancements

- **`hamburger-react`**: A simple hamburger menu component for React.
- **`lucide-react`**: A set of icons available as React components.
- **`react-color`**: A customizable color picker component.
- **`react-datetime-picker`**: A date-time picker for scheduling inputs.
- **`react-dnd`**, **`react-dnd-html5-backend`**: Libraries for drag-and-drop functionalities.
- **`react-tooltip`**: Tooltips for better UI interactivity.
- **`react-modal`**, **`react-model`**: Components for managing modal popups.

---

### Styling and Formatting

- **`tailwindcss`**: A utility-first CSS framework for rapid UI development.
- **`prettier`**, **`prettier-plugin-tailwindcss`**: Code formatting tools, including for Tailwind CSS integration.
## Scripts

### Frontend

- `npm start`: Start development server.
- `npm run build`: Build production files.

### Backend

- `npm start`: Start server.
- `npm run dev`: Development mode with Nodemon.
