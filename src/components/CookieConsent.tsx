
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
    window.location.reload(); // Reload to initialize AdSense after consent
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          Utilizamos cookies para mejorar tu experiencia y mostrar anuncios relevantes. Al continuar navegando, aceptas nuestra{" "}
          <Link to="/privacy" className="text-blue-600 hover:underline">
            Política de Privacidad
          </Link>
          .
        </div>
        <Button onClick={handleAccept} className="whitespace-nowrap">
          Aceptar
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;
