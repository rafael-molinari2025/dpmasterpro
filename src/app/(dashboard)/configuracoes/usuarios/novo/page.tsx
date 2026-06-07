import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import FormNovoUsuario from "./FormNovoUsuario";

export default async function NovoUsuarioPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!session?.user) redirect("/login");
  if (user?.perfil !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <Header title="Novo Usuário" subtitle="Cadastre um novo usuário e defina suas permissões de acesso" />
      <FormNovoUsuario />
    </>
  );
}
