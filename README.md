# Airbnb Clone - Full Stack MERN Application

A full-featured vacation rental platform built with **MongoDB**, **Express**, **React**, and **Node.js**.

## 🌟 Features

### For Guests
- 🔍 **Search & Filter** - Find properties by location, type, price, and capacity
- 📅 **Book Properties** - Select dates and reserve accommodations
- ⭐ **Reviews** - Read and write reviews for properties
- 📊 **Dashboard** - Manage your bookings

### For Hosts
- 🏠 **List Properties** - Add properties with images and details
- 💰 **Manage Listings** - Edit and delete your properties
- 📈 **Track Bookings** - View and manage guest reservations
- 📸 **Image Uploads** - Upload multiple property photos

### General
- 🔐 **Authentication** - Secure JWT-based login/signup
- 👤 **User Roles** - Separate guest and host experiences
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Beautiful, premium design with smooth animations

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB + Mongoose** - Document database and ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Vite** - Build tool
- **CSS3** - Styling with custom design system

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone or Navigate to Project
```bash
cd airbnb-clone
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

Edit the `.env` file with your MongoDB connection string:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=bookmystay01
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Database Setup

Start MongoDB locally or configure an Atlas URI in `.env`.  
The database (`bookmystay01` by default) will be created automatically when the API runs.

### 4. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install
```

## 🎯 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
Server will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Application will run on `http://localhost:3000`

## 📁 Project Structure

```
airbnb-clone/
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication
│   ├── routes/
│   │   ├── authRoutes.js      # Login/signup
│   │   ├── propertyRoutes.js  # Property CRUD
│   │   ├── bookingRoutes.js   # Booking management
│   │   └── reviewRoutes.js    # Review system
│   ├── database/
│   │   (empty)                # MongoDB used; no SQL schema
│   ├── uploads/               # Property images
│   ├── server.js              # Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PropertyCard.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── HostDashboard.jsx
│   │   │   └── AddProperty.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (host only)
- `PUT /api/properties/:id` - Update property (host only)
- `DELETE /api/properties/:id` - Delete property (host only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user` - Get user's bookings
- `GET /api/bookings/host` - Get host's bookings
- `PUT /api/bookings/:id` - Update booking status
- `GET /api/bookings/check-availability` - Check availability

### Reviews
- `POST /api/reviews` - Add review
- `GET /api/reviews/property/:propertyId` - Get property reviews
- `DELETE /api/reviews/:id` - Delete review

## 👥 User Roles

### Guest
- Browse and search properties
- Book accommodations
- Manage bookings
- Write reviews

### Host
- List properties
- Upload property images
- Manage listings
- View booking requests

## 🎨 Design Features

- **Modern Color Palette** - Airbnb-inspired pink/red theme
- **Smooth Animations** - Hover effects and transitions
- **Responsive Grid** - Adapts to all screen sizes
- **Card-based UI** - Clean, organized layouts
- **Custom Forms** - Beautiful input styling
- **Status Badges** - Visual booking status indicators

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation

## 📝 Usage Guide

### For Guests
1. Sign up as a guest
2. Browse properties on home page
3. Use search filters to find properties
4. Click on a property to view details
5. Select dates and book
6. View bookings in dashboard

### For Hosts
1. Sign up as a host
2. Add a new property from host dashboard
3. Upload images and set details
4. Manage your properties
5. View booking requests
6. Track earnings

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MongoDB is running (or Atlas URI is correct)
- Check `.env` credentials
- Ensure database exists or will be auto-created

### Port Already in Use
- Change PORT in backend `.env`
- Update Vite proxy in `frontend/vite.config.js`

### Image Upload Issues
- Ensure `backend/uploads` folder exists
- Check file permissions
- Verify file size limits

## 🚀 Future Enhancements

- Payment integration (Stripe)
- Real-time messaging between guests and hosts
- Map integration for property locations
- Advanced search with map view
- Email notifications
- Property availability calendar
- Multi-language support
- Social media login

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ as a full-stack MERN application demo

---

**Happy Hosting! 🏠**
