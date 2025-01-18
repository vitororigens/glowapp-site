"use client";

import { Banner } from "./_components/Banner";
import { BannerTwo } from "./_components/BannerTwo";

const Home = () => {
  return (
    <main className="overflow-x-hidden">
      <Banner />
      <BannerTwo />
    </main>
  );
};

export default Home;
