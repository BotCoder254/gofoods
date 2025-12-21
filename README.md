# GoFoods - Local Food Sharing Marketplace

A modern React-based food delivery and restaurant discovery application where users can share, sell, or donate homemade and local food in their area.

## Features

- 🔐 **Authentication**: Email/password authentication with email verification
- 👤 **User Profiles**: Customizable profiles with avatar upload and location
- 📍 **Location Services**: Integrated Mapbox for location-based features
- 🍽️ **Food Feed**: Browse and discover local food offerings
- 💬 **Real-time Messaging**: Connect with other users
- 🔖 **Bookmarks**: Save your favorite posts
- 📱 **Responsive Design**: Fully mobile-responsive interface
- 🎨 **Modern UI**: Built with Tailwind CSS and Framer Motion

## Tech Stack

- **Frontend**: React 19.2.3
- **Routing**: React Router DOM 7.11.0
- **State Management**: TanStack React Query 5.90.12
- **Backend**: Appwrite 21.5.0 (Auth, Database, Storage)
- **Maps**: Mapbox GL 3.17.0 + React Map GL 8.1.0
- **Styling**: Tailwind CSS 3.4.19
- **Animations**: Framer Motion 12.23.26
- **Icons**: Lucide React 0.562.0
- **Forms**: React Hook Form 7.69.0 + Zod 4.2.1
- **Notifications**: React Toastify 11.0.5

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account and project
- Mapbox account and access token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gofoods
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your credentials:
   ```env
   REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   REACT_APP_APPWRITE_PROJECT_ID=your_project_id
   REACT_APP_APPWRITE_DATABASE_ID=your_database_id
   REACT_APP_APPWRITE_USERS_COLLECTION_ID=users
   REACT_APP_APPWRITE_POSTS_COLLECTION_ID=posts
   REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID=requests
   REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID=messages
   REACT_APP_APPWRITE_BOOKMARKS_COLLECTION_ID=bookmarks
   REACT_APP_APPWRITE_STORAGE_BUCKET_ID=avatars
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   ```

### Appwrite Setup

1. **Create a new Appwrite project**

2. **Create a Database** with the following collections:

   **Users Collection**:
   - `email` (string, required)
   - `displayName` (string, required)
   - `avatarFileId` (string, optional)
   - `bio` (string, optional)
   - `phone` (string, optional)
   - `location` (object: {lat, lng, placeName}, optional)
   - `role` (enum: user/admin/moderator, required, default: user)
   - `isVerified` (boolean, default: false)
   - `createdAt` (datetime, required)

   **Posts Collection** (for future implementation):
   - `userId` (string, required)
   - `title` (string, required)
   - `description` (string, required)
   - `images` (array of file IDs)
   - `category` (enum)
   - `price` (number)
   - `location` (object)
   - `status` (enum: available/sold/donated)
   - `createdAt` (datetime)

   **Messages Collection** (for future implementation):
   - `senderId` (string, required)
   - `receiverId` (string, required)
   - `content` (string, required)
   - `read` (boolean, default: false)
   - `createdAt` (datetime)

   **Bookmarks Collection** (for future implementation):
   - `userId` (string, required)
   - `postId` (string, required)
   - `createdAt` (datetime)

3. **Create a Storage Bucket** for avatars and food images

4. **Enable Email/Password Authentication** in Appwrite Console

5. **Set up permissions** for each collection (read/write access)

### Mapbox Setup

1. Create a Mapbox account at https://www.mapbox.com/
2. Get your access token from the dashboard
3. Add it to your `.env` file

### Running the Application

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (one-way operation)

## Project Structure

```
gofoods/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── common/      # Common UI components
│   │   ├── layout/      # Layout components (Sidebar, Topbar)
│   │   ├── auth/        # Auth-related components
│   │   └── profile/     # Profile components
│   ├── config/          # Configuration files
│   ├── context/         # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API functions
│   ├── pages/           # Page components
│   │   ├── auth/        # Login, Register
│   │   ├── feed/        # Feed page
│   │   ├── profile/     # Profile pages
│   │   └── ...
│   ├── utils/           # Utility functions
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── .env.example         # Environment variables template
└── package.json         # Dependencies
```

## Features Implementation Status

- ✅ Authentication (Login/Register)
- ✅ Email Verification
- ✅ User Profile Management
- ✅ Avatar Upload
- ✅ Location Picker with Mapbox
- ✅ Responsive Sidebar Navigation
- ✅ Protected Routes
- ⏳ Food Posts (Coming Soon)
- ⏳ Map View (Coming Soon)
- ⏳ Messaging (Coming Soon)
- ⏳ Bookmarks (Coming Soon)
- ⏳ Admin Panel (Coming Soon)

## Design System

### Colors
- **Primary**: #FF5136 (Appwrite Red)
- **Secondary**: #3B82F6 (Blue)
- **Accent**: #10B981 (Green)
- **Neutral**: 50-900 scale
- **Error**: #EF4444
- **Warning**: #F59E0B
- **Success**: #10B981

### Fonts
- **Headings**: Poppins
- **Body**: Inter
- **Additional**: Montserrat, Roboto, Open Sans

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@gofoods.com or open an issue in the repository.
