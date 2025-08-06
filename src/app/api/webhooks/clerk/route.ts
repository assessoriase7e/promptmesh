import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser, deleteUser } from "@/actions/user-actions";
import { giveWelcomeBonus, giveFirstMonthCredits } from "@/actions/credit-actions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Verificar se temos o secret do webhook
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error("Por favor, adicione CLERK_CLERK_WEBHOOK_SECRET nas variáveis de ambiente");
  }

  // Obter headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Se não temos os headers necessários, retornar erro
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Erro: Headers do webhook ausentes", {
      status: 400,
    });
  }

  // Obter o body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Criar uma nova instância do webhook Svix com o secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verificar o webhook
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Erro ao verificar webhook:", err);
    return new Response("Erro: Verificação do webhook falhou", {
      status: 400,
    });
  }

  // Processar o evento
  const { id } = evt.data;
  const eventType = evt.type;

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);

      if (!primaryEmail) {
        return NextResponse.json({ error: "Email primário não encontrado" }, { status: 400 });
      }

      try {
        // Verificar se o usuário já existe antes de criar
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: id },
          select: { id: true, credits: true, createdAt: true }
        });

        const user = await createUser({
          clerkId: id,
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          imageUrl: image_url || null,
        });

        // Dar bônus de boas-vindas e créditos do primeiro mês apenas se for um usuário novo
        if (!existingUser) {
          try {
            // Aguardar um pouco para garantir que o usuário foi criado completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Aplicar bônus de boas-vindas (15 créditos)
            const bonusResult = await giveWelcomeBonus(id);
            if (bonusResult) {
              console.log(`✅ Bônus de boas-vindas de 15 créditos concedido para usuário: ${id}`);
            } else {
              console.log(`⚠️ Bônus não aplicado - usuário já tinha créditos: ${id}`);
            }

            // Aplicar créditos do primeiro mês (20 créditos)
            const firstMonthResult = await giveFirstMonthCredits(id);
            if (firstMonthResult) {
              console.log(`✅ Créditos do primeiro mês (20) concedidos para usuário: ${id}`);
              console.log(`🎯 Total de créditos após registro: ${firstMonthResult.user.credits}`);
            } else {
              console.log(`⚠️ Créditos do primeiro mês não aplicados: ${id}`);
            }
          } catch (bonusError) {
            console.error("❌ Erro ao conceder créditos iniciais:", bonusError);
            // Não falhar o webhook por causa dos créditos
          }
        } else {
          console.log(`ℹ️ Usuário já existia, créditos não aplicados: ${id}`);
        }
      } catch (error) {
        console.error("❌ Erro ao criar usuário via webhook:", error);
        return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
      }
    } else if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);

      if (!primaryEmail) {
        console.error("Email primário não encontrado para o usuário:", id);
        return NextResponse.json({ error: "Email primário não encontrado" }, { status: 400 });
      }

      try {
        const user = await updateUser({
          clerkId: id,
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          imageUrl: image_url || null,
        });
      } catch (error) {
        console.error("❌ Erro ao atualizar usuário via webhook:", error);
        return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
      }
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;

      try {
        await deleteUser(id);
      } catch (error) {
        console.error("❌ Erro ao excluir usuário via webhook:", error);
        return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
      }
    } else {
      console.log(`Tipo de evento não tratado: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processado com sucesso" });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new Response("Erro interno do servidor", { status: 500 });
  }
}
