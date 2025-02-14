
import React from "react";

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Política de Privacidad</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Última actualización: {new Date().toLocaleDateString()}</h2>
        
        <p>Bienvenido a Juez de Léxico. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información.</p>

        <h3 className="text-xl font-semibold">1. Información que Recopilamos</h3>
        <p>Recopilamos información limitada que incluye:</p>
        <ul className="list-disc pl-6">
          <li>Datos de uso y estadísticas anónimas</li>
          <li>Información necesaria para la funcionalidad de Google AdSense</li>
        </ul>

        <h3 className="text-xl font-semibold">2. Uso de Cookies</h3>
        <p>Utilizamos cookies y tecnologías similares para:</p>
        <ul className="list-disc pl-6">
          <li>Mejorar la experiencia del usuario</li>
          <li>Analizar el uso del sitio</li>
          <li>Mostrar anuncios personalizados a través de Google AdSense</li>
        </ul>

        <h3 className="text-xl font-semibold">3. Google AdSense</h3>
        <p>Utilizamos Google AdSense para mostrar anuncios. Google AdSense usa cookies para mostrar anuncios relevantes. Puedes obtener más información sobre las prácticas de privacidad de Google visitando: <a href="https://policies.google.com/technologies/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a></p>

        <h3 className="text-xl font-semibold">4. Tus Derechos</h3>
        <p>Tienes derecho a:</p>
        <ul className="list-disc pl-6">
          <li>Acceder a tu información personal</li>
          <li>Solicitar la rectificación o eliminación de tu información</li>
          <li>Oponerte al procesamiento de tus datos</li>
          <li>Retirar tu consentimiento en cualquier momento</li>
        </ul>

        <h3 className="text-xl font-semibold">5. Contacto</h3>
        <p>Para cualquier consulta sobre esta política de privacidad, puedes contactarnos a través de maslexico.app</p>
      </section>
    </div>
  );
};

export default Privacy;
