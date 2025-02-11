/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect } from "react";
import useCallbackLoadedPage from "@/hooks/useCallbackPageLoaded";

import { gsap } from "gsap";
import $ from "jquery";

import * as S from "./styles";
const Cursor = () => {
  const [setFn] = useCallbackLoadedPage();

  const animate = () => {
    const cursor = $(".cursor");
    const follower = $(".cursor-follower");

    let posX = 0,
      posY = 0;

    let mouseX = 0,
      mouseY = 0;

    gsap.to({}, 0.016, {
      repeat: -1,
      onRepeat: function () {
        posX += (mouseX - posX) / 9;
        posY += (mouseY - posY) / 9;

        gsap.set(follower, {
          css: {
            left: posX - 12,
            top: posY - 12,
          },
        });

        gsap.set(cursor, {
          css: {
            left: mouseX,
            top: mouseY,
          },
        });
      },
    });

    setFn(() => {
      $("button, a, form").on("mouseenter", function () {
        cursor.addClass("active");
        follower.addClass("active");
      });
      $("button, a, form").on("mouseleave", function () {
        cursor.removeClass("active");
        follower.removeClass("active");
      });
    });

    const handleMouseLeave = () => {
      cursor.addClass("active");
      follower.addClass("active");
    };

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  };

  useEffect(() => {
    animate();
  }, []);

  return (
    <>
      <S.CursorWrapper className="cursor"></S.CursorWrapper>
      <div className="cursor-follower"></div>
    </>
  );
};

export { Cursor };
