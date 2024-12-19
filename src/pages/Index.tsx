import Anagramador from "@/components/Anagramador";

export const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#16417C] to-[#F97316] flex flex-col items-center justify-start pt-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2 bg-[#16417C] p-2 rounded-md">
          <img 
            src="/lovable-uploads/ca9a9ae9-40fb-4d60-a8f9-1ab45c41ee96.png" 
            alt="File Logo" 
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-3xl font-bold text-white uppercase tracking-wide [text-shadow:_2px_2px_0_#F97316] border-[#F97316]">
            Anagramador
          </h1>
        </div>
      </div>
      <Anagramador />
    </div>
  );
}