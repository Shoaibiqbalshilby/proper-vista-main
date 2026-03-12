import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import ListProperty from "./pages/ListProperty";
import EditProperty from "./pages/EditProperty";
import Auth from "./pages/Auth";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="flex min-h-screen flex-col">
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/list-property" element={<ListProperty />} />
              <Route path="/edit-property/:propertyId" element={<EditProperty />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
