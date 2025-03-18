"use client";

import { Banner } from "./_components/Banner";
import { BannerFour } from "./_components/BannerFour";
import { BannerTree } from "./_components/BannerThree";
import { BannerTwo } from "./_components/BannerTwo";

const Home = () => {
  return (
    <main className="overflow-x-hidden">
      <Banner />
      <BannerTwo />
      <BannerTree />
      <BannerFour />
    </main>
  );
};

export default Home;
