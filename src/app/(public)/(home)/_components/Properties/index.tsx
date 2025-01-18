/* eslint-disable react-hooks/rules-of-hooks */

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useLogic } from "./logic";
import { useEffect } from "react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { metroQuadradoMask } from "@/utils/maks/masks";

const Properties = () => {
  if (typeof window === "undefined") return;

  const { data, methods } = useLogic();

  useEffect(() => {
    methods.queryFilteredProperties();
  }, [window.location.href]);

  if (data.property?.length === 0) {
    return;
  }

  return (
    <section className="property-one style-two">
      <div className="auto-container">
        <div className="sec-title">
          <div className="sec-title_title">Últimos Imóveis adicionado</div>
          <h2 className="sec-title_heading">
            Explore Imóveis <br /> em Destaque
          </h2>
        </div>

        <Swiper
          modules={[Pagination, Navigation]}
          autoHeight={true}
          loop={true}
          spaceBetween={30}
          slidesPerView={3}
          className="three-items_slider swiper-container"
          speed={500}
          breakpoints={{
            1600: {
              slidesPerView: 3,
            },
            1200: {
              slidesPerView: 3,
            },
            1100: {
              slidesPerView: 3,
            },
            992: {
              slidesPerView: 2,
            },
            850: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 1,
            },
            576: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            },
          }}
          navigation={{
            nextEl: ".three-items_slider-next",
            prevEl: ".three-items_slider-prev",
          }}
          pagination={{
            clickable: true,
            el: ".three-items_slider-pagination",
          }}
        >
          {data.property?.map((item, key) => (
            <SwiperSlide key={key}>
              <div className="property-block_one style-two">
                <div className="property-block_one-inner">
                  <div className="property-block_one-image">
                    <a href="property-detail.html">
                      <img
                        src={
                          item.imageUrls[0] ??
                          "/img/not-found/default-image.jpg"
                        }
                        alt={item.name}
                      />
                    </a>
                    <div className="property-block_one-image-content">
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <button
                          className="property-block_one-heart items-center justify-center"
                          style={{ display: "flex" }}
                          onClick={() => {
                            methods.addRemoveFavoriteProperties(item.id);
                          }}
                        >
                          {item.favorite ? <IconHeartFilled /> : <IconHeart />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="property-block_one-content">
                    <div className="property-block_one-location">
                      <i className="flaticon-maps-and-flags"></i>Pasadena
                      {item.address} - {item.city}
                    </div>
                    <h4 className="property-block_one-heading">
                      <a href="property-detail.html">{item.name}</a>
                    </h4>
                    <ul className="property-block_one-info">
                      <li>
                        <span>
                          <img src="/img/icons/bed.svg" alt="" />
                        </span>
                        {item.numberBedrooms} Quar.
                      </li>
                      <li>
                        <span>
                          <img src="/img/icons/bath.svg" alt="" />
                        </span>
                        {item.numberbathrooms} Ban.
                      </li>
                      <li>
                        <span>
                          <img src="/img/icons/square.svg" alt="" />
                        </span>
                        {metroQuadradoMask(item.totalArea)}
                      </li>
                    </ul>
                    <div className="property-block_one-btn">
                      <a href={`/imoveis/${item.id}`} className="theme-btn">
                        Ver detalhes
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}

          <div className="three-items_slider-pagination"></div>

          <div className="three-items_slider-prev">
            <img src="/img/icons/prev-arrow.png" alt="" />
          </div>
          <div className="three-items_slider-next">
            <img src="/img/icons/next-arrow.png" alt="" />
          </div>
        </Swiper>
      </div>
    </section>
  );
};

export { Properties };
