import { Forms } from "./_components/Forms";
import Logo from "./../../../../public/img/logos/main-logo.png";

const Login = () => {
  return (
    <section className="h-screen w-full">
      <div className="grid xl:grid-cols-2 grid-cols-1 h-full">
        <div className="max-w-lg mx-auto w-full flex flex-col justify-center md:items-start items-center p-6">
          <div className="md:text-start text-center mb-7">
            <a href="/" className="grow block mb-8">
              <img
                className="h-14 md:mx-0 mx-auto"
                src={Logo.src}	
                alt="Logo"
              />
            </a>

            <div className="md:text-start text-center">
              <h3 className="text-2xl font-semibold text-dark mb-3">
                Bem vindo novamente
              </h3>
            </div>
          </div>

          <Forms />
        </div>

        <div className="hidden xl:block">
          <div className="relative w-full h-screen bg-[url(https://ma.senac.br/wp-content/uploads/2017/11/instituto_mais_beleza_backg.jpg)] bg-center bg-cover"></div>
        </div>
      </div>
    </section>
  );
};

export default Login;
