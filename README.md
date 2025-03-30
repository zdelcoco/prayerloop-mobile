# Prayerloop – Mobile App

Welcome to **Prayerloop Mobile**! This repository, **prayerloop-mobile**, is the React Native client for Prayerloop. It provides a mobile interface for users to view prayers, join groups, and interact with the Prayerloop platform on iOS and Android devices. The app communicates with the Go-based [prayerloop-backend](https://github.com/zdelcoco/prayerloop-backend) API and leverages the PostgreSQL database setup from [prayerloop-psql](https://github.com/zdelcoco/prayerloop-psql).

---

## Project Overview

The Prayerloop platform is composed of three major repositories:

1. **[prayerloop-psql](https://github.com/zdelcoco/prayerloop-psql)**  
   Contains the PostgreSQL database schema, SQL scripts, and shell scripts for setup and migrations.

2. **[prayerloop-backend](https://github.com/zdelcoco/prayerloop-backend)**  
   A Go-based server that provides RESTful API endpoints, handles authentication, and manages business logic.

3. **[prayerloop-mobile (this repo)](https://github.com/zdelcoco/prayerloop-mobile)**  
   A React Native mobile app that enables users to interact with Prayerloop, providing features such as user authentication, prayer creation, and group management.

---

## Features

- **Cross-Platform Mobile App**  
  Built using React Native (with Expo), the app runs on both iOS and Android devices.
- **User Authentication**  
  Allows users to sign in, sign up, and manage their profiles by communicating with the backend API.
- **Prayer Management**  
  View, create, and manage prayer entries, with intuitive UI components and smooth navigation.
- **Group Interaction**  
  Join groups, view group prayers, and interact with other members of the Prayerloop community.
- **Real-Time Updates**  
  Dynamic UI updates and notifications to keep users engaged with the latest prayer activity.

---

## Prerequisites

- **Node.js** (v14 or higher recommended)
- **npm** or **yarn** (latest stable version)
- **Expo CLI** (install globally)

  ```bash
  npm install --global expo-cli
  ```

- A working installation of [prayerloop-backend](https://github.com/zdelcoco/prayerloop-backend) for API communication

---

## Setup & Installation

1. **Clone the Repository**

```bash
git clone https://github.com/zdelcoco/prayerloop-mobile.git cd prayerloop-mobile
```

2. **Install Dependencies**  
   Using npm or yarn:

```bash
npm install
```

or

```bash
yarn install
```

3. **Configure Environment Variables**

The mobile app requires the API base URL to communicate with the backend. Create a `.env` file in the root directory (if not provided) and add:

```env
API_BASE_URL=https://your-backend-url.com
```

Adjust the URL to match your development or production backend endpoint.

4. **Run the App**

Start the expo development server

```bash
npm start
```

or

```bash
expo start
```

## Usage

- **Navigation**  
  The app provides tab-based navigation for quick access to prayer cards, user profiles, and groups.
- **Authentication**  
  Users can log in or sign up directly within the app. Authentication tokens (JWT) are managed by the backend.
- **Prayer & Group Management**  
  Create new prayers, view existing ones, join groups, and manage your profile easily through the intuitive UI.

---

## Testing

- To run tests (if available), use the following command:

  ```bash
  npm test
  ```

- Refer to any provided documentation or test scripts for more details on running the test suite.

---

## Other Prayerloop Repositories

- **[prayerloop-psql](https://github.com/zdelcoco/prayerloop-psql)**  
  PostgreSQL database schema scripts and migrations.
- **[prayerloop-backend](https://github.com/zdelcoco/prayerloop-backend)**  
  Go-based backend API that handles authentication, business logic, and database interactions.

---

## Contributing

Contributions to prayerloop-mobile are welcome! Whether you’re fixing bugs, adding new features, or improving documentation, please open an issue or submit a pull request. For major changes, discuss them in an issue first to avoid duplication of effort.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Contact

- **Issues & Support**: [Submit an issue](https://github.com/zdelcoco/prayerloop-mobile/issues) or join our discussions for any questions or feedback.
- For more information on the overall project, see also:
  - [prayerloop-psql issues](https://github.com/zdelcoco/prayerloop-psql/issues)
  - [prayerloop-backend issues](https://github.com/zdelcoco/prayerloop-backend/issues)
