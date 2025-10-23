# Mathify - Math Learning Platform

A web-based mathematical learning platform with calculator, graph visualization, and problem-solving features.

## 📁 Project Structure

```
Mathify/
├── src/                    # Backend source code
│   ├── models/            # Mongoose data models
│   │   └── user.js
│   ├── routes/            # API route handlers
│   │   └── users.js
│   ├── middleware/        # Custom middleware
│   │   └── cleanUrl.js
│   └── config/            # Configuration files
│       └── database.js
├── public/                # Frontend static files
│   ├── pages/             # HTML pages
│   │   ├── calculator.html
│   │   ├── graph.html
│   │   ├── login.html
│   │   └── soal.html
│   ├── js/                # JavaScript files
│   │   ├── calculator.js
│   │   ├── graph.js
│   │   ├── sidebar.js
│   │   └── soal.js
│   ├── css/               # Stylesheets
│   │   ├── login.css
│   │   ├── soal.css
│   │   └── styles.css
│   └── img/               # Images
│       └── logo.png
├── server.js              # Application entry point
├── package.json           # Dependencies
├── .env                   # Environment variables (not committed)
├── .env.example           # Example environment variables
└── .gitignore             # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DerickAmadeus/Mathify2.git
cd Mathify2
```

2. Install dependencies:
```bash
npm install
```

### Running the Server

**Development mode:**
```bash
npm start
```

**With nodemon (auto-restart on changes):**
```bash
npm run dev
```

Server will start at: `http://localhost:3000`

## 🌐 Available Routes

### Frontend Pages
- `/` - Redirects to calculator
- `/calculator` - Calculator tool
- `/graph` - Graph visualization
- `/soal` - Problem solving
- `/login` - Login page

### API Endpoints

## 📝 Development

### Folder Structure Explanation

- **`src/`** - All backend code
  - `models/` - Database schemas (Mongoose)
  - `routes/` - API endpoint handlers
  - `middleware/` - Express middleware functions
  - `config/` - Configuration (database, etc)

- **`public/`** - All frontend code (served statically)
  - `pages/` - HTML templates
  - `js/` - Client-side JavaScript
  - `css/` - Stylesheets
  - `img/` - Static images

### Adding New Features

**Add a new API endpoint:**
1. Create route file in `src/routes/`
2. Import in `server.js`
3. Mount with `app.use('/api/endpoint', router)`

**Add a new page:**
1. Create HTML in `public/pages/`
2. Access via `/pagename` (without `.html`)

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Environment:** dotenv

## 📦 Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## 🔧 Configuration

### MongoDB Connection

**Local MongoDB:**
```
MONGO_URI=mongodb://127.0.0.1:27017/mydatabase
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**DerickAmadeus**
- GitHub: [@DerickAmadeus](https://github.com/DerickAmadeus)

---

Made with ❤️ for math learners
