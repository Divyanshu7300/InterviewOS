# InterviewOS Frontend

Next.js frontend for InterviewOS. It provides the UI for JD analysis, resume comparison, AI interviews, learning flows, dashboard stats, profile, and community.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Axios
- next-themes

## Main Features

- Login and signup
- Dashboard overview
- JD analyzer
- Resume upload against selected JD
- Adaptive interview setup, session, result, and recording screens
- Learn module with quizzes, stats, and results
- Community page
- Profile page

## Project Structure

```text
frontend/
├── app/
│   ├── page.js
│   ├── layout.js
│   ├── globals.css
│   ├── login/
│   ├── signup/
│   ├── home/
│   └── dashboard/
├── components/
│   ├── Navbar.js
│   ├── ProtectedRoute.js
│   ├── JDSelector.jsx
│   └── UserAvatar.jsx
├── context/
│   └── AuthContext.js
├── lib/
│   └── axios.js
└── public/
```

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## App Notes

- Auth state is managed in `context/AuthContext.js`.
- API calls go through `lib/axios.js`.
- Temporary interview and quiz state is stored in `sessionStorage`.
- Protected pages use `components/ProtectedRoute.js`.
