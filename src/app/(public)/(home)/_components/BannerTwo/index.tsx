import { ImageSize } from "../Banner/styles";

const BannerTwo = () => {
  return (
    <section className="story-two mt-20">
      <div className="auto-container">
        <div className="row clearfix">
          <div className="story-two_image-column col-lg-6 col-md-12 col-sm-12">
            <div className="">
              <div
                className="story-two_image wow fadeInLeft"
                data-wow-delay="0ms"
                data-wow-duration="1500ms"
              >
                <ImageSize src="/img/resource/image01.png" alt=""  />
              </div>
            </div>
          </div>

          <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12">
            <div className="story-two_content-outer">
              <div className="sec-title">
                <div className="sec-title_title">Descubra o Seu Novo aplicativo de antes e depois</div>
                <h2 className="sec-title_heading">
                  Site e App: Tudo em um Só Lugar
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
