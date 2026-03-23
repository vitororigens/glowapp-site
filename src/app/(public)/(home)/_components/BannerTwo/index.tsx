import { ImageSize } from "../Banner/styles";

const BannerTwo = () => {

  return (
    <section className="relative p-4 md:p-20 mt-10 md:mt-20">
      {/* Shapes */}
      <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-pink-500 rounded-3xl -translate-x-5 -translate-y-5 md:-translate-x-10 md:-translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-blue-600 rounded-3xl translate-x-5 translate-y-5 md:translate-x-20 md:translate-y-20"></div>
      <div className="max-w-6xl mx-auto rounded-lg">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <ImageSize src="/img/resource/afterAndBefore.png" alt="Imagem antes e depois" className="rounded-lg w-full h-auto object-contain" />
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="sec-title">
              <div className="sec-title_title text-sm font-semibold text-pink-500 uppercase mb-2">Descubra o Seu Novo software de antes e depois</div>
              <h2 className="text-blue-600 font-bold text-2xl md:text-3xl mb-4">
                Comece a usar o <span className="text-pink-500 font-bold"> GlowApp</span>
              </h2>
              <div className="text-gray-600 mb-4">
                Tenha todo um ecosistema para otimizar seus trabalho
              </div>
            </div>
            <div className="text-gray-700 mb-6">
              <p>Com uma agenda personalizada e lembretes diários, o GlowApp coloca a organização do seu negócio em primeiro lugar. A plataforma permite que você armazene dados completos de cada cliente, crie uma lista de contatos exclusiva e gerencie todas as informações importantes de forma prática e segura. Além disso, o GlowApp oferece ferramentas essenciais, como controle financeiro, geração de orçamentos, checklists de tarefas e até listas de compras de produtos, tudo para otimizar sua rotina profissional.
                <br /><br />
                E o melhor: todas essas funcionalidades podem ser compartilhadas diretamente no WhatsApp e nas redes sociais, ajudando você a manter seus clientes atualizados e engajados de forma prática e eficiente. Com o GlowApp, você tem a solução completa para organizar seu trabalho, crescer no mercado e destacar seus resultados de maneira profissional.</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="theme-btn btn-style-one"
                onClick={(e) => {
                  e.preventDefault();
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="btn-wrap">
                  <span className="text-one">Fale Conosco</span>
                  <span className="text-two">Fale Conosco</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { BannerTwo };
