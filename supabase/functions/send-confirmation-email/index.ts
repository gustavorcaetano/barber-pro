import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// --- Configuração de Segurança e Inicialização do Resend ---
// 1. Defina um nome de variável de ambiente (ex: "RESEND_API_KEY")
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// 2. Verificação de segurança: Lança um erro se a chave não estiver configurada
if (!RESEND_API_KEY) {
    console.error("ERRO: A variável de ambiente 'RESEND_API_KEY' não foi configurada.");
    // No Deno Deploy, é melhor deixar o erro ser capturado ou lançar para falha
    throw new Error("Chave da API do Resend ausente.");
}

// 3. Inicializa o Resend com a variável obtida
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-confirmation-email function called");
  
  if (req.method === "OPTIONS") {
    // Resposta 204 No Content é o padrão para pre-flight OPTIONS
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, serviceName, barberName, appointmentDate, appointmentTime }: ConfirmationEmailRequest = await req.json();
    
    console.log(`Sending confirmation email to ${clientEmail} for appointment on ${appointmentDate} at ${appointmentTime}`);

    const formattedDate = new Date(appointmentDate).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "BarberPro <onboarding@resend.dev>",
      to: [clientEmail],
      subject: "✅ Agendamento Confirmado - BarberPro",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">
                  <tr>
                    <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #d4a853 0%, #b8942e 100%);">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 24px; font-weight: bold;">✂️ BarberPro</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #d4a853; font-size: 20px;">Agendamento Confirmado!</h2>
                      <p style="margin: 0 0 24px 0; color: #e0e0e0; font-size: 16px; line-height: 1.5;">
                        Olá <strong>${clientName}</strong>, seu agendamento foi confirmado com sucesso!
                      </p>
                      
                      <table role="presentation" style="width: 100%; background-color: #252525; border-radius: 12px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="color: #888; font-size: 14px;">Serviço</span><br>
                                  <span style="color: #fff; font-size: 16px; font-weight: 600;">${serviceName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="color: #888; font-size: 14px;">Barbeiro</span><br>
                                  <span style="color: #fff; font-size: 16px; font-weight: 600;">${barberName}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="color: #888; font-size: 14px;">Data</span><br>
                                  <span style="color: #d4a853; font-size: 16px; font-weight: 600;">${formattedDate}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="color: #888; font-size: 14px;">Horário</span><br>
                                  <span style="color: #d4a853; font-size: 18px; font-weight: bold;">${appointmentTime}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.5;">
                        Você receberá um lembrete 24 horas antes do seu agendamento.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; background-color: #151515; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        © ${new Date().getFullYear()} BarberPro. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-confirmation-email function:", error);
    
    // Tipagem Segura: Trata 'error' como 'unknown' (inferido pelo TypeScript)
    const errorMessage = 
      error instanceof Error ? error.message : "Um erro desconhecido ocorreu";
      
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);