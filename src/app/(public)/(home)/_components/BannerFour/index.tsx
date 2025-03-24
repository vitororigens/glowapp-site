const BannerFour = () => {
    return (
      <div className="px-6 p-20 bg-gray-100 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-blue-600">
            Organização total do seu negócio
          </h2>
          <p className="text-gray-700 text-lg mt-4">
            Com uma agenda personalizada e lembretes diários, o GlowApp coloca a gestão do seu negócio em primeiro lugar. 
            Mantenha-se sempre à frente com um sistema que permite:
          </p>
  
          <div className="mt-8 flex flex-col md:flex-row gap-6 justify-center">
            <div className="card bg-pink-500 flex justify-center items-center text-white text-lg font-bold rounded-2xl px-6 py-4 md:w-1/3">
              Armazenamento completo dos dados de cada cliente
            </div>
            <div className="card bg-blue-600 flex justify-center items-center text-white text-lg font-bold rounded-2xl px-6 py-4 md:w-1/3">
              Lista de contatos exclusiva
            </div>
            <div className="card bg-pink-500 flex justify-center items-center text-white text-lg font-bold rounded-2xl px-6 py-4 md:w-1/3">
              Gerenciamento de informações importantes de forma prática e segura
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export  {BannerFour};
  