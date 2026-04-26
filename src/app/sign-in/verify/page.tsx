import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verifique seu e-mail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de acesso para o seu e-mail. Clique nele para
            entrar.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
