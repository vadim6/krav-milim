import AdminTestingClient from "./AdminTestingClient"

export default function AdminTestingPage() {
  const isDev = process.env.NODE_ENV === "development"
  return <AdminTestingClient isDev={isDev} />
}
