# حماية المسارات (Protected Routes) - دليل اختياري

إذا كنت تريد منع الوصول إلى صفحات معينة بدون تسجيل دخول، تابع هذه الخطوات:

## مثال: حماية صفحة `/admin`

### الخطوة 1: أنشئ Middleware (اختياري)

```typescript
// middleware.ts في مجلد الجذر

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { session } } = await supabase.auth.getSession()

  // إذا حاول الوصول إلى /admin بدون تسجيل دخول
  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*']
}
```

### الخطوة 2: أضف فحص في صفحة `/admin` نفسها

```typescript
// app/admin/page.jsx

"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!user || profile?.role !== "admin") {
    return null;
  }

  return (
    <div>
      <h1>لوحة تحكم الإدارة</h1>
      {/* محتوى الصفحة */}
    </div>
  );
}
```

## نفس الشيء لصفحة `/user`

```typescript
// app/user/page.jsx

"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>لوحة بيانات المستخدم</h1>
      {/* محتوى الصفحة */}
    </div>
  );
}
```

---

## ملاحظات مهمة:

1. **لا يزال الفحص الحالي كافياً:**
   - في Header نعرض الأزرار فقط للمستخدمين المسجلين
   - في LoginForm نعيد التوجيه الذكي

2. **الفحص الإضافي يضيف أماناً إضافياً:**
   - يمنع الوصول المباشر عبر الـ URL
   - يتحقق من الدور (Admin vs User)

3. **الخيار الأفضل:**
   - استخدم الفحص في الصفحة نفسها (أسهل)
   - أو استخدم Middleware (أكثر أماناً)

---

## هل تحتاج إلى هذا الآن؟

- ✅ **نعم** إذا كان التطبيق سيستخدم على الإنترنت
- ✅ **نعم** إذا كانت البيانات حساسة
- ❌ **لا** إذا كان التطبيق للتطوير فقط

الآن يمكنك الاستمتاع بـ نظام استيقن آمن! 🎉
