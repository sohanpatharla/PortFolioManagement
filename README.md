# Portfolio Management Web Application

A comprehensive portfolio management web application built with vanilla HTML, CSS, JavaScript, Node.js, Express, and MySQL. Track your investments, analyze performance, and manage your portfolio with an intuitive and responsive interface.

## 🚀 Features

### 📊 Dashboard
- Real-time portfolio overview with key metrics
- Interactive charts showing portfolio performance and allocation
- Recent activity feed and top performers
- Market summary with major indices

### 💼 Holdings Management
- Add, edit, and delete stock holdings
- View detailed information including P&L calculations
- Search and sort functionality
- Export portfolio data to CSV

### 📋 Transaction History
- Complete transaction log with buy/sell records
- Advanced filtering and sorting options
- Transaction summary statistics
- Export transaction history

### 👁️ Watchlist
- Monitor stocks of interest
- Real-time price updates (when connected to API)
- Easy add/remove functionality

### 👤 Profile Management
- User profile information
- Password change functionality
- Account settings

### ⚙️ Settings
- Dark/Light theme toggle
- Notification preferences
- Data export options

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Charts**: Chart.js
- **Authentication**: bcryptjs, express-session
- **Styling**: Custom CSS (no frameworks)

## 📁 Project Structure

```
portfolio-app/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── README.md                 # This file
├── config/
│   └── database.js           # Database connection
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── portfolio.js         # Portfolio management routes
│   └── user.js              # User management routes
├── middleware/
│   └── auth.js              # Authentication middleware
├── public/
│   ├── css/
│   │   ├── style.css        # Main styles
│   │   ├── landing.css      # Landing page styles
│   │   ├── auth.css         # Authentication pages styles
│   │   └── dashboard.css    # Dashboard styles
│   └── js/
│       ├── main.js          # Common utilities
│       ├── auth.js          # Authentication logic
│       ├── dashboard.js     # Dashboard functionality
│       ├── holdings.js      # Holdings management
│       ├── transactions.js  # Transaction history
│       ├── watchlist.js     # Watchlist functionality
│       ├── profile.js       # Profile management
│       └── settings.js      # Settings page
├── views/
│   ├── index.html           # Landing page
│   ├── login.html           # Login page
│   ├── signup.html          # Registration page
│   ├── dashboard.html       # Main dashboard
│   ├── holdings.html        # Holdings management
│   ├── transactions.html    # Transaction history
│   ├── watchlist.html       # Watchlist page
│   ├── profile.html         # User profile
│   └── settings.html        # Settings page
└── sql/
    └── schema.sql           # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a new MySQL database named `portfolio_db`
   - Run the SQL schema file in MySQL Workbench:
     ```sql
     SOURCE ./sql/schema.sql
     ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials and other settings:
     ```env
     DB_HOST=localhost
     DB_USER=your_mysql_username
     DB_PASSWORD=your_mysql_password
     DB_NAME=portfolio_db
     SESSION_SECRET=your_secret_key_here
     PORT=3000
     ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## 📝 Usage

### Getting Started
1. **Sign Up**: Create a new account on the registration page
2. **Login**: Sign in with your credentials
3. **Add Holdings**: Start by adding your current stock holdings
4. **Explore**: Navigate through different sections to manage your portfolio

### Demo Credentials
For testing purposes, you can use these pre-configured accounts:
- **Email**: john.doe@example.com
- **Password**: password123

or

- **Email**: jane.smith@example.com  
- **Password**: password123

### Key Features Usage

#### Adding Holdings
1. Go to Holdings page
2. Click "Add Stock" button
3. Enter stock symbol, quantity, and purchase details
4. Click "Add to Portfolio"

#### Viewing Performance
1. Visit the Dashboard
2. View charts showing portfolio performance over time
3. Check profit/loss calculations
4. Monitor top performing stocks

#### Managing Transactions
1. Navigate to Transactions page
2. View complete transaction history
3. Filter by type (Buy/Sell) or search by symbol
4. Export data for tax purposes

## 🎨 Customization

### Themes
The application supports both light and dark themes. Users can toggle between themes using the theme button in the navigation bar.

### Styling
All styles are written in vanilla CSS using CSS custom properties (variables) for easy customization. Modify the CSS variables in `public/css/style.css` to change colors, fonts, and spacing.

### Adding New Features
The modular structure makes it easy to add new features:
1. Create new routes in the `routes/` directory
2. Add corresponding HTML pages in `views/`
3. Implement frontend logic in `public/js/`
4. Update the database schema if needed

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: Express sessions for user authentication
- **Input Validation**: Server-side validation for all user inputs
- **CORS Protection**: Configured CORS policies
- **SQL Injection Prevention**: Parameterized queries

## 📊 Data Management

### Static Data (Current Implementation)
The application currently uses static dummy data for demonstration purposes. This includes:
- Sample user accounts
- Portfolio holdings
- Transaction history
- Stock prices

### Real-time Data Integration (Future Enhancement)
To connect real stock market data APIs:
1. Choose a stock data provider (Alpha Vantage, IEX Cloud, Finnhub, etc.)
2. Update the portfolio routes to fetch real-time prices
3. Implement periodic price updates
4. Add API rate limiting and error handling

Example API integration structure is ready in the codebase for easy implementation.

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Use a production-grade database
   - Configure proper session secrets

2. **Security Enhancements**
   - Enable HTTPS
   - Set secure cookie options
   - Implement rate limiting
   - Add input sanitization

3. **Performance Optimization**
   - Enable gzip compression
   - Implement caching strategies
   - Optimize database queries
   - Minify static assets

### Hosting Options
- **Traditional Hosting**: VPS, dedicated servers
- **Cloud Platforms**: AWS, Google Cloud, Azure
- **Platform as a Service**: Heroku, DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Chart.js for beautiful charts
- Font Awesome for icons (if used)
- Google Fonts for typography
- MySQL for robust data storage

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Note**: This application uses static dummy data for demonstration purposes. To use with real stock market data, integrate with a financial data API service.
