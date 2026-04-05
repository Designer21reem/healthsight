# 🎓 شرح شامل - نظام الاستيقن والملف الشخصي

## 📖 كيفية عمل النظام

### 1️⃣ **عندما يفتح المستخدم التطبيق**

```
1. يتم تحميل App Layout
   ↓
2. App Layout يلف كل شيء بـ <AuthProvider>
   ↓
3. AuthProvider يتحقق من الجلسة:
   - هل هناك جلسة نشطة؟
   - إذا نعم: جلب بيانات الملف الشخصي
   ↓
4. Header يعرض:
   - إذا مسجل دخول: صورة الملف الشخصي
   - إذا لا: أزرار Login و Sign Up
```

---

### 2️⃣ **عندما يضغط Sign Up**

```
المستخدم يملأ النموذج:
┌─────────────────────┐
│ Full Name           │
│ Governorate (18)    │
│ Email               │
│ Password            │
│ Confirm Password    │
└─────────────────────┘
        ↓
  يضغط "Sign Up"
        ↓
  النظام يتحقق من البيانات:
  - هل كل الحقول مملوءة؟
  - هل كلمات المرور متطابقة؟
  - هل كلمة المرور 6+ أحرف؟
        ↓
  في Supabase:
  - إنشاء user في auth.users
  - إنشاء profile في جدول profiles مع:
    * full_name
    * governorate
    * role = "user"
        ↓
  رسالة نجاح:
  "تحقق من بريدك الإلكتروني"
```

---

### 3️⃣ **عندما يضغط Login**

```
يدخل:
┌──────────────────┐
│ Email            │
│ Password         │
└──────────────────┘
        ↓
  يضغط "Login"
        ↓
  supabase.auth.signInWithPassword()
        ↓
  النظام يجلب role من profiles
        ↓
  إعادة توجيه ذكية:
  - إذا role = "admin" → /admin
  - إذا role = "user" → /user
```

---

### 4️⃣ **بعد التسجيل الناجح**

```
في Header:
┌─────────────────────────┐
│ [صورة/حروف] الاسم      │
│ [Admin] أو [User]      │
└─────────────────────────┘
        ↓
  اضغط عليها
        ↓
┌─────────────────────────┐
│ الاسم الكامل            │
│ البريد الإلكتروني        │
│ 📍 المحافظة            │
├─────────────────────────┤
│ 👤 لوحة التحكم/لوحة البيانات  │
│ ⚙️  الإعدادات            │
├─────────────────────────┤
│ 🚪 Logout              │
└─────────────────────────┘
```

---

## 🏗️ البنية الفنية

### **AuthProvider** (`context/AuthContext.jsx`)

```javascript
// يوفر:
const { user, profile, loading, logout } = useAuth();

// user = بيانات المستخدم من Supabase Auth
// profile = بيانات الملف الشخصي من جدول profiles
// loading = هل جاري التحميل؟
// logout = دالة تسجيل الخروج
```

**ماذا يفعل:**
1. عند التحميل الأول: يجلب الجلسة من Supabase
2. يجلب بيانات الملف الشخصي من جدول profiles
3. يستمع لتغييرات الجلسة (onAuthStateChange)
4. يوفر دالة logout آمنة

---

### **RegisterForm** (`components/Auth/RegisterForm.jsx`)

```javascript
// الحقول:
- fullName: string
- email: string (format email)
- password: string (min 6)
- confirm: string (يجب تطابق password)
- governorate: string (من 18 خيار)

// في handleSubmit:
1. supabase.auth.signUp(email, password)
2. supabase.from("profiles").upsert({...})
```

**البيانات المحفوظة:**
```javascript
{
  id: authData.user.id,          // من Supabase Auth
  full_name: fullName,
  governorate: governorate,
  role: "user",                  // افتراضي
  avatar_url: ""                 // فارغ في البداية
}
```

---

### **LoginForm** (`components/Auth/LoginForm.jsx`)

```javascript
// الحقول:
- email: string
- password: string

// في handleSubmit:
1. supabase.auth.signInWithPassword(email, password)
2. جلب role من profiles
3. إعادة توجيه حسب role
```

---

### **UserProfile** (`components/UserProfile.jsx`)

```javascript
// يعرض:
- صورة Avatar (أو حروف الاسم)
- الاسم الكامل
- الدور مع لون مميز
  * Admin: بنفسجي
  * User: أزرق

// عند الضغط:
- قائمة منسدلة تعرض:
  * البريد الإلكتروني
  * المحافظة
  * زر الذهاب للوحة التحكم
  * زر Logout
```

---

### **Header** (`components/Header.jsx`)

```javascript
// يعرض:
إذا loading:
  ↓ عنصر تحميل (skeleton)

إذا user موجود:
  ↓ <UserProfile />

إذا user غير موجود:
  ↓ أزرار "Login" و "Sign Up"
```

---

## 📊 تدفق البيانات

```
┌─────────────────────────────────────────────────────┐
│           Supabase Auth & Database                  │
├─────────────────────────────────────────────────────┤
│  auth.users          │  profiles Table              │
│  - id                │  - id (FK)                   │
│  - email             │  - full_name                 │
│  - password (hash)   │  - governorate ✨ جديد       │
│                      │  - avatar_url                │
│                      │  - role                      │
│                      │  - created_at                │
└─────────────────────────────────────────────────────┘
         ↑                           ↑
         └───────────────────────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │   AuthContext.jsx    │
         │  (إدارة الجلسة)      │
         │  - user             │
         │  - profile ✨        │
         │  - loading          │
         │  - logout()         │
         └──────────────────────┘
                    │
                    ↓
    ┌───────────────────────────────────┐
    │     Components that use useAuth()  │
    ├───────────────────────────────────┤
    │ - Header                          │
    │ - UserProfile                     │
    │ - LoginForm                       │
    │ - RegisterForm                    │
    │ - أي صفحة أخرى تحتاج البيانات    │
    └───────────────────────────────────┘
```

---

## 🔄 دورة حياة المستخدم

### **التسجيل الجديد:**
```
1. Sign Up Modal → يملأ البيانات → اضغط "Sign Up"
2. handleSubmit يتحقق من البيانات
3. supabase.auth.signUp() ينشئ حساب
4. supabase.profiles.upsert() ينشئ ملف شخصي
5. رسالة نجاح: "تحقق من بريدك"
6. Modal يغلق
7. Header يبقى يعرض الأزرار (حتى التحقق)
```

### **تسجيل الدخول:**
```
1. Login Modal → يدخل البيانات → اضغط "Login"
2. handleSubmit يتحقق من البيانات
3. supabase.auth.signInWithPassword() يتحقق
4. جلب profile.role
5. إعادة توجيه ذكية
6. AuthProvider يحدّث user و profile
7. Header يعرض UserProfile بدلاً من الأزرار
```

### **تسجيل الخروج:**
```
1. اضغط على صورة الملف الشخصي
2. قائمة منسدلة → "Logout"
3. supabase.auth.signOut()
4. AuthProvider يمسح user و profile
5. Header يعرض الأزرار مجدداً
```

---

## 🎯 الحالات الخاصة

### **عند إعادة تحميل الصفحة:**
```
1. App يتحمل
2. AuthProvider يتحقق من الجلسة المحفوظة
3. إذا كانت موجودة:
   - جلب بيانات المستخدم
   - جلب بيانات الملف الشخصي
   - عرض UserProfile
4. إذا لم تكن موجودة:
   - عرض الأزرار
```

### **عند الانتقال من صفحة إلى أخرى:**
```
1. الجلسة محفوظة في browser
2. useAuth() يعيد نفس البيانات
3. بدون الحاجة لإعادة تحميل الصفحة
```

---

## 🛡️ نقاط الأمان

| النقطة | الحماية |
|--------|---------|
| كلمات المرور | مشفرة في Supabase, أطول 6+ حرف |
| الجلسة | مُدارة بواسطة Supabase |
| البيانات | محفوظة في قاعدة بيانات آمنة |
| الـ API Keys | في ملف .env.local (لا تُرفع) |
| إعادة التوجيه | تفحص role من قاعدة البيانات |

---

## ✅ الخلاصة

النظام يوفر:
- ✅ تسجيل آمن
- ✅ تسجيل دخول ذكي
- ✅ ملف شخصي جميل
- ✅ حفظ الجلسة
- ✅ دعم الأدوار (Admin/User)
- ✅ اختيار المحافظة
- ✅ تسجيل خروج سهل

كل شيء جاهز للاستخدام! 🎉
