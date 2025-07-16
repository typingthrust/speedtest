import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { OverlayProvider } from './components/OverlayProvider';
import { PersonalizationProvider } from './components/PersonalizationProvider';
import { GamificationProvider, useGamification } from './components/GamificationProvider';
import GamificationOverlay from './components/overlays/GamificationOverlay';
import { LeaderboardProvider } from './components/LeaderboardProvider';
import LeaderboardOverlay from './components/overlays/LeaderboardOverlay';
import { ContentLibraryProvider } from './components/ContentLibraryProvider';
import ContentLibraryOverlay from './components/overlays/ContentLibraryOverlay';
import { ZenModeProvider } from './components/ZenModeProvider';
import { AuthProvider } from './components/AuthProvider';
import AuthOverlay from './components/overlays/AuthOverlay';
import GrowthToolsOverlay from './components/overlays/GrowthToolsOverlay';
import ThemeToggle from './components/ThemeToggle';
import Widget from "./pages/Widget";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";

const queryClient = new QueryClient();

const AppContent = () => {
  const { state } = useGamification();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/widget" element={<Widget />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signin" element={<SignIn />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {state.gamificationEnabled && <GamificationOverlay />}
      <LeaderboardOverlay />
      <AuthOverlay />
      <GrowthToolsOverlay />
      <ThemeToggle />
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OverlayProvider>
          <AuthProvider>
            <PersonalizationProvider>
              <GamificationProvider>
                <LeaderboardProvider>
                  <ContentLibraryProvider>
                    <ZenModeProvider>
                      <AppContent />
                    </ZenModeProvider>
                  </ContentLibraryProvider>
                </LeaderboardProvider>
              </GamificationProvider>
            </PersonalizationProvider>
          </AuthProvider>
        </OverlayProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
