import { motion } from 'framer-motion';

export function GlowAppBanner() {
  const buttonVariants = {
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.3,
        yoyo: Infinity
      }
    }
  };

  return (
    <section className="relative p-6 md:p-20 bg-gray-100 overflow-hidden">
      {/* Shapes */}
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-pink-500 rounded-3xl -translate-x-5 -translate-y-5 md:-translate-x-10 md:-translate-y-10"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-blue-600 rounded-3xl translate-x-10 translate-y-10 md:translate-x-20 md:translate-y-20"></div>

      <div className="relative z-10 auto-container rounded-3">
        <div className="row clearfix rounded-3 g-4">
          <div className="col-lg-6 col-md-12 col-sm-12 rounded-3 flex flex-col justify-center items-start">
            <h2 className="text-gray-800 text-2xl font-medium">
              Descubra o seu <br />
              <span className="text-blue-600 font-bold text-4xl">Novo Aplicativo</span> <br />
              de <span className="text-pink-500 font-bold">antes e depois</span>
            </h2>
            <h3 className="text-gray-800 text-lg font-bold mt-4">
              <span className="text-pink-500">Site e App:</span> Tudo em um só lugar
            </h3>
            <p className="text-gray-600 mt-4">
              O GlowApp foi criado para facilitar a sua rotina profissional, oferecendo um
              ecossistema completo para otimizar seu trabalho. Com ele, você tem tudo o que
              precisa em um só lugar, desde organização até gestão financeira.
            </p>
            <div className="flex space-x-4 mt-4">
              <motion.a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                variants={buttonVariants}
                whileHover="hover"
              >
                <img src="/img/resource/app-store.png" className='w-32 md:w-64' alt="Button loja Apple store" />
              </motion.a>
              <motion.a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                variants={buttonVariants}
                whileHover="hover"
              >
                <img src="/img/resource/play-store.png" className='w-32 md:w-64' alt="Button loja Play store" />
              </motion.a>
            </div>
          </div>
          <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12 items-center justify-center flex">
            <img src="/img/resource/mockup.png" className='w-40 md:w-96' alt="Mockup de um smarphone com a logo do GlowApp" />
          </div>
        </div>
      </div>
    </section>
  );
}
