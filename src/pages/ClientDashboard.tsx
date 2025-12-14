import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Scissors, LogOut, Calendar, Clock, User, Plus, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  barbers: { name: string } | null;
  services: { name: string; price: number } | null;
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        barbers (name),
        services (name, price)
      `)
      .eq('client_id', user.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (!error && data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string, date: string) => {
    const appointmentDate = parseISO(date);
    const isPastAppointment = isPast(appointmentDate) && !isToday(appointmentDate);

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive">
          <XCircle className="h-3 w-3" />
          Cancelado
        </span>
      );
    }

    if (isPastAppointment || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-success/10 text-success">
          <CheckCircle className="h-3 w-3" />
          Concluído
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
        <Clock className="h-3 w-3" />
        Agendado
      </span>
    );
  };

  const upcomingAppointments = appointments.filter((apt) => {
    const appointmentDate = parseISO(apt.appointment_date);
    return !isPast(appointmentDate) || isToday(appointmentDate);
  });

  const pastAppointments = appointments.filter((apt) => {
    const appointmentDate = parseISO(apt.appointment_date);
    return isPast(appointmentDate) && !isToday(appointmentDate);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">BarberPro</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Meus Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie seus horários na barbearia</p>
          </div>
          <Link to="/agendar">
            <Button variant="gold" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-primary">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Agendamentos
              </h2>
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum agendamento futuro</p>
                  <Link to="/agendar">
                    <Button variant="gold">Agendar Agora</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 shadow-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-display font-semibold text-foreground">
                            {apt.services?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            com {apt.barbers?.name}
                          </p>
                        </div>
                        {getStatusBadge(apt.status, apt.appointment_date)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(apt.appointment_date), "dd 'de' MMM", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time.slice(0, 5)}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-lg font-semibold text-primary">
                          R$ {apt.services?.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Histórico
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pastAppointments.slice(0, 6).map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-border bg-card/50 p-5 opacity-75"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-display font-semibold text-foreground">
                            {apt.services?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            com {apt.barbers?.name}
                          </p>
                        </div>
                        {getStatusBadge(apt.status, apt.appointment_date)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(apt.appointment_date), "dd 'de' MMM", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
