import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-reminder-emails function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get appointments that are 24 hours from now and haven't received reminder yet
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    console.log(`Checking for appointments on ${tomorrowDate}`);

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_name,
        client_email,
        appointment_date,
        appointment_time,
        reminder_email_sent,
        barbers (name),
        services (name)
      `)
      .eq('appointment_date', tomorrowDate)
      .eq('reminder_email_sent', false)
      .eq('status', 'scheduled');

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

    const results = [];

    for (const appointment of appointments || []) {
      try {
        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const barberName = (appointment.barbers as any)?.name || 'Barbeiro';
        const serviceName = (appointment.services as any)?.name || 'Serviço';

        console.log(`Sending reminder to ${appointment.client_email}`);

        const emailResponse = await resend.emails.send({
          from: "BarberPro <onboarding@resend.dev>",
          to: [appointment.client_email],
          subject: "⏰ Lembrete: Seu agendamento é amanhã! - BarberPro",
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
                          <h2 style="margin: 0 0 16px 0; color: #d4a853; font-size: 20px;">⏰ Lembrete de Agendamento</h2>
                          <p style="margin: 0 0 24px 0; color: #e0e0e0; font-size: 16px; line-height: 1.5;">
                            Olá <strong>${appointment.client_name}</strong>, não esqueça! Seu agendamento é <strong>amanhã</strong>!
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
                                      <span style="color: #d4a853; font-size: 18px; font-weight: bold;">${appointment.appointment_time.slice(0, 5)}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.5;">
                            Estamos ansiosos para atendê-lo! Até amanhã! 💈
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

        // Mark reminder as sent
        await supabase
          .from('appointments')
          .update({ reminder_email_sent: true })
          .eq('id', appointment.id);

        console.log(`Reminder sent successfully to ${appointment.client_email}`);
        results.push({ id: appointment.id, success: true, email: emailResponse });
      } catch (emailError: any) {
        console.error(`Error sending reminder to ${appointment.client_email}:`, emailError);
        results.push({ id: appointment.id, success: false, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
