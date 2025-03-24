import { ImageSize } from "../Banner/styles";
import { motion } from 'framer-motion';

const BannerTwo = () => {
  const bounceTransition = {
    y: {
      duration: 0.4,
      yoyo: Infinity,
      ease: "easeOut"
    }
  };

  return (
    <section className="relative story-two mt-20 ">
      {/* Shapes */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-3xl -translate-x-10 -translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-3xl translate-x-20 translate-y-20"></div>
      <div className="auto-container rounded-3">
        <div className="row clearfix rounded-3">
          <div className="story-two_image-column col-lg-6 col-md-12 col-sm-12 rounded-3 items-center justify-center flex">
            <div className="">
              <motion.div
                className="story-two_image wow fadeInLeft"
                data-wow-delay="0ms"
                data-wow-duration="1500ms"
                animate={{ y: ["0%", "-30%"] }}
                transition={bounceTransition}
              >
                <ImageSize src="/img/logos/Logo2.png" alt="" className="rounded-3" />
              </motion.div>
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
