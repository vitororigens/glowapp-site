import { AiOutlineDollarCircle } from "react-icons/ai";
import { LiaFileInvoiceDollarSolid, LiaClipboardListSolid } from "react-icons/lia";
import { TiShoppingCart } from "react-icons/ti";

const BannerTree = () => {
    return (
        <section className="p-20 mt-20">
            <div className="auto-container rounded-3">
                <div className="row clearfix rounded-3 g-4">

                    <div className="col-lg-6 col-md-12 col-sm-12 rounded-3">
                        <h2 className="text-4xl font-bold text-blue-600 leading-tight">
                            Ferramentas essenciais <br /> para o seu sucesso
                        </h2>
                        <hr className="w-full border-t-2 border-slate-500 my-6" />
                        <p className="text-gray-700 text-lg">
                            Além da organização, o <span className="text-pink-500 font-bold">GlowApp</span> oferece
                            recursos indispensáveis para otimizar sua rotina profissional:
                        </p>
                    </div>
                    <div className="story-two_content-column col-lg-6 col-md-12 col-sm-12">
                        <ul className="space-y-4 text-gray-700 text-lg">
                            <li className="flex items-center gap-3">
                                <AiOutlineDollarCircle className="text-pink-500 text-6xl" />
                                Controle financeiro para acompanhar suas receitas e despesas;
                            </li>
                            <li className="flex items-center gap-3">
                                <LiaFileInvoiceDollarSolid className="text-pink-500 text-6xl" />
                                Geração de orçamentos de forma rápida e personalizada;
                            </li>
                            <li className="flex items-center gap-3">
                                <LiaClipboardListSolid className="text-pink-500 text-6xl" />
                                Checklists de tarefas para não esquecer nenhum compromisso;
                            </li>
                            <li className="flex items-center gap-3">
                                <TiShoppingCart className="text-pink-500 text-6xl" />
                                Listas de compras de produtos para manter seu estoque sempre atualizado.
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

export { BannerTree };

