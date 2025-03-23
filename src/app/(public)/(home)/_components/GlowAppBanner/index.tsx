export default function GlowAppBanner() {
    return (
        <section className="relative p-20 bg-gray-100 overflow-hidden">
            {/* Shapes */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500 rounded-3xl -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600 rounded-3xl translate-x-20 translate-y-20"></div>

            <div className="relative z-10 auto-container rounded-3">
                <div className="row clearfix rounded-3 g-4">
                    <div className="col-lg-6 col-md-12 col-sm-12 rounded-3">
                        <h2 className="text-gray-800 text-2xl font-medium">
                            Descubra o seu <br />
                            <span className="text-blue-600 font-bold text-4xl">Novo Aplicativo</span> <br />
                            de <span className="text-pink-500 font-bold">antes e depois</span>
                        </h2>
                        <h3 className="text-gray-800 text-lg font-bold mt-4">
                            <span className="text-pink-500">Site e App:</span> Tudo em um só lugar
                        </h3>
                        <p className="text-gray-600 mt-4">
                            O GlowApp foi criado para facilitar a sua rotina profissional, oferecendo um
                            ecossistema completo para otimizar seu trabalho. Com ele, você tem tudo o que
                            precisa em um só lugar, desde organização até gestão financeira.
                        </p>
                    </div>
                    <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12">
                        {/* Adicione a imagem do smartphone como PNG aqui */}
                    </div>
                </div>
            </div>
        </section>
    );
}
