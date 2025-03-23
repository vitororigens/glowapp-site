const ContactUs = () => {
    return (
        <section className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md mt-10 p-20">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Contate-nos</h1>
            
            <div className="mt-10 flex flex-col md:flex-row justify-center gap-8">
                <div className="md:w-2/4 p-20 flex justify-center items-center flex-col gap-10">
                <img src="/img/logos/main-logo.png" alt="Logo" width={200} />
                    <p className="text-gray-700 dark:text-gray-300 text-lg">
                        Deixe seu feedback ou sugestão, e entraremos em contato em breve.
                    </p>
                </div>

                <form className="md:w-2/4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white">
                            Seu email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            className="mt-1 w-full p-2.5 text-sm border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="seu email"
                            required 
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-900 dark:text-white">
                            Assunto
                        </label>
                        <input 
                            type="text" 
                            id="subject" 
                            className="mt-1 w-full p-2.5 text-sm border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            required 
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-900 dark:text-white">
                            Escreva sua mensagem
                        </label>
                        <textarea 
                            id="message" 
                            rows="4" 
                            className="mt-1 w-full p-2.5 text-sm border rounded-lg bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descreva sua mensagem..."
                        ></textarea>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </section>
    );
};

export default ContactUs;
