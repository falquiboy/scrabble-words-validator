
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// UserActivityProvider removed
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import DuplicadaDashboard from "./pages/duplicada/Dashboard";
import AdminInterface from "./pages/duplicada/AdminInterface";
import CompetitorInterface from "./pages/duplicada/CompetitorInterface";
import LiveResults from "./pages/duplicada/LiveResults";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/duplicada" element={<DuplicadaDashboard />} />
              <Route path="/duplicada/admin" element={<AdminInterface />} />
              <Route path="/duplicada/competitor" element={<CompetitorInterface />} />
              <Route path="/duplicada/live" element={<LiveResults />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
