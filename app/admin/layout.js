import AdminShell from '../../components/AdminShell';

export const metadata = { title: "Admin | ED'S ESSENTIALS", robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
