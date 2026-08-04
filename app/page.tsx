"use client";

import { useEffect, useRef, useState } from "react";


import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";


export default function HomePage() {
  

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-500 selection:text-white">
      <Navbar/>
      <Hero/>
      <Features/>
      <Pricing/>
      <Footer/>

      
    </main>
  );
}
