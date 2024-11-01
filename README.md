# Full Stack Development Assignment

### Contributors

- Yeo Jin Rong
- An Yong Shyan
- Ng Kai Huat Jason
- Liang Ding Xuan
- Tan Guo Zhi Kelvin

---

# BannerBites

BannerBites is a web application for managing advertisements dynamically with real-time updates. The project utilizes a React.js frontend, a Node.js backend, and AWS DynamoDB/S3 Bucket for data storage with WebSocket support.

## Project Structure

- **Frontend**: React.js for the user interface, incorporating libraries for AWS integration, WebSocket, and UI styling.
- **Backend**: Node.js server for API requests, AWS interactions, and WebSocket functionality.

## Dependencies

### Frontend (React.js)

#### AWS Services

- `@aws-amplify/storage`
- `@aws-amplify/ui-react`
- `amazon-cognito-identity-js`
- `aws-amplify`
- `aws-sdk`

#### UI & Styling

- `@emotion/react`
- `@emotion/styled`
- `@mui/icons-material`
- `@mui/material`
- `tailwindcss`

#### Testing

- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`

#### Utilities

- `hamburger-react`
- `lucide-react`
- `axios`
- `react`
- `react-color`
- `react-datetime-picker`
- `react-dnd`
- `react-dnd-html5-backend`
- `react-dom`
- `react-modal`
- `react-model`
- `react-router-dom`
- `react-scripts`
- `react-toggle-dark-mode`
- `socket.io-client`
- `uuid`
- `web-vitals`

### Backend (Node.js)

#### AWS SDK

- `@aws-sdk/client-dynamodb`
- `@aws-sdk/client-s3`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/s3-request-presigner`

#### Server Framework & Middleware

- `express`
- `cors`
- `body-parser`
- `dotenv`

#### Real-time Communication

- `socket.io`
- `ws`

#### Utilities

- `uuid`

### Development Dependencies

- **React Dev**:
  - `tailwindcss` for styling
- **Node Dev**:
  - `nodemon`
  - `webpack`
  - `webpack-cli`

## Scripts

### Frontend

- `npm start`: Start development server.
- `npm run build`: Build production files.

### Backend

- `npm start`: Start server.
- `npm run dev`: Development mode with Nodemon.
