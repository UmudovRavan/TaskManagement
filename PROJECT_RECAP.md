# 🎯 Task Management System — Tam Layihə Recap

**Layihə Müəllifi:** Ravan Umudov  
**Tarix:** 15 Fevral 2026  
**Texnologiyalar:** ASP.NET Core (Backend) + React/TypeScript/Vite (Frontend)

---

## 📋 Ümumi Baxış

**Task Management System (TMS)** — korporativ mühitdə tapşırıqların idarə olunması, komanda performansının izlənilməsi və iş qrupları arasında əməkdaşlığın təmin edilməsi üçün hazırlanmış tam funksional web tətbiqidir.

Layihə **Clean Architecture** prinsipləri əsasında qurulub, **role-based access control (RBAC)** sistemi, **real-time bildirişlər (SignalR)**, **performans xal sistemi**, **iş qrupları idarəetməsi** və **müasir dashboard** kimi xüsusiyyətləri əhatə edir.

---

## 🏗️ Arxitektura

### Backend (ASP.NET Core — Clean Architecture)

```
Task-Management-System/
├── Domain/              → Domain Layer (Entity, Enum, Repository interfeyslər)
│   ├── Entities/        → ApplicationUser, TaskItem, WorkGroup, Notification, PerformancePoint, ...
│   ├── Enums/           → CurrentSituation (Pending/Assigned/InProgress/UnderReview/Completed/Expired)
│   │                      DifficultyLevel (Easy/Medium/Hard)
│   └── Repositories/    → IGenericRepository, INotificationRepository, ...
│
├── Contract/            → Abstraction Layer (DTO-lar, Service interfeyslər)
│   ├── DTOs/            → TaskDTO, WorkGroupDTO, LoginDTO, RegisterDTO, PerformancePointDTO, ...
│   ├── Services/        → IAuthorizeService, ITaksService, IWorkGroupService, IPerformanceService, ...
│   └── Options/         → Konfiqurasiya
│
├── ApplicationLayer/    → Business Logic Layer
│   ├── Services/        → AuthorizeService, TaskService, WorkGroupService, NotificationService,
│   │                      PerformanceService, GenericService, TokenHandler, EmailSender, ...
│   ├── Hubs/            → NotificationHub (SignalR), UserIdProvider
│   ├── Profiles/        → AutoMapper profilləri
│   └── Exceptions/      → Custom exception-lar
│
├── Persistence/         → Data Access Layer
│   └── Repositories/    → GenericRepository, NotificationRepository, ...
│
├── Presentation/        → API Layer (Controllers)
│   └── Controllers/     → AuthorizeController, TaskController, WorkGroupController,
│                          PerformanceController, NotificationController, TaskAttachmentController
│
└── Application/         → Startup/Confiq (Program.cs, DI Registration)
```

### Frontend (React + TypeScript + Vite + TailwindCSS)

```
Task-Management-Frontend/
├── src/
│   ├── api/             → HTTP servisləri
│   │   ├── httpClient.ts         → Axios HTTP client (JWT auth, interceptor, timeout)
│   │   ├── authService.ts        → Login, Register, Token idarəetməsi
│   │   ├── taskService.ts        → CRUD, Assign, Accept, Reject, Finish, Comment
│   │   ├── workGroupService.ts   → İş qrupları CRUD
│   │   ├── performanceService.ts → Performans xalları
│   │   ├── notificationService.ts → Bildirişlər
│   │   ├── dashboardService.ts   → Dashboard data
│   │   ├── attachmentService.ts  → Fayl yükləmə (MinIO)
│   │   └── userService.ts        → İstifadəçi məlumatları
│   │
│   ├── pages/           → Əsas səhifələr (18 ədəd)
│   │   ├── Login.tsx              → Giriş səhifəsi
│   │   ├── Register.tsx           → Qeydiyyat
│   │   ├── ForgotPassword.tsx     → Şifrə unutma
│   │   ├── OtpVerification.tsx    → OTP doğrulama
│   │   ├── ResetPassword.tsx      → Şifrə sıfırlama
│   │   ├── ResetSuccess.tsx       → Uğurlu sıfırlama
│   │   ├── DashboardOverview.tsx  → 📊 ANA DASHBOARD
│   │   ├── MyTasks.tsx            → Tapşırıq siyahısı
│   │   ├── TaskDetail.tsx         → Tapşırıq detalları (68KB!)
│   │   ├── TaskEdit.tsx           → Tapşırıq redaktəsi
│   │   ├── TaskAssignmentDetail.tsx → Tapşırıq təyinatı detalları
│   │   ├── Performance.tsx        → Fərdi performans analitikası
│   │   ├── Leaderboard.tsx        → Liderlər lövhəsi (ən yaxşı işçilər)
│   │   ├── WorkGroups.tsx         → İş qrupları idarəetməsi
│   │   ├── WorkGroupRanking.tsx   → Qrup daxili reytinq
│   │   ├── EmployeePerformance.tsx → İşçi performansı (başqalarının)
│   │   └── Notifications.tsx      → Bildirişlər səhifəsi
│   │
│   ├── components/      → Yenidən istifadə olunan komponentlər
│   │   ├── KpiCard.tsx            → Dashboard KPI kartları
│   │   ├── WorkloadChart.tsx      → İş yükü diaqramı
│   │   ├── ActivityFeed.tsx       → Son fəaliyyətlər axını
│   │   ├── TaskRow.tsx            → Tapşırıq sətri (cədvəl)
│   │   ├── TaskStatusBadge.tsx    → Status badge-ləri
│   │   ├── CreateTaskModal.tsx    → Yeni tapşırıq modal pəncərəsi
│   │   ├── DifficultyDots.tsx     → Çətinlik səviyyəsi göstəricisi
│   │   ├── NotificationToast.tsx  → Toast bildirişləri
│   │   ├── CustomSelect.tsx       → Tənzimləşdirilmiş select
│   │   ├── UserSuggestionList.tsx → İstifadəçi axtarış təklifləri
│   │   ├── AuthButton.tsx         → Auth düymələri
│   │   ├── AuthInput.tsx          → Auth input-ları
│   │   └── OtpInput.tsx           → OTP input
│   │
│   ├── layout/          → Layout komponentləri
│   │   ├── Sidebar.tsx            → Sol panel navigasiya
│   │   └── Header.tsx             → Üst başlıq
│   │
│   ├── context/         → React Context
│   │   └── NotificationContext.tsx → SignalR real-time bildirişlər
│   │
│   ├── services/        → Xarici xidmətlər
│   │   └── signalRService.ts     → WebSocket bağlantısı (Singleton, Exponential Backoff)
│   │
│   ├── dto/             → TypeScript tip tərifləri
│   │   ├── TaskResponse.ts, WorkGroupResponse.ts, NotificationResponse.ts, ...
│   │   └── PerformanceResponse.ts, LoginRequest.ts, RegisterRequest.ts, ...
│   │
│   ├── utils/           → Yardımçı funksiyalar (JWT parse, token expiry)
│   └── routes/
│       └── AppRouter.tsx → React Router marşrutları
```

---

## 👥 Rol Sistemi (RBAC)

| Rol | İmkanlar |
|-----|----------|
| **Admin** | Tam nəzarət — bütün iş qruplarını görür, istifadəçi rollarını dəyişir, tapşırıq yaradır/silir |
| **Manager** | İş qrupu lideri — qrupuna tapşırıq təyin edir, qruplar arası tapşırıq ötürür, performans xalı verir, iş qrupuna işçi əlavə/çıxarır |
| **Employee** | Tapşırıqları qəbul edir, tamamlayır, şərh yazır, öz performansını izləyir |

### Rol əsaslı frontend məntiq:
- **Manager/Admin** → Sidebar-da "İş Qrupları" menyu görünür
- **Manager** → `/work-groups` siyahı səhifəsinə daxil ola bilmir, avtomatik öz iş qrupuna (`/work-groups/:id`) yönləndirilir
- **Employee** → İş Qrupları menyusu gizlənir
- **Tapşırıq sahibliyi** → Yalnız tapşırığı yaradan şəxs onu redaktə/silə bilər

---

## 📊 Dashboard Səhifəsi — Ətraflı İzah

### Fayl: `src/pages/DashboardOverview.tsx`

Dashboard, istifadəçi daxil olduqdan sonra ilk gördüyü əsas səhifədir. Burası layihənin "ürəyidir" — bütün vacib məlumatlar bir baxışda görünür.

### Dashboard-un Strukturu:

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (Sol Panel)          │   HEADER (Üst Başlıq)    │
│  ──────────────────           │   ─────────────────────   │
│  👤 İstifadəçi adı           │   🔔 Bildiriş sayı       │
│     Rol                      │                           │
│                               │                           │
│  📊 İdarə Paneli ◄── aktiv   │   ┌─────────────────────┐ │
│  ☑️  Tapşırıqlarım           │   │ Sabahınız xeyir,    │ │
│  👥 İş Qrupları (Manager)    │   │ Ravan               │ │
│  📈 Performans               │   │ Bu gün baş verənlər │ │
│  🏆 Liderlər Lövhəsi         │   └─────────────────────┘ │
│  🔔 Bildirişlər              │                           │
│  ⚙️  Tənzimləmələr           │   ┌──────┬──────┬──────┬──────┐  │
│                               │   │Aktiv │Gecik │İş    │Tamam │  │
│  ┌──────────┐                │   │Tapşı │miş   │Yükü  │landı │  │
│  │ 🚪 Çıxış │                │   │rıqlar│      │      │      │  │
│  └──────────┘                │   │  12  │  3   │ 75%  │  28  │  │
│                               │   └──────┴──────┴──────┴──────┘  │
│                               │                           │
│                               │   ┌─────────────┬────────┐│
│                               │   │ İş Yükü     │Fəaliy- ││
│                               │   │ Diaqramı    │yət     ││
│                               │   │ (Workload   │Axını   ││
│                               │   │  Chart)     │(Activ- ││
│                               │   │             │ity     ││
│                               │   │             │Feed)   ││
│                               │   └─────────────┴────────┘│
└──────────────────────────────────────────────────────────┘
```

### Dashboard-un Komponentləri:

#### 1. **Salamlama Bölməsi**
```typescript
getGreeting():
  - Saat 00:00 – 11:59 → "Sabahınız xeyir"
  - Saat 12:00 – 17:59 → "Hər vaxtınız xeyir"
  - Saat 18:00 – 23:59 → "Axşamınız xeyir"
```
İstifadəçinin adı JWT token-dən parse olunur və baş hərflə göstərilir.

#### 2. **KPI Kartları (4 ədəd)**

| # | Kart | Hesablama | İkon | Rəng |
|---|------|-----------|------|------|
| 1 | **Aktiv Tapşırıqlar** | Status ≠ Completed AND Status ≠ Expired | `assignment` | 🔵 Mavi |
| 2 | **Gecikmiş** | Deadline < İndi AND Status ≠ Completed (+ son 24 saatda yeni gecikmişlər) | `warning` | 🔴 Qırmızı |
| 3 | **Komanda İş Yükü** | (Təyin olunmuş tapşırıqlar / Ümumi tapşırıqlar) × 100% (+ progress bar + tutum etiketi) | `groups` | Progress bar |
| 4 | **Tamamlandı** | Status === Completed (+ faiz artım trendi) | `check_circle` | 🟢 Yaşıl |

#### 3. **İş Yükü Diaqramı (WorkloadChart)**
- Bütün tapşırıqların vəziyyət üzrə paylanması
- Statuslara görə vizual diaqram

#### 4. **Fəaliyyət Axını (ActivityFeed)**
- Son bildirişlər siyahısı
- "Hamısına bax" düyməsi → `/notifications`

### Dashboard Data Axını:
```
DashboardOverview.tsx
    ↓ useEffect (mount)
    │
    ├── authService.getToken() → JWT Token
    ├── parseJwtToken(token) → {userId, userName, email, roles}
    ├── isTokenExpired(token) → Vaxtı keçibsə → /login
    │
    └── loadDashboardData()
        ├── dashboardService.getAllTasks() → Bütün tapşırıqlar
        ├── notificationService.getMyNotifications() → Bildirişlər
        └── calculateStats(tasks) → KPI dəyərlərini hesabla
```

---

## 📝 Tapşırıq Lifecycle (Həyat Dövrü)

Tapşırıq yaradıldıqdan tamamlanana qədər keçdiyi statuslar:

```
   ┌────────────┐
   │   PENDING   │    ← Tapşırıq yaradıldı
   │  (Gözləmə)  │
   └──────┬─────┘
          │ Bir işçi tapşırığı qəbul edir (AssignTask)
          ▼
   ┌────────────┐
   │  ASSIGNED   │    ← Tapşırıq bir işçiyə təyin olundu
   │(Təyin olunub)│
   └──────┬─────┘
          │ İşçi işə başlayır (AcceptTask)
          ▼
   ┌────────────┐
   │ IN PROGRESS │    ← İşçi tapşırıq üzərində işləyir
   │  (Davam)    │
   └──────┬─────┘
          │ İşçi işi bitirir (FinishTask)
          ▼
   ┌────────────┐
   │UNDER REVIEW │    ← Tapşırıq nəzərdən keçirilir
   │  (Yoxlama)  │
   └──────┬─────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼
┌────────┐ ┌───────────┐
│COMPLETED│ │ REJECTED  │ → ReturnedForRevision → IN PROGRESS
│(Tamam)  │ │ (Rədd)    │   (geri qaytarıldı)
└────────┘ └───────────┘
     │
     ▼
💰 Performans xalı verilir (10/20/30 bal çətinliyə görə)
```

### Status Enum:
```csharp
enum CurrentSituation {
    Pending,      // 0 - Gözləyir
    Assigned,     // 1 - Təyin olunub
    InProgress,   // 2 - Davam edir
    UnderReview,  // 3 - Nəzərdən keçirilir
    Completed,    // 4 - Tamamlanıb
    Expired       // 5 - Vaxtı keçib
}
```

---

## 🏢 İş Qrupları Sistemi

İş qrupları (WorkGroup) layihənin əsas təşkilati vahididir:

### Struktur:
```
İş Qrupu (WorkGroup)
├── Ad (Name)
├── Lider (Leader) → Manager rolu olan istifadəçi
├── Üzvlər (Users) → İşçilər kolleksiyası
└── Tapşırıqlar (Tasks) → Qrupa aid tapşırıqlar
```

### İmkanlar:
1. **Qrup yaratma** — Admin qrup yaradır, lider təyin edir
2. **Üzv əlavə/çıxarma** — Lider qrupuna işçi əlavə edə/çıxara bilər
3. **Tapşırıq ötürmə** — Lider öz qrupunun tapşırığını başqa qrupa ötürə bilər
4. **Qrup reytinqi** — Qrup daxilindəki işçilərin performans sıralaması
5. **Manager yönləndirmə** — Manager avtomatik öz qrupunun səhifəsinə yönləndirilir

### Tapşırıq Qruplar Arası Ötürmə:
```
Qrup A (Lider: Əli)
    │ Tapşırıq #5
    │ AssignTaskToGroupAsync(taskId=5, leaderId=Əli, targetGroupId=QrupB)
    ▼
Qrup B (Lider: Vəli) → Notification göndərilir
    │ Tapşırıq #5 (status: Pending olur)
```

---

## 🔔 Real-Time Bildiriş Sistemi (SignalR)

### Arxitektura:
```
Backend (NotificationHub)
    │ SignalR WebSocket
    ▼
signalRService.ts (Singleton)
    │ Event pub/sub
    ▼
NotificationContext.tsx (React Context)
    │ State management
    ▼
NotificationToast.tsx (UI)
```

### Bildiriş yaradılan hadisələr:
| Hadisə | Bildiriş |
|--------|----------|
| Tapşırıq təyin olundu | "Sizə yeni tapşırıq təyin edildi: {title}" |
| İstifadəçi qrupa əlavə edildi | "Siz {groupName} iş qrupuna əlavə olundunuz" |
| İstifadəçi qrupdan çıxarıldı | "Siz {groupName} iş qrupundan çıxarıldınız" |
| Tapşırıqda mention edildi | "@{userName} sizi qeyd etdi" |
| Tapşırıq qəbul edildi | "Tapşırıq qəbul edildi" |
| Tapşırıq rədd edildi | "Tapşırıq rədd edildi: {reason}" |
| Tapşırıq tamamlandı | "Tapşırıq tamamlandı" |
| Tapşırıq geri qaytarıldı | "Tapşırıq geri qaytarıldı: {reason}" |

### SignalR Xüsusiyyətləri:
- ✅ Singleton pattern — bir WebSocket bağlantısı
- ✅ Exponential backoff — ağıllı yenidən bağlanma (1s→2s→4s→8s→16s→30s)
- ✅ React StrictMode uyğunluq
- ✅ HTTP/WebSocket izolyasiyası
- ✅ Duplikat bildiriş filtrləmə

---

## 🏆 Performans Xal Sistemi

### Xal hesablama:
| Çətinlik | Xal |
|----------|-----|
| Easy (Asan) | 10 xal |
| Medium (Orta) | 20 xal |
| Hard (Çətin) | 30 xal |

### İş axını:
```
1. Manager tapşırıq yaradır
2. İşçi tapşırığı götürür və tamamlayır
3. Manager tapşırıq detalına girir
4. "Performans Xalı Əlavə Et" bölməsini görür
5. Feedback/əsas yazır
6. Xal avtomatik çətinliyə görə hesablanır
7. İşçinin performans səhifəsində görünür
8. Liderlər lövhəsində sıralama dəyişir
```

### Performance səhifəsi göstərir:
- Ümumi xal
- Tamamlama faizi
- Çətinliyə görə xal bölgüsü
- Trend göstəricisi

### Liderlər Lövhəsi (Leaderboard):
- Bütün işçilərin xal sıralaması
- Top performansçılar vurğulanır

---

## 📎 Fayl Əlavə Etmə (MinIO + TaskAttachment)

Tapşırıqlara fayl əlavə etmək mümkündür:
- Fayllar MinIO object storage-a yüklənir
- `TaskAttachment` entity-si metadata-nı (ad, tip, həcm) saxlayır
- Tapşırıq yaradılarkən və ya sonradan fayl əlavə etmək olar
- Backend `IFormFile` qəbul edir

---

## 🔐 Təhlükəsizlik

### Autentifikasiya:
- **JWT Token** — Login zamanı verilir
- **OTP (One Time Password)** — Şifrə sıfırlama üçün e-poçta göndərilir
- Token-in vaxtı keçibsə avtomatik `/login`-ə yönləndirmə

### Avtorizasiya:
- **[Authorize]** attribute — bütün API endpoint-lər qorunur
- **Tapşırıq sahibliyi** — yalnız yaradan redaktə/silə bilər
- **ClaimTypes.NameIdentifier** — JWT-dən userId alınır
- **Role-based** — Manager/Admin xüsusi funksiyalar

### Şifrə Sıfırlama Axını:
```
1. İstifadəçi e-poçt daxil edir → /forgot-password
2. Backend OTP kodu göndərir (EmailSender)
3. İstifadəçi OTP-ni daxil edir → /otp-verification
4. Yeni şifrə təyin edir → /reset-password
5. Uğurlu mesaj → /reset-success
```

---

## 💬 Tapşırıq Şərh Sistemi

- Tapşırıq detallarında şərh yazma
- İstifadəçi **mention** etmə (`@username`)
- `TaskComment` + `TaskCommentMention` entity-ləri
- Mention edilən istifadəçiyə bildiriş göndərilir
- `UserSuggestionList` komponenti — `@` yazanda istifadəçi təklifləri göstərir

---

## 🔄 Tapşırıq Tranzaksiya Tarixi (TaskTransaction)

Hər tapşırıq dəyişikliyi qeydə alınır:
- **FromUserId** → kim göndərdi
- **ToUserId** → kimə göndərildi
- **Comments** → izah
- Qruplar arası ötürmə tarixi
- Performans xalı verildikdə tranzaksiya yaranır

---

## 🛣️ Marşrut Xəritəsi (Frontend Routes)

| Marşrut | Səhifə | Təsvir |
|---------|--------|--------|
| `/login` | Login | Giriş |
| `/register` | Register | Qeydiyyat |
| `/forgot-password` | ForgotPassword | Şifrə unutma |
| `/otp-verification` | OtpVerification | OTP doğrulama |
| `/reset-password` | ResetPassword | Şifrə sıfırlama |
| `/reset-success` | ResetSuccess | Uğurlu sıfırlama |
| `/dashboard` | **DashboardOverview** | **Ana idarə paneli** |
| `/tasks` | MyTasks | Tapşırıqlarım |
| `/tasks/:id` | TaskDetail | Tapşırıq detalları |
| `/tasks/edit/:id` | TaskEdit | Tapşırıq redaktəsi |
| `/tasks/assignment/:id` | TaskAssignmentDetail | Təyinat detalları |
| `/notifications` | Notifications | Bildirişlər |
| `/performance` | Performance | Fərdi performans |
| `/leaderboard` | Leaderboard | Liderlər lövhəsi |
| `/work-groups` | WorkGroups | İş qrupları (Admin) |
| `/work-groups/:workGroupId` | WorkGroupRanking | Qrup reytinqi |
| `/employee/:userId` | EmployeePerformance | İşçi performansı |

---

## 🗄️ Verilənlər Bazası Entity-ləri

```
┌──────────────────┐     ┌──────────────────┐
│  ApplicationUser  │────│    WorkGroup       │
│  ─────────────── │    │  ───────────────── │
│  Id (string)     │    │  Id (int)          │
│  EmployeeId      │    │  Name              │
│  UserName        │    │  LeaderId → User   │
│  Email           │    │  Users []          │
│  WorkGroupId?    │    │  Tasks []          │
│  AssignedTasks[] │    └──────────────────┘
│  CreatedTasks[]  │
│  PerformPoints[] │    ┌──────────────────┐
│  TaskComments[]  │    │  TaskItem          │
│  Notifications[] │    │  ───────────────── │
└──────────────────┘    │  Id (int)          │
                        │  Title             │
┌──────────────────┐    │  Description       │
│ PerformancePoint │    │  Difficulty (enum) │
│  ─────────────── │    │  Status (enum)     │
│  Id (int)        │    │  Deadline          │
│  UserId → User   │    │  AssignedToUserId? │
│  Points (int)    │    │  AssignedWorkGroupId?│
│  Reason (string) │    │  CreatedByUserId   │
└──────────────────┘    │  ParentTaskId?     │
                        │  TaskComments[]    │
┌──────────────────┐    │  Attachments[]     │
│   Notification   │    └──────────────────┘
│  ─────────────── │
│  Id (int)        │    ┌──────────────────┐
│  UserId → User   │    │  TaskComment      │
│  Message         │    │  ─────────────── │
│  IsRead (bool)   │    │  Content          │
│  TaskId? (int)   │    │  UserId → User    │
└──────────────────┘    │  TaskId → Task    │
                        │  Mentions[]       │
┌──────────────────┐    └──────────────────┘
│ TaskTransaction  │
│  ─────────────── │    ┌──────────────────┐
│  TaskItemId      │    │  TaskAttachment   │
│  FromUserId      │    │  ─────────────── │
│  ToUserId        │    │  TaskId → Task    │
│  Comments        │    │  FileName         │
└──────────────────┘    │  ObjectName       │
                        │  ContentType      │
┌──────────────────┐    │  Size (long)      │
│ TaskCommentMention│   └──────────────────┘
│  ─────────────── │
│  CommentId       │    ┌──────────────────┐
│  UserId          │    │ PasswordResetOTP  │
└──────────────────┘    │  ─────────────── │
                        │  Email            │
                        │  OtpCode          │
                        │  ExpiryTime       │
                        └──────────────────┘
```

---

## 🔌 API Endpoint-ləri

### AuthorizeController (`/api/Authorize`)
| Method | Endpoint | Təsvir |
|--------|----------|--------|
| POST | `/login` | İstifadəçi girişi → JWT Token |
| POST | `/register` | Yeni qeydiyyat |
| GET | `/AllUsers` | Bütün istifadəçilər (Authorize) |
| POST | `/LogOut` | Çıxış |
| POST | `/ResetPassword` | Şifrə sıfırlama |
| POST | `/SendResetOtp` | OTP göndərmə |
| POST | `/AssignRole` | Rol təyini |

### TaskController (`/api/Task`)
| Method | Endpoint | Təsvir |
|--------|----------|--------|
| POST | `/CreateTask` | Yeni tapşırıq (+ fayllar) |
| GET | `/GetTask/{id}` | Tapşırıq detalları |
| PUT | `/UpdateTask` | Tapşırıq yeniləmə (yalnız yaradan) |
| DELETE | `/DeleteTask/{id}` | Tapşırıq silmə (yalnız yaradan) |
| GET | `/GetAllTask` | Bütün tapşırıqlar |
| POST | `/AddFilesToTask/{taskId}` | Fayl əlavə etmə |
| POST | `/AddComment` | Şərh əlavə etmə |
| POST | `/AssignTask` | Tapşırıq götürmə |
| POST | `/UnAssignTask` | Tapşırıqdan imtina |
| POST | `/AcceptTask` | Tapşırıq qəbulu |
| POST | `/reject` | Tapşırıq rəddi |
| POST | `/FinishTask` | Tapşırıq tamamlama |
| POST | `/ReopenTask` | Geri qaytarma |

### WorkGroupController (`/api/WorkGroup`)
| Method | Endpoint | Təsvir |
|--------|----------|--------|
| POST | `/` | Qrup yaratma |
| GET | `/` | Bütün qruplar |
| GET | `/{id}` | Qrup detalları |
| PUT | `/{id}` | Qrup yeniləmə |
| DELETE | `/{id}` | Qrup silmə |
| POST | `/{workGroupId}/AddUser/{userId}` | Üzv əlavə etmə |
| POST | `/{workGroupId}/RemoveUser/{userId}` | Üzv çıxarma |
| POST | `/AssignTask` | Qrupa tapşırıq təyini |

### PerformanceController (`/api/Performance`)
| Method | Endpoint | Təsvir |
|--------|----------|--------|
| GET | `/GetPerformanceReport` | Performans hesabatı |
| POST | `/Add Performance Point` | Xal əlavə etmə |
| GET | `/GetLeaderboard` | Liderlər lövhəsi |

### NotificationsController (`/api/Notifications`)
| Method | Endpoint | Təsvir |
|--------|----------|--------|
| GET | `/` | Bildirişləri al |
| POST | `/{id}/read` | Oxundu olaraq işarələ |

---

## 🎨 UI/UX Xüsusiyyətləri

- ✅ **TailwindCSS** — Responsive dizayn
- ✅ **Dark Mode** — Tam qaranlıq tema dəstəyi
- ✅ **Material Symbols** — Google ikonları
- ✅ **Azərbaycan dili** — Tam lokalizasiya
- ✅ **Toast bildirişlər** — Real-time popup-lar
- ✅ **Loading skeletonları** — Yüklənmə animasiyaları
- ✅ **Responsive** — Desktop + Tablet + Mobil
- ✅ **Gradient avatarlar** — İstifadəçi şəkilləri olmadıqda

---

## 🚀 Gələcək Planlar / İstəklər

1. **Settings səhifəsi** — Profil tənzimləmələri, tema seçimi, dil seçimi
2. **Tapşırıq tarixçəsi timeline** — Vizual timeline tapşırığın bütün dəyişiklikləri ilə
3. **E-poçt bildirişlər** — Vacib hadisələrdə e-poçt göndərmə
4. **Fayl önizləmə** — Əlavə olunmuş faylları birbaşa baxma
5. **Dashboard qrafiklər** — recharts/chart.js ilə trend diaqramları
6. **Drag & Drop** — Kanban board stili tapşırıq idarəetməsi
7. **İstifadəçi avatar yükləmə** — Profil şəkli
8. **Eksport (PDF/Excel)** — Hesabat çıxarma
9. **Alt tapşırıqlar** — ParentTaskId ilə iyerarxik tapşırıqlar
10. **Filtr və axtarış** — Ətraflı tapşırıq axtarışı

---

## 📊 Layihə Statistikası

| Metrik | Dəyər |
|--------|-------|
| Backend fayllar | ~453 |
| Frontend fayllar | ~82 |
| Səhifələr sayı | 18 |
| Komponentlər sayı | 14 |
| API endpoint-lər | 22+ |
| Domain entity-lər | 11 |
| Backend servislər | 12 |
| Frontend API servisləri | 10 |

---

## 💎 Layihənin Unikal Xüsusiyyətləri

1. **Clean Architecture** — Domain, Application, Contract, Persistence, Presentation layerləri
2. **Generic Repository/Service Pattern** — Təkrar kod minimuma endirilir
3. **SignalR Real-Time** — WebSocket əsaslı canlı bildirişlər
4. **MinIO Integration** — Distributed object storage ilə fayl idarəetmə
5. **JWT + OTP** — İki səviyyəli təhlükəsizlik
6. **Performans Gamification** — Xal sistemi ilə işçi motivasiyası
7. **Tapşırıq Workflow** — Tam həyat dövrü idarəetməsi (Pending → Completed)
8. **Qruplar Arası Tapşırıq Ötürmə** — Departamentlər arası əməkdaşlıq
9. **Comment Mention System** — @mention ilə komanda kommunikasiyası
10. **Tranzaksiya Tarixi** — Tam audit trail

---

**Bu layihə, müasir korporativ mühitdə tapşırıqların effektiv idarə olunması üçün tam funksional, production-ready bir həll təqdim edir.** 🎉
