# CashFlowTodo

## Overview
CashFlowTodo is a web app for managing transfer tasks between accounts, simulating balance changes in real-time. This helps users manage their monthly transfer operations (e.g., salary day tasks) efficiently, preventing omissions and ensuring correct balance calculations.

## Features
- **Virtual Account Simulation**: Create virtual accounts and simulate balance changes without real money transfers.
- **Transfer Todo Management**: Add, edit, delete, and reorder transfer tasks with drag & drop.
- **Real-time Balance Calculation**: Automatically calculate account balances based on completed tasks.
- **Authentication**: Support for Google login and anonymous login.
- **Cross-device Sync**: Data synchronized across devices via Firebase.

## Tech Stack
- **Frontend**: TypeScript, React, Next.js (App Router)
- **Backend**: Firebase (Firestore for database, Authentication for user management)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Other**: @dnd-kit for drag & drop

## Requirements
- Node.js 18+
- npm or yarn

## How to Run Locally
1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd cashflowtodo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create `.env.local` file and add Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}
   NEXT_PUBLIC_APP_ID=cashflow-todo-app
   NEXT_PUBLIC_INITIAL_AUTH_TOKEN=  # Optional for custom auth
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
This app is deployed on Vercel. To deploy your own instance:
1. Connect your GitHub repository to Vercel.
2. Set environment variables in Vercel dashboard.
3. Deploy automatically on push.

## Usage
1. **Login**: Choose Google login or guest login.
2. **Add Accounts**: Create virtual accounts with initial balances.
3. **Add Transfer Tasks**: Specify from/to accounts, amount, and optional notes.
4. **Complete Tasks**: Check off tasks as you complete them in real banking apps.
5. **Monitor Balances**: See updated balances in real-time.
6. **Reset for Next Month**: Use the completion modal to reset all tasks for the next cycle.

## Contributing
1. Fork the repository.
2. Create a feature branch.
3. Make changes and test.
4. Submit a pull request.

## License
ISC

## Contact
For questions or feedback, please open an issue on GitHub.