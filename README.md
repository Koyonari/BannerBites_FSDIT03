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

![User Home](./public/screenshots/BannerBites_UserHome.png)  
**Description:** Landing page for operators and admins, showing personalized options and key features.

---

### 2. Homepage

![Homepage](./public/screenshots/BannerBites_Homepage.png)  
**Description:** Main dashboard showcasing all available features and navigation options.

---

### 3. Ad Canvas

![Ad Canvas](./public/screenshots/BannerBites_AdCanvas.png)  
**Description:** Main workspace where users can create and edit their ad designs.

---

### 4. Ad Creation

![Ad Creation](./public/screenshots/BannerBites_AdCreation.png)  
**Description:** Interface for creating a new ad within the application.

---

### 5. Ad Preview

![Ad Preview](./public/screenshots/BannerBites_AdPreview.png)  
**Description:** Preview interface allowing users to view ads before saving or publishing.

---

### 6. Ad Preview with Full-Screen Button

![Ad Preview with Full-Screen Button](./public/screenshots/BannerBites_AdPreviewWithFullScreenButton.png)  
**Description:** Full-screen preview option for better visualization of ad designs.

---

### 7. Layouts Tab

![Layouts Tab](./public/screenshots/BannerBites_LayoutsTab.png)  
**Description:** Tab where users can view, create, and assign layouts to ads.

---

### 8. Save Layout Popup

![Save Layout Popup](./public/screenshots/BannerBites_SaveLayoutPopup.png)  
**Description:** Popup that appears when users save a layout.

---

### 9. Successfully Saved Layout Popup

![Successfully Saved Layout Popup](./public/screenshots/BannerBites_SuccessfullySaveLayoutPopup.png)  
**Description:** Confirmation popup indicating successful saving of a layout.

---

### 10. Selection Mode

![Selection Mode](./public/screenshots/BannerBites_SelectionMode.png)  
**Description:** Interface mode where users can select and manipulate ad elements.

---

### 11. Increase Ad Size Button

![Increase Ad Size Button](./public/screenshots/BannerBites_IncreaseAdSizeButton.png)  
**Description:** Button used to increase the size of ad elements or canvas.

---

### 12. Decrease Ad Size Button

![Decrease Ad Size Button](./public/screenshots/BannerBites_DecreaseAdSizeButton.png)  
**Description:** Button used to decrease the size of ad elements or canvas.

---

### 13. Delete Confirmation Popup

![Delete Confirmation Popup](./public/screenshots/BannerBites_DeleteConfirmationPopup.png)  
**Description:** Popup shown when users attempt to delete an ad or element, requiring confirmation.

---

### 14. Tooltips

![Tooltips](./public/screenshots/BannerBites_Tooltips.png)  
**Description:** Tooltips providing additional guidance and information about features and functionality.

## NPM Modules Used

### Back-End Dependencies

- **`@aws-sdk/client-dynamodb`**, **`@aws-sdk/client-dynamodb-streams`**, **`@aws-sdk/client-s3`**, **`@aws-sdk/lib-dynamodb`**, **`@aws-sdk/s3-request-presigner`**: AWS SDK modules for accessing and interacting with DynamoDB and S3 services.
- **`aws-sdk`**: A comprehensive AWS SDK for Node.js, used to interact with various AWS services.
- **`bcrypt`**: A library to hash passwords for securely storing user credentials.
- **`body-parser`**: Middleware for parsing incoming request bodies.
- **`cors`**: Middleware to allow Cross-Origin Resource Sharing.
- **`dotenv`**: Loads environment variables from a `.env` file.
- **`express`**: A web framework for building server-side applications.
- **`jsonwebtoken`**: Library to generate and verify JSON Web Tokens for authentication.
- **`lodash.debounce`**: A utility function to delay execution of a function call.
- **`socket.io`**: Adds real-time, bi-directional communication between client and server.
- **`uuid`**: Generates unique identifiers, useful for tracking sessions or items.
- **`ws`**: A WebSocket library to provide real-time functionalities.

#### Dev Dependencies

- **`@jest/globals`**: Provides Jest global functions for testing.
- **`aws-sdk-client-mock`**: A mocking library for AWS SDK clients, useful in unit tests.
- **`jest`**: A testing framework for JavaScript, used to create and run tests.
- **`nodemon`**: Automatically restarts the server when code changes are detected, enhancing the development workflow.
- **`webpack`**, **`webpack-cli`**: Bundles and compiles code for server-side applications.

---

### Front-End Dependencies

- **`@aws-amplify/storage`**, **`aws-amplify`**: Enables AWS Amplify storage and services, used for handling cloud operations and data storage.
- **`amazon-cognito-identity-js`**: Provides Cognito identity management for user authentication.
- **`@aws-amplify/ui-react`**: AWS Amplify's UI components for React.
- **`@emotion/react`**, **`@emotion/styled`**: CSS-in-JS libraries used with Material UI.
- **`@mui/material`**, **`@mui/icons-material`**: Material UI components and icons for React.
- **`axios`**: A promise-based HTTP client for making API requests.
- **`react`**, **`react-dom`**: Core libraries for building and rendering React applications.
- **`react-router-dom`**: Provides client-side routing for React.
- **`react-use-websocket`**: A React hook for managing WebSocket connections and state.
- **`socket.io-client`**: Client-side Socket.IO library for real-time communication.
- **`uuid`**: Generates unique identifiers, consistent with back-end use.
- **`web-vitals`**: Collects performance metrics to monitor user experience.

---

### UI/UX Enhancements

- **`hamburger-react`**: A simple hamburger menu component for React.
- **`framer-motion`**: A React component library that implements animations as well.
- **`lucide-react`**: A set of icons available as React components.
- **`react-color`**: A customizable color picker component.
- **`react-datetime-picker`**: A date-time picker for scheduling inputs.
- **`react-dnd`**, **`react-dnd-html5-backend`**: Libraries for drag-and-drop functionalities.
- **`react-hot-toast`**: Provides lightweight, customizable notifications.
- **`react-tooltip`**: Tooltips for better UI interactivity.
- **`react-modal`**, **`react-model`**: Components for managing modal popups.
- **`react-toggle-dark-mode`**: Provides a dark mode toggle for enhancing user interface.

---

### Styling and Formatting

- **`tailwindcss`**: A utility-first CSS framework for rapid UI development.
- **`prettier`**, **`prettier-plugin-tailwindcss`**: Code formatting tools, including for Tailwind CSS integration.

---

### Scripts

#### Frontend

- **`npm start`**: Start development server.
- **`npm run build`**: Build production files.

#### Backend

- **`npm start`**: Start server.
- **`npm run dev`**: Development mode with Nodemon.
