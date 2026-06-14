import React, { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const ThreeBackground = lazy(() => import("./ThreeBackground"));

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>
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