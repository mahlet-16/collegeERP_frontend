import { useAuth } from "../context/AuthContext";

export default function AdminMonitorPage(){
  const { user } = useAuth();
  if(!user) return <p>Please sign in.</p>;
  if(user.role !== 'admin') return <p>Not authorized.</p>;
  return (
    <div className="page">
      <h1>System Monitoring</h1>
      <p>Placeholder: monitoring metrics and logs will appear here.</p>
    </div>
  );
}
