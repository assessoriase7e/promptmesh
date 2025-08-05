import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Comece sua jornada</h1>
          <p>Crie sua conta e transforme suas ideias em fluxos visuais de IA</p>
        </div>

        <div className="rounded-lg shadow-lg p-6">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-sm normal-case",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                socialButtonsBlockButtonText: "text-gray-700",
                formFieldInput: "border border-gray-300 focus:border-purple-500 focus:ring-purple-500",
                footerActionLink: "text-purple-600 hover:text-purple-700",
              },
            }}
            redirectUrl="/projects"
            signInUrl="/sign-in"
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <a href="/sign-in" className="text-purple-600 hover:text-purple-700 font-medium">
              Faça login aqui
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Grátis para começar
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Sem cartão necessário
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Cancele a qualquer momento
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
