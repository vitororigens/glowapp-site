"use client";

import { Banner } from "./_components/Banner";
import { BannerFour } from "./_components/BannerFour";
import { BannerTree } from "./_components/BannerThree";
import { BannerTwo } from "./_components/BannerTwo";
import Contact from "./_components/Contact";
import GlowAppBanner from "./_components/GlowAppBanner";
import SubscriptionPlans from "./_components/Plans";

const Home = () => {
  return (
    <main className="overflow-x-hidden">
    
      <Banner />
      <GlowAppBanner />
      <BannerTwo />
      <BannerTree />
      <BannerFour />
      <SubscriptionPlans />
      <Contact />
    </main>
  );
};

export default Home;
