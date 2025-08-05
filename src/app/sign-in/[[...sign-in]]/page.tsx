import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
          <p>Entre na sua conta para continuar criando fluxos incríveis</p>
        </div>

        <div className="rounded-lg shadow-lg p-6">
          <SignIn
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
            signUpUrl="/sign-up"
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Novo no PromptMesh?{" "}
            <a href="/sign-up" className="text-purple-600 hover:text-purple-700 font-medium">
              Crie sua conta gratuita
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
