import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Scissors,
  ArrowLeft,
  Check,
  User,
  Clock,
  Calendar as CalendarIcon,
  Phone,
} from "lucide-react";
import { format, addDays, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Barber {
  id: string;
  name: string;
  photo_url: string | null;
  work_start_time: string;
  work_end_time: string;
  work_days: number[];
}

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();
    fetchBarbers();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      generateTimeSlots();
      fetchBookedSlots();
    }
  }, [selectedBarber, selectedDate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setClientName(data.full_name || "");
      setClientPhone(data.phone || "");
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setServices(data);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase
      .from("barbers")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setBarbers(data);
  };

  const fetchBookedSlots = async () => {
    if (!selectedBarber || !selectedDate) return;

    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("barber_id", selectedBarber.id)
      .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      .neq("status", "cancelled");

    if (data) {
      setBookedSlots(data.map((apt) => apt.appointment_time.slice(0, 5)));
    }
  };

  const generateTimeSlots = () => {
    if (!selectedBarber) return;

    const slots: string[] = [];
    const [startHour, startMinute] = selectedBarber.work_start_time
      .split(":")
      .map(Number);
    const [endHour, endMinute] = selectedBarber.work_end_time
      .split(":")
      .map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeSlot = `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`;
      slots.push(timeSlot);

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    setAvailableSlots(slots);
  };

  const isDateDisabled = (date: Date) => {
    if (!selectedBarber) return true;

    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;

    const dayOfWeek = date.getDay();
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    return !selectedBarber.work_days.includes(adjustedDay);
  };

  const handleSubmit = async () => {
    // 1. VERIFICAÇÃO DE CAMPOS OBRIGATÓRIOS
    if (
      !user ||
      !selectedService ||
      !selectedBarber ||
      !selectedDate ||
      !selectedTime
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Converte a data selecionada para o formato do banco de dados (para reutilização)
    const appointmentDateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      // ----------------------------------------------------
      // PASSO 1: VERIFICAÇÃO DE CONFLITO CRÍTICA (CONSULTA AO BD)
      // ----------------------------------------------------

      // Consulta para verificar se já existe um agendamento com a mesma chave:
      // (Barbeiro ID, Data e Horário)
      const { data: existingAppointment, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("barber_id", selectedBarber.id)
        .eq("appointment_date", appointmentDateStr)
        .eq("appointment_time", selectedTime)
        .maybeSingle();

      if (checkError) {
        // Se houver erro na consulta, lançamos um erro para o bloco catch
        throw new Error(
          "Erro ao verificar a disponibilidade do horário: " +
            checkError.message
        );
      }

      // Se a consulta retornar dados, HÁ UM CONFLITO. Lançamos o erro e o código PARA AQUI.
      if (existingAppointment) {
        throw new Error(
          "Este horário já foi reservado! Por favor, volte e escolha um horário ou barbeiro diferente."
        );
      }

      // ----------------------------------------------------
      // PASSO 2: INSERÇÃO (SÓ EXECUTA SE NÃO HOUVE CONFLITO ACIMA)
      // ----------------------------------------------------

      const { error: insertError } = await supabase
        .from("appointments")
        .insert({
          client_id: user.id,
          barber_id: selectedBarber.id,
          service_id: selectedService.id,
          appointment_date: appointmentDateStr,
          appointment_time: selectedTime,
          client_name: clientName || user.email?.split("@")[0] || "Cliente",
          client_email: user.email || "",
          client_phone: clientPhone,
        });

      // Se houver erro no INSERT (ex: falha de conexão), LANÇA o erro para o catch
      if (insertError) throw insertError;

      // ----------------------------------------------------
      // PASSO 3: SUCESSO E NOTIFICAÇÕES (APENAS SE O INSERT FOI BEM-SUCEDIDO)
      // ----------------------------------------------------

      // Trigger email edge function (non-blocking)
      supabase.functions
        .invoke("send-confirmation-email", {
          body: {
            clientEmail: user.email,
            clientName: clientName,
            serviceName: selectedService.name,
            barberName: selectedBarber.name,
            appointmentDate: format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            }),
            appointmentTime: selectedTime,
          },
        })
        .catch(console.error);

      // TOAST DE SUCESSO
      toast({
        title: "Agendamento confirmado!",
        description: "Você receberá um e-mail de confirmação",
      });

      // REDIRECIONAMENTO
      navigate("/cliente");
      // Dentro da sua função handleSubmit no Booking.tsx
    } catch (error: any) {
      // 1. Define uma mensagem de erro padrão
      let errorMessage = "Ocorreu um erro desconhecido.";

      // 2. Tenta extrair a mensagem do objeto de erro
      if (error && typeof error === "object" && error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // 3. Exibe o toast com a mensagem de erro capturada
      toast({
        title: "Erro ao agendar",
        description: errorMessage, // Agora usa a variável segura
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/cliente"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">
                Agendar
              </span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 w-12 sm:w-24 mx-2 transition-all ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Serviço</span>
            <span>Barbeiro</span>
            <span>Data/Hora</span>
            <span>Confirmar</span>
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              Escolha o Serviço
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`p-5 rounded-xl border text-left transition-all duration-300 ${
                    selectedService?.id === service.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <p className="font-display font-semibold text-foreground">
                    {service.name}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-primary">
                    R$ {service.price.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
            {services.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum serviço disponível no momento
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Barber */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              Escolha o Barbeiro
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => {
                    setSelectedBarber(barber);
                    setStep(3);
                  }}
                  className={`p-5 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 ${
                    selectedBarber?.id === barber.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {barber.photo_url ? (
                      <img
                        src={barber.photo_url}
                        alt={barber.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">
                      {barber.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {barber.work_start_time.slice(0, 5)} -{" "}
                      {barber.work_end_time.slice(0, 5)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {barbers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum barbeiro disponível no momento
              </div>
            )}
            <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              Escolha Data e Horário
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={isDateDisabled}
                  locale={ptBR}
                  className="mx-auto"
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                />
              </div>

              {selectedDate && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Horários disponíveis
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => !isBooked && setSelectedTime(slot)}
                          disabled={isBooked}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            isBooked
                              ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                              : selectedTime === slot
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-primary/20"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="gold"
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">
              Confirmar Agendamento
            </h2>

            <div className="rounded-xl border border-border bg-card p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium text-foreground">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barbeiro</span>
                  <span className="font-medium text-foreground">
                    {selectedBarber?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium text-foreground">
                    {selectedDate &&
                      format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium text-foreground">
                    {selectedTime}
                  </span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {selectedService?.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Seus dados</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="pl-10"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="pl-10"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="gold"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Confirmando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
