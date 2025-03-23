import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function Contact() {
  return (
    <div className="container mx-auto py-12">
    
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Entre em Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className=" border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Informaçoes de Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray-600">
                <li>Tem interesse em um plano personalizado ou saber mais entre em contato</li>
                <li>📞 +55 66 9217-0388</li>
              </ul>
            </CardContent>
          </div>
          <Card className="shadow-lg p-6 rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Fale Conosco</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <input type="text" placeholder="Seu nome completo" className="w-full p-2 border rounded-lg" />
                <input type="email" placeholder="seu@email.com" className="w-full p-2 border rounded-lg" />
                <input type="text" placeholder="(00) 00000-0000" className="w-full p-2 border rounded-lg" />
                <textarea placeholder="Como podemos ajudar?" className="w-full p-2 border rounded-lg h-24"></textarea>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Enviar Mensagem</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
