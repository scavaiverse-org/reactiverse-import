import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ThreeBackground from "./ThreeBackground";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}