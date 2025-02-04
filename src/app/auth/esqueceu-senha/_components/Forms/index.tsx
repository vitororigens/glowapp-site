"use client";

import { useLogic } from "./logic";

const Forms = () => {
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

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-[var(--main-color)] font-bold text-base text-white rounded-md transition-all duration-500"
      >
        Enviar
      </button>

      <p className="shrink text-light text-center mt-6">
        <a
          href="/auth/login"
          className="text-[var(--main-color)] font-semibold ms-1"
        >
          <b>Voltar</b>
        </a>
      </p>
    </form>
  );
};

export { Forms };
