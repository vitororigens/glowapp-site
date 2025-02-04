/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";

import { useLogic } from "./logic";

import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Controller } from "react-hook-form";

const Forms = () => {
  const { data, methods } = useLogic();

  const [inputPasswordShow, setInputPasswordShow] = useState(false);
  const [inputConfirmPasswordShow, setInputConfirmPasswordShow] =
    useState(false);

  return (
    <form
      className="text-start w-full"
      onSubmit={methods.handleSubmit(methods.onSubmit)}
    >


      {/* Nome */}
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-base font-semibold text-dark mb-2"
        >
          Nome
        </label>
        <div className="flex">
          <input
            {...methods.register("name")}
            type="text"
            id="name"
            className="form-password text-dark text-base font-medium block w-full rounded-md py-2.5 px-4 border border-gray-300 focus:border-primary focus:outline-0 placeholder:text-light placeholder:text-base"
            placeholder="Henry Cavil"
          />
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label
          htmlFor="password-addon"
          className="block text-base font-semibold text-dark mb-2"
        >
          Email
        </label>
        <div className="flex">
          <input
            {...methods.register("email")}
            type="email"
            id="password-addon"
            className="form-password text-dark text-base font-medium block w-full rounded-md py-2.5 px-4 border border-gray-300 focus:border-primary focus:outline-0 placeholder:text-light placeholder:text-base"
            placeholder="henricavil@exemplo.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label
          htmlFor="phone"
          className="block text-base font-semibold text-dark mb-2"
        >
          Telefone
        </label>
        <div className="flex">
          <input
            {...methods.register("phone")}
            type="number"
            id="phone"
            className="form-password text-dark text-base font-medium block w-full rounded-md py-2.5 px-4 border border-gray-300 focus:border-primary focus:outline-0 placeholder:text-light placeholder:text-base"
            placeholder="99812398232"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-4">
        <label
          htmlFor="password-addon"
          className="block text-base font-semibold text-dark mb-2"
        >
          Senha
        </label>
        <div className="flex">
          <input
            {...methods.register("password")}
            type={inputPasswordShow ? "text" : "password"}
            id="password-addon"
            className="form-password text-dark text-base font-medium block w-full rounded-s-md py-2.5 px-4 border border-gray-300 focus:border-primary focus:outline-0 placeholder:text-light placeholder:text-base"
            placeholder="**********"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center py-2.5 px-4 border rounded-e-md -ms-px border-gray-300"
            onClick={() => setInputPasswordShow((prev) => !prev)}
          >
            {inputPasswordShow ? <IconEye /> : <IconEyeOff />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label
          htmlFor="confirm-password"
          className="block text-base font-semibold text-dark mb-2"
        >
          Confirmar senha
        </label>
        <div className="flex">
          <input
            {...methods.register("confirmPassword")}
            type={inputConfirmPasswordShow ? "text" : "password"}
            id="confirm-password"
            className="form-password text-dark text-base font-medium block w-full rounded-s-md py-2.5 px-4 border border-gray-300 focus:border-primary focus:outline-0 placeholder:text-light placeholder:text-base"
            placeholder="**********"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center py-2.5 px-4 border rounded-e-md -ms-px border-gray-300"
            onClick={() => setInputConfirmPasswordShow((prev) => !prev)}
          >
            {inputConfirmPasswordShow ? <IconEye /> : <IconEyeOff />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-[var(--main-color)] font-bold text-base text-white rounded-md transition-all duration-500"
      >
        Registrar
      </button>

      <p className="shrink text-light text-center mt-6">
        Já tem uma conta?
        <a
          href="/auth/login"
          className="text-[var(--main-color)] font-semibold ms-1"
        >
          <b>Logar</b>
        </a>
      </p>
    </form>
  );
};

export { Forms };
