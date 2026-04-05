# HealthSight - Health Tracking & Disease Outbreak Platform

## 🎯 Project Overview

HealthSight is a comprehensive health tracking and disease outbreak monitoring platform built with Next.js 14, React 19, and Supabase. It features:

- 🏥 **Health Dashboard**: Track personal health metrics with questionnaires and progress charts
- 📊 **Admin Analytics**: Monitor outbreaks with interactive maps and statistical analysis
- 🤖 **AI Assistant**: Get health advice from multiple AI personas
- 👥 **User Management**: Complete authentication with profile management
- 📚 **Articles Management**: CRUD operations for health-related articles

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication System

### Features
- ✅ User Registration with Governorate Selection (18 Iraqi Governorates)
- ✅ Smart Login with Role-based Redirection
- ✅ User Profiles with Avatar Support
- ✅ Session Management with AuthContext
- ✅ Secure Password Handling

### Database Setup

Run in Supabase SQL Editor:
```sql
ALTER TABLE public.profiles ADD COLUMN governorate text;
```

### Schema
```sql
profiles table:
- id (UUID, primary key)
- full_name (text)
- avatar_url (text)
- role (text: admin | user)
- governorate (text) ✨ New!
- created_at (timestamp)
```

## 📁 Project Structure

```
healthsight/
├── app/
│   ├── layout.tsx (with AuthProvider)
│   ├── page.tsx (Landing page)
│   ├── admin/ (Admin dashboard)
│   ├── articles/ (Articles listing)
│   ├── user/ (User dashboard)
│   └── assistant/ (AI chatbot)
├── components/
│   ├── Auth/ (Login & Register forms)
│   ├── Admin/ (Dashboard panels)
│   ├── Header.jsx (Dynamic header)
│   ├── UserProfile.jsx (Profile dropdown)
│   └── Layout/
├── context/
│   └── AuthContext.jsx (Session management)
├── lib/
│   ├── supabaseClient.js
│   ├── api.js
│   └── utils.js
└── public/
```

## 🎨 Key Components

### **AuthContext** (`context/AuthContext.jsx`)
- Manages user session globally
- Fetches profile data from database
- Provides `useAuth()` hook

### **UserProfile** (`components/UserProfile.jsx`)
- Displays user avatar + name
- Shows role with color coding
- Dropdown menu with profile options
- Governorate display

### **Header** (`components/Header.jsx`)
- Conditional rendering (buttons vs profile)
- Responsive design
- Scroll-based active section indicator

### **Forms** (`components/Auth/`)
- RegisterForm: with governorate selection
- LoginForm: with smart redirect

## 📱 Features by Page

| Page | Features |
|------|----------|
| `/` | Landing page, hero section, auth modals |
| `/articles` | Article carousel, search & filter |
| `/user` | Health dashboard, questionnaire, charts |
| `/assistant` | AI chatbot with multiple personas |
| `/admin` | Maps, analytics, user management, article CRUD |

## 🛠️ Technologies

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Charts**: Recharts (Area, Bar, Pie, Radar)
- **Maps**: Mapbox GL JS
- **Icons**: Lucide React
- **Auth**: Supabase Authentication
- **Database**: Supabase PostgreSQL

## 📊 Admin Features

- **MapPanel**: Interactive outbreak map with heatmap & time-series
- **AnalysisPanel**: Multi-chart analytics dashboard
- **UsersPanel**: User table with search & health scores
- **ArticlesPanel**: CRUD for health articles

## 🔐 Authentication Flow

```
Sign Up → Verify Email → Login → Dashboard
         ↓
       Profile Created in Database
       └─ full_name, governorate, role
```

## 📚 Documentation

- `AUTHENTICATION_SETUP.md` - Auth system details
- `SUPABASE_SETUP.md` - Database setup
- `SYSTEM_EXPLANATION.md` - Technical deep dive
- `PROTECTED_ROUTES.md` - Route protection guide
- `FINAL_SUMMARY.md` - Quick reference

## 🚀 Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## 🎯 Iraqi Governorates (18)

Baghdad, Al-Anbar, Al-Basra, Al-Muthanna, Al-Qadisiyyah, An-Najaf, Arbil, As-Sulaymaniyah, Dhi-Qar, Diyala, Halabjah, Karbala, Kirkuk, Maysan, Nineveh, Salah ad-Din, Wasit, Babil

## 🔄 User Profile Display

When logged in, users see their profile in the Header:

```
[Avatar/Initials]  Name
     [Admin/User]

↓ Click for dropdown menu with:
- Profile info
- Dashboard/Admin link
- Settings
- Logout
```

## 🛡️ Security

- ✅ Encrypted passwords (Supabase)
- ✅ Session management (JWT tokens)
- ✅ Role-based access
- ✅ Environment variable protection
- ✅ HTTPS ready

## 💡 Next Steps

- [ ] Avatar upload functionality
- [ ] Password reset flow
- [ ] Profile edit page
- [ ] Email verification UI
- [ ] Protected routes middleware
- [ ] Real-time notifications

## 📞 Support

For detailed information, check the documentation files in the project root.

---

**Built with ❤️ for Health Tracking**
