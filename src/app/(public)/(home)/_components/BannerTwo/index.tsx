const BannerTwo = () => {
  return (
    <section className="story-two mt-20">
      <div className="auto-container">
        <div className="row clearfix">
          <div className="story-two_image-column col-lg-6 col-md-12 col-sm-12">
            <div className="story-two_image-outer">
              <div
                className="story-two_image wow fadeInLeft"
                data-wow-delay="0ms"
                data-wow-duration="1500ms"
              >
                <img src="/img/resource/story-2.jpg" alt="" />
              </div>
              <div
                className="story-two_image-two wow fadeInRight"
                data-wow-delay="0ms"
                data-wow-duration="1500ms"
              >
                <img src="/img/resource/story-3.jpg" alt="" />
              </div>
            </div>
          </div>

          <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12">
            <div className="story-two_content-outer">
              <div className="sec-title">
                <div className="sec-title_title">Descubra o Seu Novo Lar ou Espaço Comercial</div>
                <h2 className="sec-title_heading">
                  Site e App: Tudo em um Só Lugar
                </h2>
                <div className="sec-title_text">
                  Encontre a casa dos seus sonhos ou o local perfeito para o seu negócio com nosso buscador de imóveis. Explore uma seleção exclusiva de propriedades que atendem aos mais altos padrões de qualidade e localização.
                </div>
              </div>
              <div className="row clearfix">
                <div className="column col-lg-6 col-md-6 col-sm-12">
                  <div className="story-two_check">
                    <i className="flaticon-check-mark"></i>Solução para Corretores Independentes
                  </div>
                </div>
                <div className="column col-lg-6 col-md-6 col-sm-12">
                  <div className="story-two_check">
                    <i className="flaticon-check-mark"></i>Solução para Imobiliárias e Franquias
                  </div>
                </div>
              </div>
              <ul className="story-two_checklist">
                <li>
                  <i className="flaticon-checked"></i> Atendimento personalizado e suporte especializado
                </li>
                <li>
                  <i className="flaticon-checked"></i> Localização estratégica para as suas necessidades
                </li>
              </ul>
              <div className="story-two_button d-flex align-items-center flex-wrap">
                <a href="event-detail.html" className="theme-btn btn-style-one">
                  <span className="btn-wrap">
                    <span className="text-one">Saiba Mais</span>
                    <span className="text-two">Saiba Mais</span>
                  </span>
                </a>
                <a
                  href="https://www.youtube.com/watch?v=kxPCFljwJws"
                  className="lightbox-video story-two_play"
                >
                  <span className="flaticon-play">
                    <i className="ripple"></i>
                  </span>
                  Assista ao Vídeo
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
