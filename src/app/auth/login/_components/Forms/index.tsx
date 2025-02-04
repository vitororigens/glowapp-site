"use client";

import { useState } from "react";

import { useLogic } from "./logic";

import { IconEye, IconEyeOff } from "@tabler/icons-react";

const Forms = () => {
  const [inputPasswordShow, setInputPasswordShow] = useState(false);
  const { methods } = useLogic();

  return (
    <form
      className="text-start w-full"
      onSubmit={methods.handleSubmit(methods.onSubmit)}
    >
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
            placeholder="Henry Cavil"
          />
        </div>
      </div>

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

      <div className="flex justify-between items-center flex-wrap gap-x-1 gap-y-2 mb-6 mt-3">
        <a href="/auth/esqueceu-senha" className="text-[var(--main-color)]">
          <small>Esqueceu a senha?</small>
        </a>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-[var(--main-color)] font-bold text-base text-white rounded-md transition-all duration-500"
      >
        Login
      </button>

      <p className="shrink text-light text-center mt-6">
        Não tem uma conta?
        <a
          href="/auth/registrar"
          className="text-[var(--main-color)] font-semibold ms-1"
        >
          <b>Registrar</b>
        </a>
      </p>
    </form>
  );
};

export { Forms };
