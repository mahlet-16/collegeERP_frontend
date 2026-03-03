import { useAuth } from "../context/AuthContext";

export default function AdminConfigPage(){
  const { user } = useAuth();
  if(!user) return <p>Please sign in.</p>;
  if(user.role !== 'admin') return <p>Not authorized.</p>;
  return (
    <div className="page">
      <h1>Admin: Monitor & Configure</h1>
      <p>Use Django admin or API endpoints to configure system settings, roles, backups, and monitoring.</p>
    </div>
  );
}
