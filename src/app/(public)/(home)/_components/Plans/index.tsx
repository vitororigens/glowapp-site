import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "./styles.css"; // Importando o arquivo de estilos

const plans = [
    {
        name: "Gratuito",
        price: "Grátis",
        features: [
            "Foto antes e depois*",
            "Agenda",
            "Controle Financeiro",
            "Lista de Procedimentos",
            "Orçamentos",
            "Checklist",
            "Histórico de Tarefas",
            "*Limitado a 10 clientes e 4 fotos por cliente"
        ],
    },
    {
        name: "Básico",
        price: "R$29,90",
        features: [
            "Foto antes e depois*",
            "Agenda",
            "Controle Financeiro",
            "Lista de Procedimentos",
            "Orçamentos",
            "Checklist",
            "Histórico de Tarefas",
            "*Limitado a 50 clientes e 6 fotos por cliente"
        ],
    },
    {
        name: "Standard",
        price: "R$59,90",
        features: [
            "Foto antes e depois*",
            "Agenda",
            "Controle Financeiro",
            "Lista de Procedimentos",
            "Orçamentos",
            "Checklist",
            "Histórico de Tarefas",
            "Clientes ilimitados",
            "Fotos ilimitadas",
            "Primeiras atualizações",
            "Utilização de IA"
        ],
    },
];

export default function SubscriptionPlans() {
    return (
        <div className="mt-20">
            <div className="container mx-auto py-12">
                <h2 className="text-3xl font-bold text-center mb-8">Escolha seu Plano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <Card key={index} className="card shadow-lg p-4 rounded-2xl border border-gray-200 flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-center">{plan.name}</CardTitle>
                                <p className="text-center text-lg font-semibold text-gray-700">{plan.price}</p>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-grow">
                                <ul className="space-y-2 text-gray-600 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            ✅ {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">Assinar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
