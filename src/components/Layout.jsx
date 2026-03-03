import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      {user ? <Sidebar /> : null}
      <main className="main-content">{children}</main>
    </div>
  );
}
