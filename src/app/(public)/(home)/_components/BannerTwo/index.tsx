import { ImageSize } from "../Banner/styles";

const BannerTwo = () => {

  return (
    <section className="relative story-two p-2 md:p-20 mt-10 md:mt-20">
      {/* Shapes */}
      <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-pink-500 rounded-3xl -translate-x-5 -translate-y-5 md:-translate-x-10 md:-translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-blue-600 rounded-3xl translate-x-5 translate-y-5 md:translate-x-20 md:translate-y-20"></div>
      <div className="auto-container rounded-3">
        <div className="row clearfix rounded-3 g-4 flex flex-col md:flex-row items-center">
          <div className="story-two_image-column col-lg-6 col-md-12 col-sm-12 rounded-3 flex items-center justify-center">
            <div className="relative mt-5 w-full max-w-full lg:max-w-[700px] aspect-square md:aspect-[1/1] flex items-center justify-center">
                <ImageSize src="/img/resource/afterAndBefore.png" alt="Imagem antes e depois" className="rounded-3 w-full h-auto object-contain" />
            </div>
          </div>

          <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12">
            <div className="story-two_content-outer">
              <div className="sec-title">
                <div className="sec-title_title">Descubra o Seu Novo software de antes e depois</div>
                <h2 className="text-blue-600 font-bold">
                  Comece a usar o <span className="text-pink-500 font-bold"> GlowApp</span>
                </h2>
                <div className="sec-title_text">
                  Tenha todo um ecosistema para otimizar seus trabalho
                </div>
              </div>
              <div className="sec-title_text">
                <div className="">
                  <p>Com uma agenda personalizada e lembretes diários, o GlowApp coloca a organização do seu negócio em primeiro lugar. A plataforma permite que você armazene dados completos de cada cliente, crie uma lista de contatos exclusiva e gerencie todas as informações importantes de forma prática e segura. Além disso, o GlowApp oferece ferramentas essenciais, como controle financeiro, geração de orçamentos, checklists de tarefas e até listas de compras de produtos, tudo para otimizar sua rotina profissional.
                    <br />
                    E o melhor: todas essas funcionalidades podem ser compartilhadas diretamente no WhatsApp e nas redes sociais, ajudando você a manter seus clientes atualizados e engajados de forma prática e eficiente. Com o GlowApp, você tem a solução completa para organizar seu trabalho, crescer no mercado e destacar seus resultados de maneira profissional.</p>
                </div>
              </div>

              <div className="story-two_button d-flex align-items-center flex-wrap">
                <a
                  href="https://wa.me/5566996315835"
                  className="theme-btn btn-style-one"
                  target="_blank"
                  rel="noopener noreferrer"
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
      </div>
    </section>
  );
};

export { BannerTwo };
