import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useGlobalTrie } from "@/hooks/useGlobalTrie";
import Index from "./pages/Index";

const queryClient = new QueryClient();

// Wrapper component to use hooks
const AppContent = () => {
  // Initialize Trie at app level
  useGlobalTrie();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;